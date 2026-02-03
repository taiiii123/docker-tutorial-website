# docker-compose.ymlの基本構文

## 概要

このセクションでは、Docker Composeの設定ファイルである`docker-compose.yml`の基本構文を学びます。services、networks、volumesの各セクションの書き方と、よく使用されるオプションを理解しましょう。

## ファイル構造の全体像

docker-compose.ymlは以下のトップレベルキーで構成されます：

```yaml
# docker-compose.yml の基本構造

# サービス定義（必須）
services:
  web:
    # サービスの設定...
  db:
    # サービスの設定...

# ネットワーク定義（オプション）
networks:
  frontend:
  backend:

# ボリューム定義（オプション）
volumes:
  db-data:
  cache-data:

# シークレット定義（オプション）
secrets:
  db-password:
    file: ./secrets/db-password.txt

# 設定定義（オプション）
configs:
  nginx-config:
    file: ./nginx.conf
```

## servicesセクション

サービスは、アプリケーションを構成する各コンテナを定義します。

### イメージの指定

```yaml
services:
  # 公式イメージを使用
  web:
    image: nginx:alpine

  # プライベートレジストリのイメージ
  api:
    image: myregistry.com/myapp:v1.0

  # 特定のダイジェストを指定（不変）
  db:
    image: postgres@sha256:abc123...
```

### ビルド設定

```yaml
services:
  app:
    # シンプルなビルド（Dockerfileがあるディレクトリ）
    build: ./app

  api:
    # 詳細なビルド設定
    build:
      context: ./api              # ビルドコンテキスト
      dockerfile: Dockerfile.prod # Dockerfileの指定
      args:                       # ビルド引数
        NODE_ENV: production
      target: production          # マルチステージビルドのターゲット
```

### ポートマッピング

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      # ホスト:コンテナ
      - "80:80"
      - "443:443"

      # ホストのポートを自動割り当て
      - "3000"

      # 特定のIPにバインド
      - "127.0.0.1:8080:80"

      # 詳細な形式
      - target: 80        # コンテナ側ポート
        published: 8080   # ホスト側ポート
        protocol: tcp     # プロトコル
```

### ボリュームマウント

```yaml
services:
  app:
    image: node:20-alpine
    volumes:
      # 名前付きボリューム
      - node-modules:/app/node_modules

      # バインドマウント（相対パス）
      - ./src:/app/src

      # 読み取り専用マウント
      - ./config:/app/config:ro

      # 詳細な形式
      - type: bind
        source: ./logs
        target: /app/logs
        read_only: false

volumes:
  node-modules:
```

### 環境変数

```yaml
services:
  app:
    image: myapp:latest
    environment:
      # キー=値 形式
      NODE_ENV: production
      DEBUG: "false"

      # リスト形式
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379

    # 外部ファイルから読み込み
    env_file:
      - .env
      - .env.production
```

### コマンドとエントリーポイント

```yaml
services:
  app:
    image: node:20-alpine

    # デフォルトコマンドを上書き
    command: npm run start:prod

    # エントリーポイントを上書き
    entrypoint: /custom-entrypoint.sh

  worker:
    image: python:3.11

    # 複数コマンド（配列形式）
    command: ["python", "-m", "celery", "worker"]
```

### 再起動ポリシー

```yaml
services:
  web:
    image: nginx:alpine
    restart: always        # 常に再起動

  app:
    image: myapp:latest
    restart: unless-stopped  # 手動停止以外は再起動

  task:
    image: myworker:latest
    restart: on-failure     # 失敗時のみ再起動
    # restart: "no"         # 再起動しない（デフォルト）
```

## networksセクション

サービス間の通信を制御するネットワークを定義します。

### 基本的なネットワーク定義

```yaml
services:
  frontend:
    image: nginx:alpine
    networks:
      - frontend-net

  api:
    image: myapi:latest
    networks:
      - frontend-net
      - backend-net

  db:
    image: postgres:15
    networks:
      - backend-net

networks:
  frontend-net:
    driver: bridge

  backend-net:
    driver: bridge
    internal: true    # 外部アクセス不可
```

### ネットワーク構成イメージ

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Host                             │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              frontend-net (bridge)                   │   │
│   │   ┌──────────────┐      ┌──────────────┐           │   │
│   │   │   frontend   │◄────►│     api      │           │   │
│   │   │   (nginx)    │      │   (Node.js)  │           │   │
│   │   └──────────────┘      └──────┬───────┘           │   │
│   └──────────────────────────────────────────────────────┘   │
│                                      │                       │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              backend-net (internal)                  │   │
│   │                              │                       │   │
│   │                      ┌───────▼───────┐              │   │
│   │                      │      db       │              │   │
│   │                      │  (Postgres)   │              │   │
│   │                      └───────────────┘              │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 静的IPアドレスの割り当て

```yaml
services:
  web:
    image: nginx:alpine
    networks:
      app-net:
        ipv4_address: 172.28.0.10

networks:
  app-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

## volumesセクション

データの永続化のためのボリュームを定義します。

### ボリュームの種類

```yaml
services:
  db:
    image: postgres:15
    volumes:
      # 1. 名前付きボリューム（推奨）
      - postgres-data:/var/lib/postgresql/data

      # 2. バインドマウント
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

      # 3. 匿名ボリューム
      - /var/log/postgresql

volumes:
  # 名前付きボリュームの定義
  postgres-data:
    driver: local

  # 外部ボリューム（既存のボリュームを使用）
  shared-data:
    external: true
```

### ボリュームオプション

```yaml
volumes:
  # ローカルドライバーのオプション
  nfs-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,rw
      device: ":/path/to/dir"

  # ラベルの付与
  app-data:
    labels:
      - "com.example.description=Application data"
      - "com.example.department=IT"
```

## 完全な設定例

以下は、Webアプリケーションの完全な設定例です：

```yaml
# docker-compose.yml

services:
  # リバースプロキシ
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - frontend
    restart: unless-stopped

  # アプリケーションサーバー
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:password@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    volumes:
      - app-logs:/app/logs
    depends_on:
      - db
      - cache
    networks:
      - frontend
      - backend
    restart: unless-stopped

  # データベース
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    restart: unless-stopped

  # キャッシュ
  cache:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - backend
    restart: unless-stopped

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

volumes:
  postgres-data:
  redis-data:
  app-logs:
```

## YAMLの記法Tips

### アンカーとエイリアス（重複の削減）

```yaml
# 共通設定をアンカーで定義
x-common: &common
  restart: unless-stopped
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"

services:
  web:
    <<: *common          # アンカーを展開
    image: nginx:alpine

  app:
    <<: *common          # 同じ設定を再利用
    image: myapp:latest
```

### 複数行の文字列

```yaml
services:
  app:
    environment:
      # パイプ（|）: 改行を保持
      SCRIPT: |
        #!/bin/bash
        echo "Hello"
        echo "World"

      # 大なり（>）: 改行をスペースに変換
      DESCRIPTION: >
        This is a long description
        that spans multiple lines
        but will be joined into one.
```

## まとめ

- docker-compose.ymlはservices、networks、volumesで構成される
- servicesでは、イメージ、ビルド、ポート、ボリューム、環境変数などを定義
- networksでサービス間の通信を制御できる
- volumesでデータの永続化を実現
- YAMLのアンカー機能で設定の重複を削減できる

次のセクションでは、複数サービスの定義について、より実践的な例を見ていきます。
