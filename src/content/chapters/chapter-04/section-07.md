# 開発環境の構築例

## 概要

このセクションでは、Docker Composeを使った実践的な開発環境の構築例を学びます。Node.js、LAMP、LEMPなど、よく使われる構成をテンプレートとして紹介します。

## Node.js + Express + MongoDB

### ディレクトリ構成

```
nodejs-mongo/
├── docker-compose.yml
├── .env
├── .env.example
├── app/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js
└── mongo/
    └── init.js
```

### docker-compose.yml

```yaml
services:
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./app/src:/app/src
      - /app/node_modules        # node_modulesはボリュームで分離
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/myapp
    depends_on:
      mongo:
        condition: service_healthy
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
      - ./mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro
    environment:
      - MONGO_INITDB_DATABASE=myapp
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # 開発用: MongoDBの管理UI
  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/
    depends_on:
      - mongo
    profiles:
      - dev

volumes:
  mongo-data:
```

### app/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 依存関係をキャッシュ
COPY package*.json ./
RUN npm install

# ソースコードはボリュームマウントで提供
# COPY src ./src

# 開発サーバー（ホットリロード対応）
CMD ["npm", "run", "dev"]
```

### 使い方

```bash
# 起動
docker compose up -d

# 管理UIも含めて起動
docker compose --profile dev up -d

# ログ確認
docker compose logs -f app

# コンテナに入る
docker compose exec app sh
```

## React + Node.js API + PostgreSQL

### ディレクトリ構成

```
fullstack-app/
├── docker-compose.yml
├── docker-compose.override.yml  # 開発用オーバーライド
├── .env
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...
└── db/
    └── init.sql
```

### docker-compose.yml（本番想定のベース）

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
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
    restart: unless-stopped

volumes:
  postgres-data:
```

### docker-compose.override.yml（開発用）

```yaml
# このファイルは自動的にマージされる
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"     # Vite dev server
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    environment:
      - VITE_API_URL=http://localhost:3000

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"     # 外部公開（開発用）
    volumes:
      - ./backend/src:/app/src
    environment:
      - NODE_ENV=development

  db:
    ports:
      - "5432:5432"     # 外部公開（開発用）
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  # 開発ツール
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db
```

## LAMP環境（Linux + Apache + MySQL + PHP）

### ディレクトリ構成

```
lamp/
├── docker-compose.yml
├── .env
├── php/
│   ├── Dockerfile
│   └── php.ini
├── apache/
│   └── vhost.conf
├── mysql/
│   └── init.sql
└── src/
    └── index.php
```

### docker-compose.yml

```yaml
services:
  web:
    build:
      context: ./php
      dockerfile: Dockerfile
    ports:
      - "80:80"
    volumes:
      - ./src:/var/www/html
      - ./apache/vhost.conf:/etc/apache2/sites-enabled/000-default.conf:ro
      - ./php/php.ini:/usr/local/etc/php/php.ini:ro
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  phpmyadmin:
    image: phpmyadmin
    ports:
      - "8080:80"
    environment:
      PMA_HOST: db
      PMA_USER: ${MYSQL_USER}
      PMA_PASSWORD: ${MYSQL_PASSWORD}
    depends_on:
      - db
    profiles:
      - dev

volumes:
  mysql-data:
```

### php/Dockerfile

```dockerfile
FROM php:8.2-apache

# PHP拡張のインストール
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Apache mod_rewrite を有効化
RUN a2enmod rewrite

# Composerのインストール（オプション）
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
```

### .env

```bash
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=myapp
MYSQL_USER=developer
MYSQL_PASSWORD=devpassword
```

## LEMP環境（Linux + Nginx + MySQL + PHP-FPM）

### docker-compose.yml

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./src:/var/www/html:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - php
    restart: unless-stopped

  php:
    build:
      context: ./php
      dockerfile: Dockerfile
    volumes:
      - ./src:/var/www/html
      - ./php/php-fpm.conf:/usr/local/etc/php-fpm.d/www.conf:ro
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mysql-data:
```

### nginx/default.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### php/Dockerfile

```dockerfile
FROM php:8.2-fpm-alpine

# PHP拡張のインストール
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Composerのインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
```

## Python + Django + PostgreSQL

### docker-compose.yml

```yaml
services:
  web:
    build: ./app
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    volumes:
      - ./app:/code
    environment:
      - DEBUG=True
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - SECRET_KEY=${DJANGO_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
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
    restart: unless-stopped

  # Celeryワーカー
  celery:
    build: ./app
    command: celery -A myproject worker -l INFO
    volumes:
      - ./app:/code
    environment:
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    profiles:
      - worker

  redis:
    image: redis:alpine
    profiles:
      - worker

volumes:
  postgres-data:
```

### app/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /code

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードはボリュームマウントで提供
# COPY . .

# 開発サーバー
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## 開発ワークフロー

### 初期セットアップ

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd <project-directory>

# 2. 環境変数ファイルを作成
cp .env.example .env
# .envを編集して必要な値を設定

# 3. コンテナをビルド・起動
docker compose up -d --build

# 4. 初期化タスク（データベースマイグレーションなど）
docker compose run --rm app npm run migrate
docker compose run --rm app npm run seed
```

### 日常的な操作

```bash
# 起動
docker compose up -d

# ログ確認
docker compose logs -f

# コンテナに入る
docker compose exec app sh

# 依存関係の追加
docker compose run --rm app npm install <package>

# テスト実行
docker compose run --rm app npm test

# 停止
docker compose down
```

### トラブルシューティング

```bash
# すべてをクリーンアップして再起動
docker compose down -v
docker compose up -d --build --force-recreate

# 特定のサービスのみ再起動
docker compose restart app

# イメージを再ビルド
docker compose build --no-cache app

# ネットワークの確認
docker network ls
docker network inspect <network-name>

# ボリュームの確認
docker volume ls
docker volume inspect <volume-name>
```

## まとめ

- Docker Composeで様々な技術スタックの開発環境を構築できる
- `docker-compose.override.yml`で開発/本番の設定を分離
- ボリュームマウントでホットリロードを実現
- healthcheckで確実なサービス起動順序を保証
- profilesで開発ツールをオプション化
- 環境変数で設定を柔軟に管理

これでChapter 4「Docker Compose」の学習は完了です。次のChapterでは、Dockerのネットワークとボリュームについてより深く学びます。
