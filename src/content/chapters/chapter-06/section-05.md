# ビルド時間の短縮

## 概要

このセクションでは、Dockerイメージのビルド時間を短縮するための様々なテクニックを学びます。CI/CDパイプラインや開発効率の向上に直結する重要なスキルです。

## ビルド時間が長くなる原因

| 原因 | 影響 | 解決策 |
|------|------|--------|
| キャッシュ未活用 | 毎回フルビルド | 命令順序の最適化 |
| 大きなビルドコンテキスト | 転送時間増加 | .dockerignore |
| 不要な依存関係 | インストール時間増加 | 必要最小限に |
| 並列化されていない | CPU未活用 | BuildKit活用 |
| ネットワーク遅延 | ダウンロード待ち | キャッシュマウント |

## テクニック1: レイヤーキャッシュの最大化

### 命令順序の最適化

```dockerfile
# 悪い例: ソース変更のたびにnpm installが実行される
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# 良い例: package.jsonが変わらなければnpm installはキャッシュ
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```

### 時間計測

```bash
# ビルド時間の計測
time docker build -t myapp .

# BuildKitでの進捗表示
DOCKER_BUILDKIT=1 docker build --progress=plain -t myapp .
```

## テクニック2: ビルドコンテキストの最小化

### .dockerignoreの徹底

```dockerignore
# 開発用ファイル
node_modules
.git
.gitignore
*.md
*.log

# テスト関連
__tests__
coverage
*.test.js
*.spec.js

# ビルド成果物（ローカル）
dist
build
.next

# IDE・OS
.vscode
.idea
.DS_Store

# Docker関連
Dockerfile*
docker-compose*.yml
.dockerignore
```

### 効果の確認

```bash
# ビルドコンテキストのサイズ確認
du -sh .

# .dockerignore適用後のコンテキストサイズ
# ビルドログの「Sending build context to Docker daemon」を確認
docker build -t myapp . 2>&1 | head -5
```

## テクニック3: 並列ビルド

### BuildKitの並列実行

BuildKitは依存関係のないステージを並列実行します。

```dockerfile
# syntax=docker/dockerfile:1

# 並列実行される独立したステージ
FROM node:20-alpine AS frontend-deps
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

FROM node:20-alpine AS backend-deps
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci

# 両方の完了を待つステージ
FROM node:20-alpine AS builder
COPY --from=frontend-deps /frontend/node_modules /app/frontend/node_modules
COPY --from=backend-deps /backend/node_modules /app/backend/node_modules
COPY . /app
RUN cd /app/frontend && npm run build
RUN cd /app/backend && npm run build
```

### 並列ビルドの視覚化

```bash
# BuildKitの詳細な進捗表示
DOCKER_BUILDKIT=1 docker build --progress=plain -t myapp .
```

## テクニック4: キャッシュマウント

### npm/yarn キャッシュ

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# npmキャッシュをマウント
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

### pip キャッシュ

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./

# pipキャッシュをマウント
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .
```

### Go モジュールキャッシュ

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.22-alpine
WORKDIR /app

COPY go.mod go.sum ./

# Goモジュールキャッシュをマウント
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o main .
```

### apt キャッシュ

```dockerfile
# syntax=docker/dockerfile:1

FROM debian:bookworm-slim

# aptキャッシュをマウント
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates
```

## テクニック5: 外部キャッシュの活用

### GitHub Actions でのキャッシュ

```yaml
# .github/workflows/build.yml
name: Build
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build with cache
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: myapp:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### レジストリキャッシュ

```bash
# キャッシュをレジストリに保存
docker buildx build \
    --cache-from=type=registry,ref=myregistry/myapp:cache \
    --cache-to=type=registry,ref=myregistry/myapp:cache,mode=max \
    -t myapp:latest .
```

## テクニック6: ベースイメージの事前ビルド

### 共通ベースイメージの作成

```dockerfile
# base.Dockerfile - 共通のベースイメージ
FROM node:20-alpine
RUN apk add --no-cache \
    tini \
    curl
WORKDIR /app
```

```bash
# ベースイメージを事前にビルド
docker build -f base.Dockerfile -t mycompany/node-base:20-alpine .

# 本番では事前ビルドしたベースを使用
```

```dockerfile
# app.Dockerfile
FROM mycompany/node-base:20-alpine
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "index.js"]
```

## テクニック7: マルチプラットフォームビルドの最適化

### ネイティブビルドの活用

```bash
# エミュレーションより高速
docker buildx build \
    --platform linux/amd64 \
    -t myapp:amd64 .

# 必要なプラットフォームのみビルド
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t myapp:multi .
```

### プラットフォーム別の最適化

```dockerfile
# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app
COPY . .

# クロスコンパイル（エミュレーションより高速）
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o main .

FROM scratch
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

## テクニック8: 増分ビルド

### ファイル変更の最小化

```dockerfile
# 設定ファイルと依存関係を分離
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# ソースのみ変更時はここからキャッシュ無効
COPY src/ ./src/
RUN npm run build
```

### ビルド成果物のキャッシュ

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# TypeScriptのビルドキャッシュをマウント
RUN --mount=type=cache,target=/app/.tsbuildinfo \
    npm run build
```

## ビルド時間の計測と分析

### BuildKitの詳細ログ

```bash
# 各ステップの時間を確認
DOCKER_BUILDKIT=1 docker build --progress=plain -t myapp . 2>&1 | tee build.log

# 時間のかかるステップを特定
grep -E "^\#[0-9]+ " build.log
```

### ビルド時間の比較

```bash
# 最適化前
time docker build -t myapp:before .

# 最適化後
time docker build -t myapp:after .

# キャッシュ有効時
time docker build -t myapp:cached .
```

## チェックリスト

```markdown
ビルド時間短縮チェックリスト:

- [ ] .dockerignoreが適切に設定されている
- [ ] 依存関係ファイルを先にCOPYしている
- [ ] BuildKitを有効化している
- [ ] キャッシュマウントを活用している
- [ ] 独立したステージは並列化している
- [ ] CI/CDで外部キャッシュを活用している
- [ ] 不要なパッケージをインストールしていない
- [ ] ビルド時間を定期的に計測している
```

## まとめ

- レイヤーキャッシュを最大限活用するために命令順序を最適化
- .dockerignoreでビルドコンテキストを最小化
- BuildKitの並列実行とキャッシュマウントで高速化
- CI/CDでは外部キャッシュ（GHA、レジストリ）を活用
- 共通ベースイメージを事前ビルドして再利用
- ビルド時間を計測して継続的に改善

次のセクションでは、Docker BuildKitの詳細について学びます。
