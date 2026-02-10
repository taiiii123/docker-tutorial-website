# カスタムネットワークの作成

## 概要

このセクションでは、Docker カスタムネットワークの作成方法と、様々なオプションを使った設定方法を学びます。カスタムネットワークを使うことで、より柔軟で安全なコンテナ間通信が可能になります。

## なぜカスタムネットワークを使うのか

デフォルトの bridge ネットワークには以下の制限があります。

| 制限 | 説明 |
|------|------|
| DNS解決なし | コンテナ名での通信ができない |
| 設定変更不可 | サブネットやゲートウェイの変更ができない |
| 全コンテナ共有 | ネットワークの分離ができない |

カスタムネットワークを使用することで、これらの制限を解決できます。

## 基本的なネットワーク作成

### シンプルな作成

```bash
# カスタムbridgeネットワークを作成
docker network create my-network

# 作成されたネットワークを確認
docker network ls

# 出力例:
NETWORK ID     NAME         DRIVER    SCOPE
a1b2c3d4e5f6   bridge       bridge    local
d4e5f6a1b2c3   host         host      local
e5f6a1b2c3d4   my-network   bridge    local
f6a1b2c3d4e5   none         null      local
```

### ネットワークの詳細確認

```bash
# ネットワークの詳細を表示
docker network inspect my-network

# 出力例（抜粋）:
[
    {
        "Name": "my-network",
        "Driver": "bridge",
        "IPAM": {
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Options": {},
        "Containers": {}
    }
]
```

## ネットワークのオプション設定

### サブネットとゲートウェイの指定

```bash
# サブネットとゲートウェイを明示的に指定
docker network create \
  --subnet=192.168.100.0/24 \
  --gateway=192.168.100.1 \
  custom-network

# 確認
docker network inspect custom-network --format '{{.IPAM.Config}}'
# 出力: [{192.168.100.0/24  192.168.100.1 map[]}]
```

### IP範囲の制限

```bash
# 割り当て可能なIP範囲を制限
docker network create \
  --subnet=10.10.0.0/16 \
  --ip-range=10.10.5.0/24 \
  --gateway=10.10.0.1 \
  limited-network

# コンテナには10.10.5.0/24の範囲からIPが割り当てられる
```

### ネットワーク構造図

![カスタムネットワーク構造](/images/diagrams/custom-network-subnet.png)

## 固定IPアドレスの割り当て

カスタムネットワークでは、コンテナに固定IPアドレスを割り当てることができます。

```bash
# まずサブネット付きのネットワークを作成
docker network create \
  --subnet=172.20.0.0/16 \
  fixed-ip-network

# 固定IPを指定してコンテナを起動
docker run -d \
  --name db-server \
  --network fixed-ip-network \
  --ip 172.20.0.100 \
  mysql:8

# 別のコンテナも固定IPで起動
docker run -d \
  --name app-server \
  --network fixed-ip-network \
  --ip 172.20.0.101 \
  nginx

# IPアドレスを確認
docker inspect db-server --format '{{.NetworkSettings.Networks.fixed-ip-network.IPAddress}}'
# 出力: 172.20.0.100
```

## ネットワークドライバーオプション

### bridgeドライバーのオプション

```bash
# 様々なオプションを指定してネットワークを作成
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.name=my-bridge \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  --opt com.docker.network.bridge.enable_icc=true \
  advanced-network
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `bridge.name` | Linuxブリッジの名前 | 自動生成 |
| `bridge.enable_ip_masquerade` | IPマスカレード（NAT）の有効化 | true |
| `bridge.enable_icc` | コンテナ間通信の許可 | true |
| `bridge.host_binding_ipv4` | ホストバインドのIPv4アドレス | 0.0.0.0 |
| `bridge.mtu` | MTUサイズ | 1500 |

### MTU設定の例

```bash
# MTUを指定したネットワーク作成（VPN環境などで有用）
docker network create \
  --opt com.docker.network.driver.mtu=1400 \
  vpn-compatible-network
```

## ラベルの付与

ネットワークにラベルを付けて管理を容易にできます。

```bash
# ラベル付きネットワークを作成
docker network create \
  --label environment=production \
  --label team=backend \
  --label app=webservice \
  prod-network

# ラベルでフィルタリング
docker network ls --filter label=environment=production

# ラベルの確認
docker network inspect prod-network --format '{{json .Labels}}'
# 出力: {"app":"webservice","environment":"production","team":"backend"}
```

## 内部ネットワークの作成

外部からアクセスできない内部専用ネットワークを作成できます。

```bash
# 内部ネットワークを作成
docker network create \
  --internal \
  internal-network

# コンテナを内部ネットワークに接続
docker run -d --name internal-app --network internal-network alpine sleep 3600

# 外部への通信は不可
docker exec internal-app ping -c 2 8.8.8.8
# ping: sendto: Network is unreachable

# しかし同一ネットワーク内の他のコンテナとは通信可能
docker run -d --name internal-app2 --network internal-network alpine sleep 3600
docker exec internal-app ping -c 2 internal-app2
# 成功
```

### 内部ネットワークの用途

![内部ネットワーク（internal）構造](/images/diagrams/internal-network.png)

## IPv6ネットワークの作成

```bash
# IPv6対応ネットワークを作成
docker network create \
  --ipv6 \
  --subnet=2001:db8::/64 \
  --subnet=172.25.0.0/16 \
  dual-stack-network

# 確認
docker network inspect dual-stack-network --format '{{json .IPAM.Config}}'
```

## ネットワークの削除

```bash
# 特定のネットワークを削除
docker network rm my-network

# 未使用の全ネットワークを削除
docker network prune

# 確認なしで削除
docker network prune -f

# フィルタを使用して古いネットワークを削除
docker network prune --filter "until=24h"
```

## 実践例：開発環境用ネットワークの構築

```bash
# 開発用ネットワークを作成
docker network create \
  --subnet=10.100.0.0/24 \
  --gateway=10.100.0.1 \
  --label environment=development \
  dev-network

# データベースサーバー（固定IP）
docker run -d \
  --name dev-mysql \
  --network dev-network \
  --ip 10.100.0.10 \
  -e MYSQL_ROOT_PASSWORD=devpassword \
  -e MYSQL_DATABASE=devdb \
  mysql:8

# Redisキャッシュ（固定IP）
docker run -d \
  --name dev-redis \
  --network dev-network \
  --ip 10.100.0.11 \
  redis:alpine

# アプリケーションサーバー
docker run -d \
  --name dev-app \
  --network dev-network \
  -p 3000:3000 \
  -e DATABASE_HOST=dev-mysql \
  -e REDIS_HOST=dev-redis \
  node:20-alpine sleep 3600

# 接続確認
docker exec dev-app ping -c 2 dev-mysql
docker exec dev-app ping -c 2 dev-redis
docker exec dev-app ping -c 2 10.100.0.10

# クリーンアップ
docker stop dev-mysql dev-redis dev-app
docker rm dev-mysql dev-redis dev-app
docker network rm dev-network
```

## Docker Composeでのネットワーク定義

Docker Composeでもカスタムネットワークを定義できます。

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      frontend:
        ipv4_address: 172.28.0.10
      backend:

  api:
    image: node:20-alpine
    networks:
      - backend
      - database

  db:
    image: mysql:8
    networks:
      database:
        ipv4_address: 172.30.0.10

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
    labels:
      - "environment=production"

  backend:
    driver: bridge
    internal: true

  database:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
```

## まとめ

- `docker network create` でカスタムネットワークを作成できる
- `--subnet` と `--gateway` でIPアドレス範囲を指定できる
- `--ip` オプションでコンテナに固定IPを割り当てられる
- `--internal` で外部通信を遮断した内部ネットワークを作成できる
- `--label` でネットワークにメタデータを付与できる
- ドライバーオプション（`-o`）で詳細な設定が可能
- Docker Composeでもネットワーク設定を宣言的に定義できる

次のセクションでは、コンテナ間通信の詳細な仕組みとパターンについて学びます。
