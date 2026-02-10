# Dockerのアーキテクチャ

## 概要

このセクションでは、Dockerの内部アーキテクチャを理解し、各コンポーネントの役割と連携について学びます。

## Docker の全体構成

Docker は**クライアント・サーバーアーキテクチャ**を採用しています。

![Docker の全体構成](/images/diagrams/docker-architecture.png)

## 主要コンポーネント

### 1. Docker Client（クライアント）

ユーザーがDockerと対話するためのCLIツールです。

```bash
# Docker CLIコマンドの例
docker run nginx          # コンテナ実行
docker build -t myapp .   # イメージビルド
docker push myapp         # イメージをプッシュ
docker pull nginx         # イメージをプル
```

**特徴:**
- コマンドをDocker Daemonに送信
- REST APIを使用して通信
- リモートのDocker Daemonにも接続可能

### 2. Docker Daemon（デーモン）

バックグラウンドで動作し、Dockerオブジェクトを管理するサービスです。

```bash
# Docker Daemonの確認
systemctl status docker

# Docker Daemonのログ確認
journalctl -u docker.service
```

**主な責務:**
- コンテナの作成・実行・停止
- イメージの管理
- ネットワークの管理
- ボリュームの管理
- Docker APIリクエストの処理

### 3. Docker Registry（レジストリ）

Dockerイメージを保存・配布するためのリポジトリです。

| レジストリ | 説明 |
|-----------|------|
| Docker Hub | 公式の公開レジストリ |
| Amazon ECR | AWS のプライベートレジストリ |
| Google GCR | GCP のプライベートレジストリ |
| Azure ACR | Azure のプライベートレジストリ |
| 自前運用 | Harbor, Registryなど |

```bash
# Docker Hub からイメージを取得
docker pull nginx:latest

# プライベートレジストリからイメージを取得
docker pull myregistry.com/myapp:v1.0
```

## Docker オブジェクト

### イメージ（Images）

コンテナを作成するための読み取り専用テンプレートです。

```bash
# ローカルのイメージ一覧
docker images

# 出力例:
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    a6bd71f48f68   2 days ago     187MB
node         20        5d5d7b4e3a9c   1 week ago     1.1GB
```

**イメージのレイヤー構造:**

![イメージのレイヤー構造](/images/diagrams/image-layers.png)

### コンテナ（Containers）

イメージの実行可能なインスタンスです。

```bash
# 実行中のコンテナ一覧
docker ps

# 全コンテナ一覧（停止中も含む）
docker ps -a

# 出力例:
CONTAINER ID   IMAGE   COMMAND                  STATUS
a1b2c3d4e5f6   nginx   "/docker-entrypoint.…"  Up 2 hours
```

### ネットワーク（Networks）

コンテナ間の通信を管理します。

```bash
# ネットワーク一覧
docker network ls

# 出力例:
NETWORK ID     NAME      DRIVER    SCOPE
abc123def456   bridge    bridge    local
def456ghi789   host      host      local
ghi789jkl012   none      null      local
```

### ボリューム（Volumes）

データの永続化に使用します。

```bash
# ボリューム一覧
docker volume ls

# 出力例:
DRIVER    VOLUME NAME
local     mysql-data
local     app-logs
```

## Docker Engine の内部構造

Docker Engine は複数のコンポーネントで構成されています：

![Docker Engine の内部構造](/images/diagrams/docker-engine-internal.png)

### containerd

- コンテナのライフサイクル管理
- イメージの管理
- ストレージ管理

### runc

- OCI（Open Container Initiative）準拠のランタイム
- 実際にコンテナを作成・実行

## 通信フロー

`docker run nginx` を実行した場合のフロー：

![docker run nginx の実行フロー](/images/diagrams/docker-run-flow.png)

## Docker Desktop のアーキテクチャ

Windows/Mac では、Docker Desktop が軽量VMを使用してLinuxカーネルを提供します。

![Docker Desktop のアーキテクチャ](/images/diagrams/docker-desktop-arch.png)

**Apple Silicon の特徴:**
- ネイティブ ARM64 アーキテクチャで高速動作
- x86_64 イメージは Rosetta 2 でエミュレーション実行
- `--platform linux/amd64` で明示的にアーキテクチャ指定可能

```bash
# Apple Silicon で x86_64 イメージを実行
docker run --platform linux/amd64 nginx
```

## まとめ

- Docker は**クライアント・サーバーアーキテクチャ**
- **Docker Client**: ユーザーインターフェース（CLI）
- **Docker Daemon**: コンテナやイメージを管理するサービス
- **Registry**: イメージの保存・配布場所
- **Docker オブジェクト**: イメージ、コンテナ、ネットワーク、ボリューム
- **containerd + runc**: 実際のコンテナ実行を担当

次のセクションでは、Dockerのインストール方法を学びます。
