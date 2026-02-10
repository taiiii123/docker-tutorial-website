# 複数サービスの定義

## 概要

このセクションでは、実際のアプリケーション構成を想定した複数サービスの定義方法を学びます。Web + Database構成を例に、サービス間の連携方法を理解しましょう。

## シンプルなWeb + DB構成

まずは、最も基本的なWebアプリケーション + データベースの構成から始めます。

### 構成イメージ

![Web+DB+App構成](/images/diagrams/compose-web-db-app.png)

### docker-compose.yml

```yaml
services:
  # Webサーバー（リバースプロキシ）
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
    restart: unless-stopped

  # アプリケーションサーバー
  app:
    build: ./app
    expose:
      - "3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=appuser
      - DB_PASSWORD=apppassword
      - DB_NAME=myapp
    depends_on:
      - db
    restart: unless-stopped

  # データベース
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: myapp
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppassword
    volumes:
      - mysql-data:/var/lib/mysql
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped

volumes:
  mysql-data:
```

### 関連ファイル

**nginx/default.conf**:
```nginx
upstream app_server {
    server app:3000;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**app/Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

**db/init.sql**:
```sql
-- 初期データの投入
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('Test User', 'test@example.com');
```

## フロントエンド + バックエンド + DB構成

モダンなSPA（Single Page Application）構成の例です。

```yaml
services:
  # フロントエンド（React/Vue/Angular）
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    environment:
      - VITE_API_URL=http://localhost:8080
    depends_on:
      - backend

  # バックエンドAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - ./backend/src:/app/src
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/mydb
      - JWT_SECRET=your-secret-key
    depends_on:
      - db

  # PostgreSQLデータベース
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"    # 開発時のみ外部公開

volumes:
  postgres-data:
```

## マイクロサービス構成

複数のバックエンドサービスで構成されるマイクロサービスの例です。

```yaml
services:
  # APIゲートウェイ
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - user-service
      - product-service
      - order-service

  # ユーザーサービス
  user-service:
    build: ./services/user
    expose:
      - "3001"
    environment:
      - DB_HOST=user-db
      - REDIS_HOST=cache
    depends_on:
      - user-db
      - cache

  # 商品サービス
  product-service:
    build: ./services/product
    expose:
      - "3002"
    environment:
      - DB_HOST=product-db
      - REDIS_HOST=cache
    depends_on:
      - product-db
      - cache

  # 注文サービス
  order-service:
    build: ./services/order
    expose:
      - "3003"
    environment:
      - DB_HOST=order-db
      - REDIS_HOST=cache
      - USER_SERVICE_URL=http://user-service:3001
      - PRODUCT_SERVICE_URL=http://product-service:3002
    depends_on:
      - order-db
      - cache
      - user-service
      - product-service

  # 各サービス用データベース
  user-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - user-db-data:/var/lib/postgresql/data

  product-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: products
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - product-db-data:/var/lib/postgresql/data

  order-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - order-db-data:/var/lib/postgresql/data

  # 共有キャッシュ
  cache:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  user-db-data:
  product-db-data:
  order-db-data:
  redis-data:
```

### マイクロサービス構成図

![マイクロサービスゲートウェイ構成](/images/diagrams/compose-microservices-gateway.png)

## portsとexposeの違い

```yaml
services:
  # ポートを外部に公開
  web:
    image: nginx:alpine
    ports:
      - "80:80"     # ホストの80番ポートからアクセス可能

  # 内部のみで公開（Compose内のサービス間通信用）
  app:
    image: myapp:latest
    expose:
      - "3000"      # 他のサービスからのみアクセス可能
```

![portsとexposeの違い](/images/diagrams/compose-ports-vs-expose.png)

## サービス間の名前解決

Docker Composeでは、サービス名がそのままホスト名として使用できます。

```yaml
services:
  app:
    image: myapp:latest
    environment:
      # サービス名で接続可能
      - DB_HOST=db           # "db"がホスト名
      - REDIS_HOST=cache     # "cache"がホスト名

  db:
    image: postgres:15

  cache:
    image: redis:alpine
```

### 名前解決の仕組み

![Docker ComposeのDNS解決](/images/diagrams/compose-dns-resolution.png)

## プロファイルによるサービスのグループ化

開発用、テスト用など、用途別にサービスをグループ化できます。

```yaml
services:
  app:
    image: myapp:latest
    # プロファイル指定なし = 常に起動

  db:
    image: postgres:15
    # プロファイル指定なし = 常に起動

  # 開発時のみ起動
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    profiles:
      - dev
      - debug

  # デバッグ時のみ起動
  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"
    profiles:
      - debug

  # テスト時のみ起動
  test-runner:
    build: ./tests
    profiles:
      - test
```

```bash
# 通常起動（app, dbのみ）
docker compose up

# 開発プロファイルを含めて起動
docker compose --profile dev up

# 複数プロファイルを指定
docker compose --profile dev --profile debug up
```

## スケーリング

同じサービスを複数インスタンス起動できます。

```yaml
services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3    # 3インスタンス起動
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

```bash
# コマンドラインでスケール指定
docker compose up --scale app=5
```

## まとめ

- 複数サービスは`services`セクションに列挙して定義
- サービス名がそのままネットワーク内のホスト名になる
- `ports`は外部公開、`expose`は内部公開
- `depends_on`でサービス間の依存関係を定義
- `profiles`でサービスをグループ化し、用途別に起動できる
- `deploy.replicas`または`--scale`でスケーリング可能

次のセクションでは、環境変数と.envファイルによる設定管理について学びます。
