# コンテナ間通信

## 概要

このセクションでは、Dockerコンテナ間でどのように通信が行われるのか、DNS解決の仕組み、様々な通信パターンについて学びます。

## コンテナ間通信の基本

### 同一ネットワーク内での通信

同じDockerネットワークに属するコンテナは、お互いに通信できます。

```bash
# カスタムネットワークを作成
docker network create app-network

# 2つのコンテナを同じネットワークに接続
docker run -d --name web --network app-network nginx
docker run -d --name client --network app-network alpine sleep 3600

# clientからwebへ通信（コンテナ名で解決）
docker exec client ping -c 3 web
# PING web (172.18.0.2): 56 data bytes
# 64 bytes from 172.18.0.2: seq=0 ttl=64 time=0.089 ms

# HTTPリクエストも可能
docker exec client wget -qO- http://web:80
```

### 通信の仕組み

```
┌─────────────────────────────────────────────────────────────┐
│                     app-network                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Docker内蔵DNSサーバー (127.0.0.11)          ││
│  │                                                           ││
│  │    web     → 172.18.0.2                                  ││
│  │    client  → 172.18.0.3                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                          ▲                                   │
│           ┌──────────────┴───────────────┐                 │
│           │                              │                  │
│    ┌──────┴──────┐              ┌───────┴─────┐           │
│    │    web      │              │   client    │            │
│    │ 172.18.0.2  │◄────────────►│ 172.18.0.3  │            │
│    └─────────────┘              └─────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## DockerのDNS解決

### 内蔵DNSサーバー

ユーザー定義ネットワークでは、Dockerが自動的にDNS解決を提供します。

```bash
# DNSサーバーの確認
docker exec client cat /etc/resolv.conf
# nameserver 127.0.0.11
# options ndots:0

# nslookupでDNS解決を確認
docker run --rm --network app-network alpine nslookup web
# Server:         127.0.0.11
# Address:        127.0.0.11:53
#
# Non-authoritative answer:
# Name:   web
# Address: 172.18.0.2
```

### DNS解決の特徴

| 特徴 | 説明 |
|------|------|
| コンテナ名 | コンテナ名で解決可能 |
| ネットワークエイリアス | 複数の名前を設定可能 |
| 自動更新 | コンテナの追加/削除で自動更新 |
| 分離 | 異なるネットワーク間では解決不可 |

## ネットワークエイリアス

コンテナに複数の名前（エイリアス）を設定できます。

```bash
# エイリアスを設定してコンテナを起動
docker run -d \
  --name mysql-primary \
  --network app-network \
  --network-alias db \
  --network-alias mysql \
  --network-alias database \
  mysql:8 \
  --default-authentication-plugin=mysql_native_password

# どのエイリアスでもアクセス可能
docker exec client ping -c 1 db
docker exec client ping -c 1 mysql
docker exec client ping -c 1 database
docker exec client ping -c 1 mysql-primary
```

### エイリアスの活用例

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8
    networks:
      default:
        aliases:
          - db
          - database
          - mysql-server

  app:
    image: myapp
    depends_on:
      - mysql
    environment:
      # どのエイリアスでも接続可能
      - DATABASE_HOST=db
```

## 複数ネットワークへの接続

コンテナは複数のネットワークに同時に接続できます。

```bash
# 2つのネットワークを作成
docker network create frontend-network
docker network create backend-network

# APIサーバーを両方のネットワークに接続
docker run -d --name api-server --network frontend-network nginx

# 既存のコンテナに別のネットワークを追加
docker network connect backend-network api-server

# Webサーバー（フロントエンドのみ）
docker run -d --name web-server --network frontend-network nginx

# データベース（バックエンドのみ）
docker run -d --name db-server --network backend-network mysql:8

# ネットワーク接続を確認
docker inspect api-server --format '{{json .NetworkSettings.Networks}}' | jq
```

### 複数ネットワーク構成図

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────┐   ┌─────────────────────────┐        │
│  │    frontend-network      │   │    backend-network       │        │
│  │                           │   │                           │        │
│  │  ┌──────────────┐       │   │       ┌──────────────┐   │        │
│  │  │  web-server  │       │   │       │   db-server   │   │        │
│  │  └──────────────┘       │   │       └──────────────┘   │        │
│  │         │                │   │              ▲           │        │
│  │         │                │   │              │           │        │
│  │         ▼                │   │              │           │        │
│  │  ┌──────────────────────┴───┴──────────────┴──┐       │        │
│  │  │              api-server                      │       │        │
│  │  │    (両方のネットワークに接続)                 │       │        │
│  │  └──────────────────────────────────────────────┘       │        │
│  │                           │   │                           │        │
│  └───────────────────────────┘   └───────────────────────────┘        │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## コンテナリンク（レガシー）

**注意**: `--link` オプションはレガシー機能であり、非推奨です。代わりにユーザー定義ネットワークを使用してください。

```bash
# レガシーなリンク方法（非推奨）
docker run -d --name db mysql:8
docker run -d --name web --link db:database nginx

# 推奨される方法（カスタムネットワーク）
docker network create my-network
docker run -d --name db --network my-network mysql:8
docker run -d --name web --network my-network nginx
```

## 通信パターン

### パターン1: サービス間の直接通信

```bash
# シンプルな構成
docker network create simple-network

docker run -d --name redis --network simple-network redis:alpine
docker run -d --name app --network simple-network \
  -e REDIS_HOST=redis \
  myapp
```

### パターン2: リバースプロキシパターン

```bash
# Nginxをリバースプロキシとして使用
docker network create proxy-network

# バックエンドアプリケーション
docker run -d --name app1 --network proxy-network \
  --network-alias backend \
  myapp:v1

docker run -d --name app2 --network proxy-network \
  --network-alias backend \
  myapp:v1

# Nginxリバースプロキシ（ロードバランシング）
docker run -d --name proxy --network proxy-network \
  -p 80:80 \
  nginx
```

### パターン3: マイクロサービス構成

```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend

  user-service:
    image: user-service:latest
    networks:
      - frontend
      - user-db

  order-service:
    image: order-service:latest
    networks:
      - frontend
      - order-db

  user-db:
    image: mysql:8
    networks:
      - user-db

  order-db:
    image: mysql:8
    networks:
      - order-db

networks:
  frontend:
  user-db:
    internal: true
  order-db:
    internal: true
```

## ネットワーク分離によるセキュリティ

```bash
# 公開ネットワーク（外部からアクセス可能）
docker network create public-network

# 内部ネットワーク（外部からアクセス不可）
docker network create --internal private-network

# Webサーバー（公開）
docker run -d --name web \
  --network public-network \
  -p 80:80 \
  nginx

# Webサーバーを内部ネットワークにも接続
docker network connect private-network web

# データベース（内部のみ）
docker run -d --name db \
  --network private-network \
  mysql:8

# webからdbへは通信可能
docker exec web ping -c 2 db  # 成功

# dbから外部への通信は不可
docker exec db ping -c 2 8.8.8.8  # 失敗
```

### セキュリティ分離図

```
┌─────────────────────────────────────────────────────────────┐
│                      ホストマシン                            │
│                                                               │
│                         外部                                  │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │               public-network                              ││
│  │                      │                                    ││
│  │    ┌─────────────────┴─────────────────┐                ││
│  │    │              web                   │                ││
│  │    │        (公開 + 内部)              │                ││
│  │    └─────────────────┬─────────────────┘                ││
│  └──────────────────────┼───────────────────────────────────┘│
│                          │                                    │
│  ┌──────────────────────┼───────────────────────────────────┐│
│  │       private-network (internal)                          ││
│  │                      │                                    ││
│  │    ┌─────────────────┴─────────────────┐                ││
│  │    │               db                   │                ││
│  │    │         (内部のみ)                │                ││
│  │    └───────────────────────────────────┘                ││
│  │                      ✗ 外部通信不可                       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 通信のトラブルシューティング

### 接続確認コマンド

```bash
# pingによる疎通確認
docker exec container1 ping -c 3 container2

# DNSの確認
docker exec container1 nslookup container2

# ポートの確認
docker exec container1 nc -zv container2 80

# HTTPアクセスの確認
docker exec container1 curl -I http://container2:80

# ネットワーク設定の確認
docker inspect container1 --format '{{json .NetworkSettings.Networks}}'
```

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 名前解決できない | デフォルトbridgeを使用 | カスタムネットワークを使用 |
| 通信できない | 異なるネットワーク | 同じネットワークに接続 |
| ポートに接続できない | サービス未起動 | コンテナ内のサービス状態を確認 |
| 外部通信できない | internalネットワーク | 通常のネットワークを使用 |

## クリーンアップ

```bash
# 作成したリソースを削除
docker stop web client api-server web-server db-server app1 app2 proxy redis app
docker rm web client api-server web-server db-server app1 app2 proxy redis app
docker network rm app-network frontend-network backend-network \
  simple-network proxy-network public-network private-network
```

## まとめ

- 同一ネットワーク内のコンテナはコンテナ名で通信できる
- DockerはユーザータイプネットワークでDNS解決を自動提供
- ネットワークエイリアスで複数の名前を設定可能
- コンテナは複数のネットワークに同時接続できる
- 内部ネットワーク（`--internal`）でセキュリティ分離が可能
- `--link` は非推奨、カスタムネットワークを使用すべき

次のセクションでは、Dockerボリュームの基礎について学びます。
