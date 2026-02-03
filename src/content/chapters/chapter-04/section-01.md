# Docker Composeとは

## 概要

このセクションでは、Docker Composeの概念と、マルチコンテナ管理における役割について学びます。Docker Composeを使うことで、複数のコンテナで構成されるアプリケーションを効率的に定義・実行できます。

## マルチコンテナアプリケーションの必要性

実際のアプリケーションは、単一のコンテナだけで動作することは稀です。例えば、Webアプリケーションでは以下のような構成が一般的です：

```
┌───────────────────────────────────────────────────────────┐
│                     典型的なWeb構成                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   Nginx     │   │   Node.js   │   │   MySQL     │     │
│  │  (リバース   │──▶│   (API      │──▶│  (データ    │     │
│  │  プロキシ)   │   │  サーバー)   │   │   ベース)   │     │
│  └─────────────┘   └─────────────┘   └─────────────┘     │
│        :80              :3000             :3306           │
│                                                           │
│  ┌─────────────┐                                          │
│  │   Redis     │◀── キャッシュ                            │
│  │ (キャッシュ)  │                                          │
│  └─────────────┘                                          │
│       :6379                                               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### dockerコマンドだけで管理する場合の問題

複数のコンテナを`docker run`コマンドだけで管理しようとすると、以下の問題が発生します：

```bash
# 1. ネットワークを作成
docker network create myapp-network

# 2. MySQLを起動
docker run -d \
  --name mysql \
  --network myapp-network \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0

# 3. Redisを起動
docker run -d \
  --name redis \
  --network myapp-network \
  redis:alpine

# 4. アプリケーションを起動
docker run -d \
  --name app \
  --network myapp-network \
  -e DATABASE_URL=mysql://root:secret@mysql:3306/myapp \
  -e REDIS_URL=redis://redis:6379 \
  myapp:latest

# 5. Nginxを起動
docker run -d \
  --name nginx \
  --network myapp-network \
  -p 80:80 \
  -v ./nginx.conf:/etc/nginx/nginx.conf \
  nginx:alpine
```

**問題点**：
- コマンドが長く、毎回入力するのが大変
- 起動順序を手動で管理する必要がある
- 設定の再現性がない（ドキュメント化が困難）
- チーム開発での共有が難しい

## Docker Composeとは

**Docker Compose**は、複数のコンテナで構成されるアプリケーションを定義・実行するためのツールです。

### 主な特徴

| 特徴 | 説明 |
|------|------|
| 宣言的定義 | YAMLファイルでサービス構成を定義 |
| 一括管理 | 複数コンテナを1コマンドで操作 |
| 再現性 | 同じ環境を何度でも再現可能 |
| 開発効率 | 開発環境の立ち上げを高速化 |
| バージョン管理 | 設定ファイルをGitで管理可能 |

### Docker Composeの基本概念

```yaml
# docker-compose.yml
services:
  # サービス名（コンテナの論理名）
  web:
    image: nginx:alpine
    ports:
      - "80:80"

  app:
    build: ./app
    depends_on:
      - db

  db:
    image: mysql:8.0
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

### Docker Composeの動作イメージ

```
┌──────────────────────────────────────────────────────────────┐
│                   docker-compose.yml                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  services:                                              │  │
│  │    web: { ... }                                         │  │
│  │    app: { ... }                                         │  │
│  │    db:  { ... }                                         │  │
│  │  volumes:                                               │  │
│  │    db-data: { ... }                                     │  │
│  │  networks:                                              │  │
│  │    default: { ... }                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼ docker compose up
┌──────────────────────────────────────────────────────────────┐
│                    Docker Engine                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Default Network                      │   │
│  │   ┌────────┐    ┌────────┐    ┌────────┐            │   │
│  │   │  web   │    │  app   │    │   db   │            │   │
│  │   └────────┘    └────────┘    └────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────┐                                        │
│  │   db-data       │ ← Volume                               │
│  └─────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

## Docker Composeのインストール確認

Docker Desktop（Windows/Mac）を使用している場合、Docker Composeは既にインストールされています。

```bash
# バージョン確認
docker compose version

# 出力例:
# Docker Compose version v2.24.0
```

### Docker Compose V1 と V2 の違い

| 項目 | V1（旧） | V2（現在） |
|------|----------|------------|
| コマンド | `docker-compose` | `docker compose` |
| 実装 | Python | Go |
| パフォーマンス | 標準 | 高速 |
| 機能 | 基本機能 | 拡張機能あり |

**注意**: 現在はV2が標準です。本教材ではV2の`docker compose`コマンドを使用します。

## Docker Composeのユースケース

### 1. ローカル開発環境

```yaml
# 開発環境を一発で立ち上げ
services:
  app:
    build: .
    volumes:
      - .:/app        # ソースコードをマウント
    ports:
      - "3000:3000"

  db:
    image: postgres:15
```

### 2. テスト環境

```yaml
# CI/CDでのテスト実行
services:
  test:
    build:
      context: .
      target: test
    depends_on:
      - db
      - redis

  db:
    image: postgres:15

  redis:
    image: redis:alpine
```

### 3. 本番環境（小規模）

```yaml
# 小規模な本番環境
services:
  app:
    image: myapp:${VERSION}
    restart: always
    deploy:
      replicas: 2

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
```

## Docker ComposeとKubernetesの比較

| 項目 | Docker Compose | Kubernetes |
|------|----------------|------------|
| 複雑さ | 低い | 高い |
| 学習コスト | 低い | 高い |
| スケール | 単一ホスト | 複数ホスト |
| 用途 | 開発/小規模本番 | 大規模本番 |
| 自己修復 | なし | あり |
| ロードバランシング | 基本的 | 高度 |

**使い分けの指針**：
- **Docker Compose**: 開発環境、単一サーバーでの運用
- **Kubernetes**: 大規模な本番環境、複数サーバーでの運用

## プロジェクト名について

Docker Composeは「プロジェクト」という単位でコンテナを管理します。

```bash
# プロジェクト名の確認
# デフォルトはディレクトリ名

# 明示的にプロジェクト名を指定
docker compose -p myproject up

# 実際のコンテナ名は「プロジェクト名_サービス名_番号」
# 例: myproject_web_1, myproject_db_1
```

## まとめ

- Docker Composeは複数コンテナを一括管理するツール
- YAMLファイルで宣言的にインフラを定義
- 開発環境の構築・共有が容易になる
- `docker compose`コマンド（V2）を使用する
- 開発から小規模本番まで幅広く活用可能

次のセクションでは、docker-compose.ymlの基本構文について詳しく学びます。
