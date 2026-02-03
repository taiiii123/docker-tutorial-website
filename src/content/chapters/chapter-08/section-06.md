# Docker Swarmの基礎

## 概要

このセクションでは、Docker組み込みのオーケストレーションツールであるDocker Swarmについて学びます。複数のDockerホストをクラスタとして管理し、コンテナの自動配置、スケーリング、高可用性を実現します。

## Docker Swarmとは

**Docker Swarm**は、複数のDockerホストをまとめて1つのクラスタとして扱うためのネイティブオーケストレーションツールです。

### 特徴

| 特徴 | 説明 |
|------|------|
| Docker組み込み | 追加インストール不要 |
| シンプル | Docker CLIで操作可能 |
| 宣言的 | 望ましい状態を定義 |
| スケーリング | コンテナ数を簡単に増減 |
| ロードバランシング | 自動的にリクエストを分散 |
| ローリングアップデート | 無停止デプロイ |

### Swarm vs Kubernetes

| 観点 | Docker Swarm | Kubernetes |
|------|-------------|------------|
| 学習曲線 | 緩やか | 急峻 |
| 機能 | 基本的 | 豊富 |
| エコシステム | 限定的 | 広大 |
| 適用規模 | 小〜中規模 | 中〜大規模 |
| 運用負荷 | 低い | 高い |

## Swarmクラスタの構成

```
┌─────────────────────────────────────────────────────────────┐
│                      Swarm クラスタ                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │  Manager Node   │ ←──→ │  Manager Node   │              │
│  │   (Leader)      │      │   (Follower)    │              │
│  │                 │      │                 │              │
│  │  ・クラスタ管理  │      │  ・フェイルオーバー│              │
│  │  ・スケジューリング│      │  ・Raft合意     │              │
│  │  ・API提供      │      │                 │              │
│  └────────┬────────┘      └────────┬────────┘              │
│           │                        │                        │
│           └────────────┬───────────┘                        │
│                        │                                    │
│           ┌────────────┼───────────┐                        │
│           │            │           │                        │
│           ▼            ▼           ▼                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Worker Node │ │ Worker Node │ │ Worker Node │           │
│  │             │ │             │ │             │           │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │           │
│  │ │Container│ │ │ │Container│ │ │ │Container│ │           │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │           │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │           │
│  │ │Container│ │ │ │Container│ │ │ │Container│ │           │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### ノードの役割

| 役割 | 説明 |
|------|------|
| Manager | クラスタの管理、タスクのスケジューリング |
| Worker | タスク（コンテナ）の実行 |
| Leader | Raftコンセンサスのリーダー（Manager内で選出） |

## Swarmの初期化

### シングルノードSwarm

```bash
# Swarmを初期化（現在のノードがManagerになる）
docker swarm init

# 出力例:
# Swarm initialized: current node (abc123) is now a manager.
# To add a worker to this swarm, run:
#     docker swarm join --token SWMTKN-1-xxx worker-token 192.168.1.10:2377
# To add a manager to this swarm, run:
#     docker swarm join-token manager
```

### マルチノードSwarm

```bash
# Manager側：初期化
docker swarm init --advertise-addr 192.168.1.10

# Worker追加用トークンの取得
docker swarm join-token worker

# Manager追加用トークンの取得
docker swarm join-token manager

# Worker側：クラスタに参加
docker swarm join --token SWMTKN-1-xxx 192.168.1.10:2377
```

### ノードの確認

```bash
# ノード一覧
docker node ls

# 出力例:
# ID                           HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
# abc123 *                     manager1   Ready    Active         Leader
# def456                       worker1    Ready    Active
# ghi789                       worker2    Ready    Active
```

## サービスの管理

### サービスとは

**サービス**は、Swarmにおける基本的なデプロイ単位です。1つのイメージから複数のレプリカ（コンテナ）を作成し、クラスタ全体に分散配置します。

```
┌─────────────────────────────────────────────────────────────┐
│                       Service: webapp                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Task 1     │  │   Task 2     │  │   Task 3     │      │
│  │  (Replica)   │  │  (Replica)   │  │  (Replica)   │      │
│  │              │  │              │  │              │      │
│  │  Container   │  │  Container   │  │  Container   │      │
│  │  on Node A   │  │  on Node B   │  │  on Node C   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### サービスの作成

```bash
# 基本的なサービス作成
docker service create --name webapp nginx:latest

# レプリカ数を指定
docker service create --name webapp --replicas 3 nginx:latest

# ポート公開
docker service create --name webapp --replicas 3 -p 80:80 nginx:latest

# 環境変数
docker service create --name webapp \
  --replicas 3 \
  -e NODE_ENV=production \
  myapp:latest
```

### サービスの確認

```bash
# サービス一覧
docker service ls

# サービスの詳細
docker service inspect webapp

# タスク（コンテナ）の状態
docker service ps webapp

# サービスログ
docker service logs webapp
docker service logs -f webapp  # リアルタイム
```

### サービスの更新

```bash
# イメージの更新
docker service update --image nginx:1.25 webapp

# レプリカ数の変更
docker service scale webapp=5

# 複数サービスを同時にスケール
docker service scale webapp=5 api=3

# 環境変数の追加
docker service update --env-add NEW_VAR=value webapp

# リソース制限の追加
docker service update \
  --limit-cpu 0.5 \
  --limit-memory 512M \
  webapp
```

### サービスの削除

```bash
# サービスの削除
docker service rm webapp

# 全サービスの削除
docker service rm $(docker service ls -q)
```

## ローリングアップデート

### 設定

```bash
docker service create --name webapp \
  --replicas 10 \
  --update-parallelism 2 \
  --update-delay 10s \
  --update-failure-action rollback \
  --update-max-failure-ratio 0.2 \
  nginx:latest
```

| オプション | 説明 |
|-----------|------|
| `--update-parallelism` | 同時に更新するタスク数 |
| `--update-delay` | 更新間隔 |
| `--update-failure-action` | 失敗時のアクション（pause/continue/rollback） |
| `--update-max-failure-ratio` | 許容する失敗率 |

### アップデートの実行

```bash
# イメージを更新
docker service update --image nginx:1.25 webapp

# 更新状態の確認
docker service ps webapp

# 更新の進行状況
docker service inspect --pretty webapp
```

### ロールバック

```bash
# 前のバージョンにロールバック
docker service rollback webapp

# 自動ロールバック設定でのサービス作成
docker service create --name webapp \
  --update-failure-action rollback \
  nginx:latest
```

## Docker Stack

**Stack**は、複数のサービスをまとめて管理するための機能です。Docker Composeファイルを使用してデプロイします。

### Stack用のComposeファイル

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
    networks:
      - webnet

  api:
    image: myapi:latest
    environment:
      - DATABASE_URL=postgres://db:5432/mydb
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
    networks:
      - webnet
      - backend

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.db == true
    secrets:
      - db_password
    networks:
      - backend

networks:
  webnet:
  backend:

volumes:
  db-data:

secrets:
  db_password:
    external: true
```

### Stackのデプロイ

```bash
# Stackのデプロイ
docker stack deploy -c docker-compose.yml myapp

# Stack一覧
docker stack ls

# Stackのサービス一覧
docker stack services myapp

# Stackのタスク一覧
docker stack ps myapp

# Stackの削除
docker stack rm myapp
```

## Secrets管理

Swarmには機密情報を安全に管理する機能があります。

### Secretの作成

```bash
# ファイルからSecretを作成
echo "mypassword" | docker secret create db_password -

# ファイルから作成
docker secret create ssl_cert ./cert.pem

# Secret一覧
docker secret ls

# Secret詳細
docker secret inspect db_password
```

### Secretの使用

```yaml
version: '3.8'

services:
  db:
    image: postgres:16
    secrets:
      - db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    external: true
```

コンテナ内では `/run/secrets/db_password` としてマウントされます。

## Configの管理

設定ファイルを管理するための機能です。

```bash
# Configの作成
docker config create nginx_config ./nginx.conf

# Config一覧
docker config ls
```

```yaml
version: '3.8'

services:
  web:
    image: nginx:latest
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf

configs:
  nginx_config:
    external: true
```

## ネットワーキング

### オーバーレイネットワーク

Swarmクラスタ全体でコンテナが通信できるネットワークです。

```bash
# オーバーレイネットワークの作成
docker network create --driver overlay mynetwork

# 暗号化オプション
docker network create --driver overlay --opt encrypted mynetwork
```

### Ingress ネットワーク

外部からのリクエストを任意のノードで受け付け、適切なコンテナにルーティングします。

```
┌─────────────────────────────────────────────────────────────┐
│                     外部リクエスト                           │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Ingress Network                        │   │
│  │        (どのノードでもポート80でアクセス可能)          │   │
│  └─────────────────────────────────────────────────────┘   │
│            │              │              │                  │
│            ▼              ▼              ▼                  │
│       ┌────────┐    ┌────────┐    ┌────────┐              │
│       │Node 1  │    │Node 2  │    │Node 3  │              │
│       │        │    │        │    │        │              │
│       │ ┌────┐ │    │ ┌────┐ │    │ ┌────┐ │              │
│       │ │web │ │    │ │web │ │    │ │web │ │              │
│       │ └────┘ │    │ └────┘ │    │ └────┘ │              │
│       └────────┘    └────────┘    └────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## ノードの管理

### ノードラベルの設定

```bash
# ラベルの追加
docker node update --label-add db=true worker1

# ラベルの確認
docker node inspect worker1 --format '{{.Spec.Labels}}'
```

### ノードの可用性

```bash
# ノードをドレイン（新しいタスクを受け付けない）
docker node update --availability drain worker1

# アクティブに戻す
docker node update --availability active worker1

# ノードをポーズ
docker node update --availability pause worker1
```

### 配置制約

```yaml
deploy:
  placement:
    constraints:
      - node.role == worker
      - node.labels.db == true
      - node.hostname == worker1
```

## Swarmの終了

```bash
# WorkerノードでSwarmを離脱
docker swarm leave

# Managerノードで強制離脱
docker swarm leave --force

# クラスタの完全削除（全ノードで実行）
docker swarm leave --force
```

## まとめ

- Docker SwarmはDocker組み込みのオーケストレーションツール
- `docker swarm init`でクラスタを初期化
- サービスは複数のレプリカを持つデプロイ単位
- Stackで複数サービスをまとめて管理
- Secrets/Configで機密情報と設定を安全に管理
- オーバーレイネットワークでクラスタ全体の通信を実現
- ローリングアップデートで無停止デプロイ
- ノードラベルと配置制約でタスクの配置を制御

これでChapter 8「本番環境」は終了です。次のチャプターでは、より高度なトピックについて学びます。
