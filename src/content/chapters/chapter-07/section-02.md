# 非rootユーザーでの実行

## 概要

このセクションでは、Dockerコンテナを非rootユーザーで実行する方法を学びます。rootユーザーで実行するリスクを理解し、安全なコンテナ運用のための設定方法を習得します。

## rootユーザーで実行するリスク

デフォルトでは、多くのDockerコンテナはrootユーザーで実行されます。これには深刻なセキュリティリスクがあります。

### リスクの具体例

![root実行のリスク](/images/diagrams/root-execution-risk.png)

### rootで実行されているか確認

```bash
# コンテナ内で実行ユーザーを確認
docker run --rm nginx whoami
# 出力: root

# プロセスのUID/GIDを確認
docker run --rm nginx id
# 出力: uid=0(root) gid=0(root) groups=0(root)
```

## DockerfileでのUSER命令

### 基本的な使い方

```dockerfile
# 基本的なUSER命令の使用
FROM node:20-alpine

# アプリケーションディレクトリを作成
WORKDIR /app

# 依存関係をインストール（root権限で）
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードをコピー（所有者を指定）
COPY --chown=node:node . .

# 非rootユーザーに切り替え
USER node

# アプリケーションを起動
EXPOSE 3000
CMD ["node", "server.js"]
```

### ユーザーを作成する場合

```dockerfile
FROM ubuntu:22.04

# 非rootユーザーを作成
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# アプリケーションディレクトリを作成し、所有権を設定
WORKDIR /app
RUN chown appuser:appgroup /app

# root権限が必要な操作をここで実行
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 非rootユーザーに切り替え
USER appuser

# 以降の操作は非rootユーザーで実行される
COPY --chown=appuser:appgroup . .

CMD ["./start.sh"]
```

### Alpine Linuxの場合

```dockerfile
FROM alpine:3.19

# Alpine では addgroup/adduser を使用
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

WORKDIR /app
RUN chown appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup . .

CMD ["./start.sh"]
```

## 既存イメージの非root化

### 方法1: docker runで指定

```bash
# ユーザーIDを指定して実行
docker run --user 1000:1000 nginx

# ユーザー名を指定して実行（イメージ内にユーザーが存在する場合）
docker run --user nginx nginx
```

### 方法2: Docker Composeで指定

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx
    user: "1000:1000"
    volumes:
      - ./html:/usr/share/nginx/html:ro
    ports:
      - "8080:80"
```

### 方法3: 新しいDockerfileで拡張

```dockerfile
# Dockerfile
FROM nginx:alpine

# 既存のnginxユーザーを使用するように設定
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# nginx設定を非特権ポートに変更
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

## ファイルパーミッションの設定

### COPY/ADDでの所有者指定

```dockerfile
# --chownフラグで所有者を指定
COPY --chown=appuser:appgroup src/ /app/src/
COPY --chown=1000:1000 config.json /app/

# ADDでも同様
ADD --chown=appuser:appgroup https://example.com/file.tar.gz /app/
```

### マルチステージビルドでの注意

```dockerfile
# ビルドステージ（root権限で実行）
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行ステージ（非rootユーザー）
FROM node:20-alpine
WORKDIR /app

# 非rootユーザーを設定
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

# ビルド成果物をコピー（所有者を指定）
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 特権ポートの問題と解決策

1024未満のポート（特権ポート）は、rootユーザーのみがバインドできます。

### 解決策1: 非特権ポートを使用

```dockerfile
# アプリケーションを8080ポートで起動
EXPOSE 8080
USER appuser
CMD ["node", "server.js"]  # server.jsは8080をリッスン
```

```bash
# ホストの80番ポートにマッピング
docker run -p 80:8080 myapp
```

### 解決策2: CAP_NET_BIND_SERVICEを追加

```bash
# 特権ポートをバインドする権限を追加
docker run --cap-add=NET_BIND_SERVICE --user 1000:1000 myapp
```

```yaml
# docker-compose.yml
services:
  web:
    image: myapp
    user: "1000:1000"
    cap_add:
      - NET_BIND_SERVICE
```

## 書き込み可能ディレクトリの設定

非rootユーザーがファイルを書き込む必要がある場合の設定方法です。

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 書き込みが必要なディレクトリを作成し、権限を設定
RUN mkdir -p /app/logs /app/tmp /app/data && \
    chown -R node:node /app

USER node

# ボリュームとして使用するディレクトリを定義
VOLUME ["/app/data"]

COPY --chown=node:node . .

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    user: "1000:1000"
    volumes:
      - app-data:/app/data
      - ./logs:/app/logs

volumes:
  app-data:
```

## User Namespace Remapping

ホストとコンテナでユーザーIDをリマップし、より安全に実行する高度な設定です。

### daemon.jsonの設定

```json
{
  "userns-remap": "default"
}
```

```bash
# Docker daemonを再起動
sudo systemctl restart docker

# 確認
docker info | grep -i userns
```

この設定により、コンテナ内のroot（UID 0）がホストでは非特権ユーザーにマッピングされます。

## 実践的なチェック方法

```bash
# コンテナが非rootで実行されているか確認
docker run --rm myapp id
# 期待される出力: uid=1000(appuser) gid=1000(appgroup) ...

# 実行中のコンテナを確認
docker exec mycontainer whoami
docker exec mycontainer id

# Docker Composeで確認
docker compose exec app id
```

## まとめ

- rootユーザーでの実行はセキュリティリスクが高い
- `USER`命令でDockerfile内で非rootユーザーを指定
- `--chown`フラグでファイルの所有者を適切に設定
- 特権ポートは非特権ポートに変更してマッピングで対応
- マルチステージビルドでも所有者設定を忘れずに
- User Namespace Remappingでより強固なセキュリティを実現

次のセクションでは、イメージの脆弱性スキャンについて学びます。
