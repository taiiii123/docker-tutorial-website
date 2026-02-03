# 環境変数と.envファイル

## 概要

このセクションでは、Docker Composeにおける環境変数の管理方法を学びます。環境変数を使うことで、設定を外部化し、開発・本番環境の切り替えを容易にできます。

## 環境変数を使う理由

環境変数を使用する主な理由は以下の通りです：

| 理由 | 説明 |
|------|------|
| セキュリティ | パスワードなどをコードに含めない |
| 可搬性 | 環境ごとに異なる設定を適用 |
| 柔軟性 | 再ビルドなしで設定変更可能 |
| ベストプラクティス | 12 Factor Appの推奨事項 |

## 環境変数の定義方法

### 1. docker-compose.yml内で直接定義

```yaml
services:
  app:
    image: myapp:latest
    environment:
      # マップ形式（推奨）
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@db:5432/mydb

      # リスト形式
      - REDIS_HOST=cache
      - REDIS_PORT=6379
```

### 2. env_fileで外部ファイルを読み込み

```yaml
services:
  app:
    image: myapp:latest
    env_file:
      - .env                  # デフォルト
      - .env.local            # ローカル上書き
      - ./config/.env.prod    # 本番用
```

### 3. シェルの環境変数を参照

```yaml
services:
  app:
    image: myapp:${APP_VERSION:-latest}  # デフォルト値付き
    environment:
      - API_KEY=${API_KEY}               # 必須（未設定でエラー）
      - DEBUG=${DEBUG:-false}            # デフォルト値
```

```bash
# 実行時に環境変数を設定
APP_VERSION=v2.0 API_KEY=secret docker compose up
```

## .envファイルの書き方

### 基本的な.envファイル

```bash
# .env ファイル

# データベース設定
DB_HOST=db
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=secretpassword
DB_NAME=myapp

# アプリケーション設定
NODE_ENV=development
APP_PORT=3000
LOG_LEVEL=debug

# 外部サービス
REDIS_URL=redis://cache:6379
MAIL_HOST=smtp.example.com

# APIキー（機密情報）
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret
```

### 記法ルール

```bash
# コメントは # で始める

# 基本的な変数
KEY=value

# 空白を含む値はクォートで囲む
MESSAGE="Hello World"
MESSAGE='Hello World'

# 変数展開（$を含む値）
PASSWORD='P@$$w0rd'    # シングルクォートでリテラル
ESCAPED=P@\$\$w0rd     # エスケープ

# 複数行は使用不可（1行1変数）
```

## 環境ごとの設定分離

### ファイル構成

```
project/
├── docker-compose.yml
├── .env                    # 共通設定（Git管理）
├── .env.example            # サンプル（Git管理）
├── .env.local              # ローカル上書き（Git除外）
├── .env.development        # 開発環境
├── .env.production         # 本番環境
└── .gitignore
```

### .gitignore設定

```gitignore
# 環境変数ファイル
.env.local
.env.*.local
.env.production

# 機密情報を含む可能性のあるファイル
*.secret
*.key
```

### docker-compose.yml

```yaml
services:
  app:
    image: myapp:latest
    env_file:
      - .env                            # 共通設定（必須）
      - .env.${ENVIRONMENT:-development} # 環境別設定
      - path: .env.local                # ローカル上書き（オプション）
        required: false
```

### 使用例

```bash
# 開発環境（デフォルト）
docker compose up

# 本番環境
ENVIRONMENT=production docker compose up

# ステージング環境
ENVIRONMENT=staging docker compose up
```

## Compose設定自体への変数適用

docker-compose.yml内でも変数を使用できます。

```yaml
# .env
MYSQL_VERSION=8.0
APP_PORT=3000
REPLICAS=3

# docker-compose.yml
services:
  db:
    image: mysql:${MYSQL_VERSION}

  app:
    build: ./app
    ports:
      - "${APP_PORT}:3000"
    deploy:
      replicas: ${REPLICAS}
```

### 変数展開の構文

```yaml
services:
  app:
    image: myapp:${VERSION}           # 必須変数

    environment:
      # デフォルト値を設定
      LOG_LEVEL: ${LOG_LEVEL:-info}   # 未設定なら "info"

      # 変数が設定されている場合のみ代替値を使用
      DEBUG: ${DEBUG:+true}           # 設定されていれば "true"

      # エラーメッセージ付き必須変数
      API_KEY: ${API_KEY:?API_KEY must be set}
```

## セキュリティのベストプラクティス

### 機密情報の取り扱い

```yaml
# 非推奨: パスワードをYAMLに直書き
services:
  db:
    environment:
      MYSQL_PASSWORD: hardcoded_password  # 危険!

# 推奨: 環境変数経由
services:
  db:
    environment:
      MYSQL_PASSWORD: ${DB_PASSWORD}
```

### Docker Secretsの使用（Swarmモード）

```yaml
services:
  db:
    image: mysql:8.0
    secrets:
      - db_password
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### .env.exampleの提供

チームメンバーが必要な環境変数を把握できるよう、サンプルファイルを用意します。

```bash
# .env.example
# このファイルを .env にコピーして値を設定してください

# データベース設定
DB_HOST=localhost
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=myapp

# 外部API（開発用キーは https://example.com/dev で取得）
API_KEY=
API_SECRET=

# JWT設定（任意の文字列を設定）
JWT_SECRET=
```

## 実践的な設定例

### 開発環境用 (.env.development)

```bash
# .env.development

# アプリケーション
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# データベース
DB_HOST=db
DB_PORT=5432
DB_USER=devuser
DB_PASSWORD=devpassword
DB_NAME=myapp_dev

# ホットリロード有効
CHOKIDAR_USEPOLLING=true
```

### 本番環境用 (.env.production)

```bash
# .env.production

# アプリケーション
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn

# データベース（本番の値は環境変数から注入）
DB_HOST=${PROD_DB_HOST}
DB_PORT=5432
DB_USER=${PROD_DB_USER}
DB_PASSWORD=${PROD_DB_PASSWORD}
DB_NAME=myapp_prod

# パフォーマンス設定
NODE_OPTIONS=--max-old-space-size=2048
```

### 完全なdocker-compose.yml例

```yaml
services:
  app:
    build:
      context: ./app
      args:
        NODE_ENV: ${NODE_ENV:-development}
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
      - REDIS_URL=redis://cache:6379
      - LOG_LEVEL=${LOG_LEVEL:-info}
    env_file:
      - .env
      - path: .env.local
        required: false
    depends_on:
      - db
      - cache

  db:
    image: postgres:${POSTGRES_VERSION:-15}-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:${REDIS_VERSION:-7}-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

## デバッグ方法

### 環境変数の確認

```bash
# Compose設定の検証と変数展開結果を表示
docker compose config

# 特定のサービスの環境変数を確認
docker compose run --rm app env

# 実行中のコンテナの環境変数を確認
docker compose exec app env
```

### よくある問題と解決策

```bash
# 問題: 変数が展開されない
# 原因: .envファイルの配置場所が違う
# 解決: docker-compose.ymlと同じディレクトリに配置

# 問題: 特殊文字を含むパスワードが正しく設定されない
# 解決: シングルクォートで囲む
DB_PASSWORD='P@$$w0rd!#'

# 問題: 環境変数が優先順位通りに適用されない
# 確認: 優先順位を理解する
# 1. シェル環境変数（最優先）
# 2. env_file（後に指定したファイルが優先）
# 3. docker-compose.ymlのenvironment
```

## まとめ

- 環境変数でアプリケーション設定を外部化できる
- `.env`ファイルで環境変数をまとめて管理
- 環境ごとに`.env.development`、`.env.production`などを分離
- 機密情報は`.gitignore`でGit管理から除外
- `docker compose config`で変数展開を確認
- `.env.example`でチームへの共有を容易に

次のセクションでは、サービス間の依存関係の管理方法について学びます。
