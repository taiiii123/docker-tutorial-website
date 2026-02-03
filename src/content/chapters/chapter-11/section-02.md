# Docker Composeコマンド一覧

## 概要

このセクションでは、Docker Composeで使用できる全コマンドを網羅的に解説します。複数コンテナのアプリケーションを効率的に管理するための必須リファレンスです。

## 基本情報

Docker Compose V2以降では、`docker-compose` コマンドの代わりに `docker compose`（ハイフンなし）が推奨されています。

```bash
# V1（レガシー）
docker-compose up

# V2（推奨）
docker compose up
```

## サービス起動・停止コマンド

### docker compose up - サービスの起動

```bash
# すべてのサービスを起動
docker compose up

# バックグラウンドで起動
docker compose up -d

# 特定のサービスのみ起動
docker compose up -d web db

# イメージを再ビルドしてから起動
docker compose up -d --build

# 強制的にイメージを再ビルド
docker compose up -d --force-recreate

# コンテナを再作成せずに設定変更を反映
docker compose up -d --no-recreate

# 依存サービスを起動しない
docker compose up -d --no-deps web

# スケールを指定して起動
docker compose up -d --scale web=3

# タイムアウトを指定
docker compose up -d --timeout 30

# 別のComposeファイルを指定
docker compose -f docker-compose.prod.yml up -d

# 複数のComposeファイルをマージして起動
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

| オプション | 説明 |
|-----------|------|
| `-d, --detach` | バックグラウンドで実行 |
| `--build` | 起動前にイメージをビルド |
| `--force-recreate` | コンテナを強制的に再作成 |
| `--no-recreate` | 既存コンテナを再作成しない |
| `--no-deps` | 依存サービスを起動しない |
| `--no-build` | イメージをビルドしない |
| `--scale` | サービスのインスタンス数を指定 |
| `--timeout` | シャットダウンタイムアウト（秒） |
| `--wait` | サービスが正常に起動するまで待機 |
| `--remove-orphans` | 定義されていないコンテナを削除 |

### docker compose down - サービスの停止と削除

```bash
# サービスを停止してコンテナを削除
docker compose down

# ボリュームも削除
docker compose down -v
docker compose down --volumes

# イメージも削除（ローカルビルドのみ）
docker compose down --rmi local

# イメージも削除（すべて）
docker compose down --rmi all

# ネットワークも削除（デフォルトで削除される）
docker compose down --remove-orphans

# タイムアウトを指定
docker compose down --timeout 30
```

### docker compose start / stop / restart - 既存コンテナの起動・停止・再起動

```bash
# 停止中のコンテナを起動
docker compose start

# 特定のサービスのみ起動
docker compose start web

# サービスを停止（コンテナは削除しない）
docker compose stop

# タイムアウトを指定して停止
docker compose stop --timeout 30

# サービスを再起動
docker compose restart

# 特定のサービスのみ再起動
docker compose restart web
```

### docker compose pause / unpause - コンテナの一時停止・再開

```bash
# すべてのコンテナを一時停止
docker compose pause

# 特定のサービスのみ一時停止
docker compose pause web

# 一時停止したコンテナを再開
docker compose unpause
docker compose unpause web
```

### docker compose kill - コンテナの強制停止

```bash
# すべてのコンテナを強制停止
docker compose kill

# 特定のシグナルを送信
docker compose kill -s SIGTERM

# 特定のサービスのみ
docker compose kill web
```

## 情報表示コマンド

### docker compose ps - コンテナの一覧表示

```bash
# サービスのコンテナ一覧
docker compose ps

# すべてのコンテナを表示（停止中含む）
docker compose ps -a

# サービスのステータスのみ表示
docker compose ps --status running
docker compose ps --status exited

# 出力フォーマットを指定
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# JSON形式で出力
docker compose ps --format json
```

### docker compose logs - ログの表示

```bash
# すべてのサービスのログを表示
docker compose logs

# 特定のサービスのログ
docker compose logs web

# リアルタイムでログを追跡
docker compose logs -f
docker compose logs --follow

# 最新のN行のみ表示
docker compose logs --tail 100

# タイムスタンプを表示
docker compose logs -t
docker compose logs --timestamps

# 特定の時間以降のログ
docker compose logs --since 2024-01-01T00:00:00
docker compose logs --since 1h

# 組み合わせ
docker compose logs -f --tail 50 -t web
```

### docker compose top - プロセス一覧の表示

```bash
# すべてのサービスのプロセス一覧
docker compose top

# 特定のサービスのプロセス
docker compose top web
```

### docker compose port - 公開ポートの表示

```bash
# サービスの公開ポートを表示
docker compose port web 80

# プロトコルを指定
docker compose port --protocol tcp web 80
```

### docker compose images - イメージの一覧表示

```bash
# サービスで使用しているイメージの一覧
docker compose images
```

### docker compose config - 設定ファイルの検証

```bash
# 設定ファイルの内容を表示
docker compose config

# サービス名のみ表示
docker compose config --services

# ボリューム名のみ表示
docker compose config --volumes

# プロファイルのみ表示
docker compose config --profiles

# 設定ファイルの検証のみ（出力なし）
docker compose config --quiet
```

## コンテナ操作コマンド

### docker compose exec - 実行中のコンテナでコマンド実行

```bash
# コンテナ内でコマンドを実行
docker compose exec web コマンド

# インタラクティブシェルを起動
docker compose exec web bash
docker compose exec web sh

# 作業ディレクトリを指定
docker compose exec -w /var/www web ls

# 環境変数を設定
docker compose exec -e MY_VAR=value web printenv

# 特定のユーザーで実行
docker compose exec -u root web whoami

# TTYなしで実行
docker compose exec -T web echo "Hello"

# 特定のインスタンス（スケール時）
docker compose exec --index 2 web bash
```

| オプション | 説明 |
|-----------|------|
| `-d, --detach` | バックグラウンドで実行 |
| `-e, --env` | 環境変数を設定 |
| `-w, --workdir` | 作業ディレクトリを指定 |
| `-u, --user` | 実行ユーザーを指定 |
| `-T` | TTYを割り当てない |
| `--index` | スケール時のインスタンス番号 |

### docker compose run - 新しいコンテナでコマンド実行

```bash
# 新しいコンテナでコマンドを実行
docker compose run web コマンド

# ワンオフコマンドの実行（コンテナ終了後削除）
docker compose run --rm web npm test

# サービスポートを公開しない
docker compose run --no-deps web bash

# 環境変数を設定
docker compose run -e NODE_ENV=test web npm test

# ボリュームをマウント
docker compose run -v /host:/container web ls /container

# 名前を付けて実行
docker compose run --name my-test web npm test
```

| オプション | 説明 |
|-----------|------|
| `--rm` | 終了後にコンテナを削除 |
| `--no-deps` | 依存サービスを起動しない |
| `-d, --detach` | バックグラウンドで実行 |
| `-e, --env` | 環境変数を設定 |
| `-v, --volume` | ボリュームをマウント |
| `--entrypoint` | エントリポイントを上書き |
| `-u, --user` | 実行ユーザーを指定 |

### docker compose cp - ファイルのコピー

```bash
# ホストからコンテナへコピー
docker compose cp /host/file.txt web:/container/path/

# コンテナからホストへコピー
docker compose cp web:/container/file.txt /host/path/
```

## ビルド関連コマンド

### docker compose build - イメージのビルド

```bash
# すべてのサービスのイメージをビルド
docker compose build

# 特定のサービスのみビルド
docker compose build web

# キャッシュを使用しない
docker compose build --no-cache

# ビルド引数を渡す
docker compose build --build-arg VERSION=1.0

# 並列ビルド
docker compose build --parallel

# プルして最新のベースイメージを使用
docker compose build --pull

# BuildKitを使用
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build
```

| オプション | 説明 |
|-----------|------|
| `--no-cache` | キャッシュを使用しない |
| `--build-arg` | ビルド引数を設定 |
| `--parallel` | 並列でビルド |
| `--pull` | ベースイメージをプル |
| `--progress` | ビルド進捗の表示形式（auto, plain, tty） |
| `-q, --quiet` | 出力を抑制 |

### docker compose pull - イメージのプル

```bash
# すべてのサービスのイメージをプル
docker compose pull

# 特定のサービスのみ
docker compose pull web

# 並列でプル
docker compose pull --parallel

# プル失敗を無視
docker compose pull --ignore-pull-failures
```

### docker compose push - イメージのプッシュ

```bash
# すべてのサービスのイメージをプッシュ
docker compose push

# 特定のサービスのみ
docker compose push web

# プッシュ失敗を無視
docker compose push --ignore-push-failures
```

## クリーンアップコマンド

### docker compose rm - 停止中のコンテナを削除

```bash
# 停止中のコンテナを削除
docker compose rm

# 確認なしで削除
docker compose rm -f

# ボリュームも削除
docker compose rm -v

# 特定のサービスのみ
docker compose rm web
```

## その他のコマンド

### docker compose create - コンテナの作成

```bash
# コンテナを作成（起動しない）
docker compose create

# 強制的に再作成
docker compose create --force-recreate
```

### docker compose events - イベントのストリーム

```bash
# リアルタイムでDockerイベントを監視
docker compose events

# JSON形式で出力
docker compose events --json
```

### docker compose version - バージョン表示

```bash
# Docker Composeのバージョンを表示
docker compose version
```

## docker-compose.yml の主要な設定項目

### 基本構造

```yaml
# docker-compose.yml
version: "3.9"  # Compose V2では省略可

services:
  web:
    build: ./web
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./src:/app/src
    networks:
      - frontend

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend

volumes:
  db-data:

networks:
  frontend:
  backend:
```

### 主要な設定オプション

```yaml
services:
  myservice:
    # イメージ関連
    image: nginx:latest
    build:
      context: ./dir
      dockerfile: Dockerfile.prod
      args:
        - VERSION=1.0

    # コンテナ設定
    container_name: my-container
    hostname: myhost
    restart: unless-stopped

    # ポート
    ports:
      - "8080:80"
      - "443:443"
    expose:
      - "3000"

    # 環境変数
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    env_file:
      - .env

    # ボリューム
    volumes:
      - ./src:/app/src
      - data:/app/data
      - type: bind
        source: ./config
        target: /etc/config
        read_only: true

    # ネットワーク
    networks:
      - frontend
      - backend

    # 依存関係
    depends_on:
      - db
      - redis
    depends_on:
      db:
        condition: service_healthy

    # ヘルスチェック
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # リソース制限
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M

    # ログ設定
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

    # コマンド
    command: npm start
    entrypoint: /docker-entrypoint.sh
    working_dir: /app
    user: node
```

## 環境変数ファイル（.env）

```bash
# .env
COMPOSE_PROJECT_NAME=myproject
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml

# サービスで使用する変数
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=secret
```

docker-compose.yml での使用

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

## まとめ

Docker Composeコマンドの主要カテゴリ

| カテゴリ | 主要コマンド |
|---------|-------------|
| 起動・停止 | `up`, `down`, `start`, `stop`, `restart` |
| 情報表示 | `ps`, `logs`, `top`, `config`, `images` |
| コンテナ操作 | `exec`, `run`, `cp` |
| ビルド | `build`, `pull`, `push` |
| クリーンアップ | `rm`, `down -v` |

よく使うコマンドの組み合わせ

```bash
# 開発環境の起動
docker compose up -d --build

# ログを確認しながら監視
docker compose logs -f

# コンテナに入ってデバッグ
docker compose exec web bash

# 完全なリセット（ボリューム含む）
docker compose down -v && docker compose up -d --build

# 本番環境用の起動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
