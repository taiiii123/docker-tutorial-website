# Dockerネットワークの基礎

## 概要

このセクションでは、Dockerにおけるネットワーキングの基本概念を学びます。コンテナがどのように通信を行うのか、なぜネットワーク設定が重要なのかを理解しましょう。

## コンテナネットワーキングとは

Dockerコンテナは隔離された環境で実行されますが、多くの場合、外部の世界や他のコンテナと通信する必要があります。**Dockerネットワーキング**は、この通信を可能にする仕組みです。

### なぜネットワーク設定が重要か

| 目的 | 説明 |
|------|------|
| コンテナ間通信 | 複数のコンテナが連携してアプリケーションを構成する |
| 外部公開 | Webアプリケーションを外部からアクセス可能にする |
| セキュリティ | 必要な通信のみを許可し、不要な通信を遮断する |
| サービス検出 | コンテナ名でお互いを見つけられるようにする |

## Dockerネットワークの基本コマンド

### ネットワーク一覧の確認

```bash
# 現在のDockerネットワーク一覧を表示
docker network ls

# 出力例:
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
b2c3d4e5f6a1   host      host      local
c3d4e5f6a1b2   none      null      local
```

デフォルトでDockerは3つのネットワークを作成します。

### ネットワークの詳細確認

```bash
# bridgeネットワークの詳細を表示
docker network inspect bridge

# 出力例（抜粋）:
[
    {
        "Name": "bridge",
        "Id": "a1b2c3d4e5f6...",
        "Driver": "bridge",
        "Scope": "local",
        "IPAM": {
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Containers": {}
    }
]
```

## デフォルトのbridgeネットワーク

コンテナを起動する際、特にネットワークを指定しない場合、デフォルトの `bridge` ネットワークに接続されます。

### 動作確認

```bash
# コンテナを起動（デフォルトでbridgeネットワークに接続）
docker run -d --name web nginx

# コンテナのネットワーク情報を確認
docker inspect web --format '{{json .NetworkSettings.Networks}}' | jq

# 出力例:
{
  "bridge": {
    "IPAddress": "172.17.0.2",
    "Gateway": "172.17.0.1",
    "MacAddress": "02:42:ac:11:00:02"
  }
}
```

### デフォルトbridgeネットワークの構造

```
┌───────────────────────────────────────────────────────┐
│                      ホストマシン                      │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │              docker0 (bridge)                    │ │
│  │                172.17.0.1                        │ │
│  └────────────┬─────────────────┬───────────────────┘ │
│               │                 │                     │
│    ┌──────────┴───────┐  ┌──────┴───────────┐        │
│    │   Container A    │  │   Container B    │        │
│    │   172.17.0.2     │  │   172.17.0.3     │        │
│    └──────────────────┘  └──────────────────┘        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## ポートマッピング

コンテナ内のサービスを外部からアクセス可能にするには、ポートマッピングを設定します。

### 基本的なポートマッピング

```bash
# ホストのポート8080をコンテナのポート80にマッピング
docker run -d -p 8080:80 --name web nginx

# ランダムなホストポートを割り当て
docker run -d -P --name web2 nginx

# 特定のIPアドレスにバインド
docker run -d -p 127.0.0.1:8080:80 --name web3 nginx

# 複数ポートをマッピング
docker run -d -p 80:80 -p 443:443 --name web4 nginx
```

### ポートマッピングの確認

```bash
# コンテナのポートマッピングを確認
docker port web

# 出力例:
80/tcp -> 0.0.0.0:8080

# 全コンテナのポート情報を一覧表示
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### ポートマッピングの図解

```
          外部（インターネット）
                 │
                 ▼
    ┌─────────────────────────┐
    │      ホストマシン         │
    │    http://localhost:8080 │
    │            │             │
    │            ▼             │
    │    ┌──────────────────┐  │
    │    │  Dockerネットワーク  │  │
    │    │       │          │  │
    │    │       ▼          │  │
    │    │  ┌──────────┐    │  │
    │    │  │Container │    │  │
    │    │  │  :80     │    │  │
    │    │  └──────────┘    │  │
    │    └──────────────────┘  │
    └─────────────────────────┘
```

## ネットワーク関連の主要コマンド

| コマンド | 説明 |
|---------|------|
| `docker network ls` | ネットワーク一覧を表示 |
| `docker network create` | 新しいネットワークを作成 |
| `docker network rm` | ネットワークを削除 |
| `docker network inspect` | ネットワークの詳細を表示 |
| `docker network connect` | コンテナをネットワークに接続 |
| `docker network disconnect` | コンテナをネットワークから切断 |
| `docker network prune` | 未使用のネットワークを削除 |

## 実践例：Webサーバーの公開

```bash
# Nginxコンテナを起動してポート80を公開
docker run -d \
  --name my-nginx \
  -p 80:80 \
  nginx

# ブラウザまたはcurlでアクセス
curl http://localhost

# コンテナのIPアドレスを確認
docker inspect my-nginx --format '{{.NetworkSettings.IPAddress}}'

# クリーンアップ
docker stop my-nginx && docker rm my-nginx
```

## まとめ

- Dockerネットワークはコンテナ間通信と外部公開を可能にする
- デフォルトでは `bridge`、`host`、`none` の3つのネットワークが存在
- コンテナは起動時にデフォルトで `bridge` ネットワークに接続される
- ポートマッピング（`-p`）でコンテナのサービスを外部に公開できる
- `docker network` コマンドでネットワークを管理できる

次のセクションでは、Dockerで使用できる様々なネットワークの種類について詳しく学びます。
