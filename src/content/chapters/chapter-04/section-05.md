# サービス間の依存関係

## 概要

このセクションでは、Docker Composeにおけるサービス間の依存関係の管理方法を学びます。`depends_on`による起動順序の制御と、`healthcheck`による準備完了の確認方法を理解しましょう。

## depends_onの基本

`depends_on`は、サービスの起動順序を制御するための設定です。

### 基本的な使い方

```yaml
services:
  web:
    image: nginx:alpine
    depends_on:
      - app          # appが起動してからwebを起動

  app:
    build: ./app
    depends_on:
      - db           # dbが起動してからappを起動
      - cache        # cacheが起動してからappを起動

  db:
    image: postgres:15

  cache:
    image: redis:alpine
```

### 起動順序

上記の設定では、以下の順序で起動されます：

```
                    ┌─────────────────────────────────────────┐
                    │            起動順序                      │
                    └─────────────────────────────────────────┘

Step 1:   ┌────────┐    ┌────────┐
          │   db   │    │ cache  │      並列で起動
          └────────┘    └────────┘
               │             │
               └──────┬──────┘
                      │
                      ▼
Step 2:        ┌────────────┐
               │    app     │           db, cacheの後に起動
               └────────────┘
                      │
                      ▼
Step 3:        ┌────────────┐
               │    web     │           appの後に起動
               └────────────┘
```

### depends_onの注意点

**重要**: `depends_on`はコンテナの**起動**順序を制御するだけで、サービスが**準備完了**するまで待機しません。

```yaml
services:
  app:
    build: ./app
    depends_on:
      - db    # dbコンテナが「起動」したら、appを起動
              # dbが接続可能になるまでは待たない!

  db:
    image: postgres:15
```

```
時間経過 →

db:    [コンテナ起動]────────[PostgreSQL初期化中...]────────[接続可能]
                     │
app:                 └─[コンテナ起動]─[接続エラー!]
                           ↑
                           │
                    dbはまだ準備できていない
```

## healthcheckによる準備完了の確認

サービスが実際に準備完了するまで待機するには、`healthcheck`と`condition`を組み合わせます。

### healthcheckの定義

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s       # チェック間隔
      timeout: 5s         # タイムアウト
      retries: 5          # リトライ回数
      start_period: 30s   # 初回チェックまでの待機時間
```

### 各データベースのhealthcheck例

```yaml
services:
  # PostgreSQL
  postgres:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MySQL
  mysql:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB
  mongo:
    image: mongo:6
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### depends_onとhealthcheckの組み合わせ

```yaml
services:
  app:
    build: ./app
    depends_on:
      db:
        condition: service_healthy    # healthyになるまで待機
      cache:
        condition: service_started    # 起動したら待機終了（デフォルト）

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:alpine
```

### conditionの種類

| condition | 説明 |
|-----------|------|
| `service_started` | コンテナが起動したら（デフォルト） |
| `service_healthy` | healthcheckがパスしたら |
| `service_completed_successfully` | コンテナが正常終了したら |

## healthcheckの動作イメージ

```
時間経過 →

db:    [コンテナ起動]──[初期化...]──[healthcheck]──[healthy!]
                                         │              │
                                         × (失敗)       ✓ (成功)
                                                        │
                                                        ▼
app:                                              [コンテナ起動]
                                                        │
                                                  [正常に接続]
```

## 実践的な設定例

### Webアプリケーション + データベース

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

  app:
    build: ./app
    expose:
      - "3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  postgres-data:
```

### 起動の流れ

```
┌─────────────────────────────────────────────────────────────────────┐
│                         起動シーケンス                               │
└─────────────────────────────────────────────────────────────────────┘

1. db起動
   [起動] → [PostgreSQL初期化] → [pg_isready チェック] → [healthy]
                 (30秒)                (10秒ごと)            ✓

2. app起動（dbがhealthyになった後）
   [起動] → [DB接続・初期化] → [/health チェック] → [healthy]
                (40秒)            (30秒ごと)            ✓

3. nginx起動（appがhealthyになった後）
   [起動] → [設定読み込み] → [リクエスト受付開始]
                                    ✓ 完了!
```

## 初期化タスクの実行

データベースの初期化やマイグレーションなど、一度だけ実行するタスクの管理方法です。

### 方法1: 初期化スクリプトを使用

```yaml
services:
  app:
    build: ./app
    depends_on:
      db:
        condition: service_healthy
      db-init:
        condition: service_completed_successfully

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 初期化タスク（1回実行して終了）
  db-init:
    image: postgres:15
    depends_on:
      db:
        condition: service_healthy
    command: >
      bash -c "
        psql -h db -U postgres -d mydb -f /init/schema.sql &&
        psql -h db -U postgres -d mydb -f /init/seed.sql
      "
    volumes:
      - ./db/init:/init:ro
    environment:
      PGPASSWORD: password
```

### 方法2: エントリーポイントスクリプト

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm ci

# 起動スクリプトを使用
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
```

```bash
#!/bin/sh
# docker-entrypoint.sh

# データベースの準備を待機
echo "Waiting for database..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  sleep 2
done
echo "Database is ready!"

# マイグレーション実行
echo "Running migrations..."
npm run migrate

# アプリケーション起動
exec "$@"
```

## 循環依存の回避

依存関係がループしないように注意が必要です。

```yaml
# 問題のある設定（循環依存）
services:
  a:
    depends_on:
      - b
  b:
    depends_on:
      - c
  c:
    depends_on:
      - a    # エラー! a → b → c → a の循環

# 解決策: 依存関係を見直す
services:
  a:
    depends_on:
      - b
  b:
    depends_on:
      - c
  c:
    # 循環を断ち切る
```

## シャットダウン順序

`docker compose down`時は、起動の逆順でシャットダウンされます。

```
起動順序:      db → app → web
シャットダウン: web → app → db
```

### グレースフルシャットダウン

```yaml
services:
  app:
    build: ./app
    stop_grace_period: 30s    # シャットダウンの猶予時間
    stop_signal: SIGTERM      # シャットダウンシグナル
```

## まとめ

- `depends_on`でサービスの起動順序を制御できる
- `depends_on`だけでは準備完了を待機しない
- `healthcheck`でサービスの準備完了を検知
- `condition: service_healthy`で準備完了まで待機
- 初期化タスクは`service_completed_successfully`で制御
- 循環依存は避ける

次のセクションでは、Docker Composeの各コマンドについて詳しく学びます。
