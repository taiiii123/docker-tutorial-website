# 本番環境向けDockerfile

## 概要

このセクションでは、本番環境で使用するDockerfileの最適化手法について学びます。セキュリティ、パフォーマンス、イメージサイズを考慮した実践的なベストプラクティスを紹介します。

## 開発環境と本番環境の違い

開発環境と本番環境では、Dockerfileに求められる要件が異なります。

| 観点 | 開発環境 | 本番環境 |
|------|----------|----------|
| イメージサイズ | 大きくても可 | できるだけ小さく |
| ビルド速度 | 重要 | やや重要 |
| セキュリティ | 緩め | 厳格 |
| デバッグツール | 必要 | 最小限 |
| ホットリロード | 必要 | 不要 |

## マルチステージビルド

本番環境向けDockerfileで最も重要な技術が**マルチステージビルド**です。ビルド時に必要なツールと実行時に必要なファイルを分離できます。

### 基本的なマルチステージビルド

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS production
WORKDIR /app
# 本番用の依存関係のみインストール
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist
# 非rootユーザーで実行
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 利点

- ビルドツールが最終イメージに含まれない
- イメージサイズの大幅な削減
- セキュリティリスクの低減

## ベースイメージの選択

### Alpine Linux を使用する

```dockerfile
# 推奨: Alpine ベース（約5MB）
FROM node:20-alpine

# 非推奨: フルイメージ（約1GB）
FROM node:20
```

### Distroless イメージ

Google が提供する最小限のイメージで、シェルすら含まれていません。

```dockerfile
# ビルドステージ
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 本番ステージ（Distroless）
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /
CMD ["/main"]
```

## セキュリティ強化

### 非rootユーザーの使用

```dockerfile
FROM node:20-alpine

# 専用ユーザーを作成
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

# 非rootユーザーに切り替え
USER appuser

CMD ["node", "index.js"]
```

### 読み取り専用ファイルシステム

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

# 書き込みが必要なディレクトリのみ許可
VOLUME ["/app/logs", "/app/tmp"]

USER node
CMD ["node", "index.js"]
```

実行時に読み取り専用で起動:

```bash
docker run --read-only --tmpfs /tmp myapp:latest
```

### 機密情報の取り扱い

```dockerfile
# 悪い例: 機密情報をイメージに含める
ENV API_KEY=secret123

# 良い例: 実行時に環境変数で渡す
# docker run -e API_KEY=secret123 myapp
```

## レイヤーキャッシュの最適化

### 依存関係を先にコピー

```dockerfile
FROM node:20-alpine
WORKDIR /app

# 依存関係ファイルを先にコピー（キャッシュ活用）
COPY package*.json ./
RUN npm ci --only=production

# ソースコードを後でコピー
COPY . .

CMD ["node", "index.js"]
```

### .dockerignore の活用

```text
# .dockerignore
node_modules
npm-debug.log
Dockerfile*
docker-compose*
.git
.gitignore
.env*
*.md
tests
coverage
.vscode
.idea
```

## 本番向け最適化テクニック

### 1. 依存関係の固定

```dockerfile
# package-lock.json を使用して依存関係を固定
COPY package.json package-lock.json ./
RUN npm ci --only=production
```

### 2. 不要ファイルの削除

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# 不要ファイルを削除
RUN rm -rf node_modules/**/test \
    node_modules/**/tests \
    node_modules/**/*.md \
    node_modules/**/LICENSE

CMD ["node", "dist/index.js"]
```

### 3. ラベルの付与

```dockerfile
FROM node:20-alpine

# OCI 標準ラベル
LABEL org.opencontainers.image.title="My Application"
LABEL org.opencontainers.image.description="Production-ready Node.js app"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="team@example.com"
LABEL org.opencontainers.image.source="https://github.com/example/myapp"

WORKDIR /app
COPY . .
CMD ["node", "index.js"]
```

## 完全な本番環境向けDockerfile例

### Node.js アプリケーション

```dockerfile
# syntax=docker/dockerfile:1

# ビルドステージ
FROM node:20-alpine AS builder

# セキュリティアップデート
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ビルド
COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS production

# メタデータ
LABEL org.opencontainers.image.title="My Production App"
LABEL org.opencontainers.image.version="1.0.0"

# セキュリティアップデート
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# 非rootユーザー
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# 本番用依存関係のみ
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# ビルド成果物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# ユーザー切り替え
USER nodejs

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Python アプリケーション

```dockerfile
# syntax=docker/dockerfile:1

# ビルドステージ
FROM python:3.12-slim AS builder

WORKDIR /app

# 仮想環境を作成
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 本番ステージ
FROM python:3.12-slim AS production

# 非rootユーザー
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# 仮想環境をコピー
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# アプリケーションコード
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

## イメージサイズの確認

```bash
# イメージサイズの確認
docker images myapp

# 詳細な分析
docker history myapp:latest

# dive ツールでレイヤー分析
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock wagoodman/dive myapp:latest
```

## まとめ

- マルチステージビルドでビルドツールを最終イメージから除外
- Alpine や Distroless などの軽量ベースイメージを使用
- 非rootユーザーでコンテナを実行
- 依存関係を先にコピーしてキャッシュを活用
- .dockerignore で不要ファイルを除外
- ラベルでイメージにメタデータを付与
- セキュリティアップデートを適用

次のセクションでは、コンテナのヘルスチェック実装について学びます。
