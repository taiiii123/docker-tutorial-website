# Docker BuildKit

## 概要

このセクションでは、Docker BuildKitについて学びます。BuildKitはDockerの次世代ビルドシステムで、並列処理、キャッシュの効率化、セキュリティ機能など多くの改善をもたらします。

## BuildKitとは

**BuildKit**は、Moby プロジェクトの一部として開発された高性能なビルドツールキットです。Docker 18.09以降で利用可能で、Docker Desktop 23.0以降ではデフォルトで有効になっています。

### 従来のビルダーとの比較

| 機能 | 従来のビルダー | BuildKit |
|------|---------------|----------|
| 並列ビルド | 不可 | 可能 |
| キャッシュマウント | 不可 | 可能 |
| シークレットマウント | 不可 | 可能 |
| SSH転送 | 不可 | 可能 |
| マルチプラットフォーム | 限定的 | 完全対応 |
| 進捗表示 | 基本的 | 詳細 |

## BuildKitの有効化

### 環境変数で有効化

```bash
# 一時的に有効化
DOCKER_BUILDKIT=1 docker build -t myapp .

# 永続的に有効化（bashの場合）
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

### Docker設定で有効化

```json
// ~/.docker/daemon.json (Linux)
// または Docker Desktop の設定
{
  "features": {
    "buildkit": true
  }
}
```

### docker buildxの使用

```bash
# buildxはBuildKitをデフォルトで使用
docker buildx build -t myapp .

# ビルダーインスタンスの確認
docker buildx ls

# 新しいビルダーの作成
docker buildx create --name mybuilder --use
```

## Dockerfile構文の拡張

### syntax指示子

BuildKit専用機能を使用するには、Dockerfileの先頭に構文指示子を追加します。

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine
# BuildKit専用機能が使用可能
```

### 利用可能な構文バージョン

```dockerfile
# 最新の安定版
# syntax=docker/dockerfile:1

# 実験的機能を含む
# syntax=docker/dockerfile:1-labs

# 特定バージョン
# syntax=docker/dockerfile:1.6
```

## キャッシュマウント

ビルド時に永続的なキャッシュディレクトリをマウントできます。

### npm/yarn

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# npmキャッシュを永続化
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

### pip

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./

# pipキャッシュを永続化
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

COPY . .
```

### apt

```dockerfile
# syntax=docker/dockerfile:1

FROM debian:bookworm-slim

# aptキャッシュを永続化（sharing=locked で競合防止）
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates
```

### Go

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.22-alpine
WORKDIR /app

COPY go.mod go.sum ./

# モジュールキャッシュとビルドキャッシュを永続化
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o main .
```

## シークレットマウント

ビルド時にシークレット情報を安全に使用できます。シークレットは最終イメージに含まれません。

### 基本的な使用法

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# シークレットをマウントしてプライベートレジストリにアクセス
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci

COPY . .
```

```bash
# ビルド時にシークレットを渡す
docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

### 環境変数として使用

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.12-slim
WORKDIR /app

# シークレットを環境変数として読み込み
RUN --mount=type=secret,id=api_key \
    API_KEY=$(cat /run/secrets/api_key) && \
    pip install --extra-index-url https://pypi.example.com/simple/ \
        --trusted-host pypi.example.com \
        private-package
```

```bash
# ビルド時
echo "my-secret-key" | docker build --secret id=api_key -t myapp .
```

## SSHマウント

プライベートリポジトリのクローンなどでSSH鍵を安全に使用できます。

```dockerfile
# syntax=docker/dockerfile:1

FROM alpine:3.19

RUN apk add --no-cache git openssh-client

# SSHエージェントをマウントしてプライベートリポジトリをクローン
RUN --mount=type=ssh \
    mkdir -p /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts && \
    git clone git@github.com:myorg/private-repo.git /app
```

```bash
# SSHエージェントを使用してビルド
eval $(ssh-agent)
ssh-add ~/.ssh/id_rsa
docker build --ssh default -t myapp .
```

## バインドマウント

ビルド時に一時的にディレクトリをマウントできます。

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine
WORKDIR /app

# package.jsonをバインドマウント（COPYより高速な場合がある）
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

## ヒアドキュメント

複数行のスクリプトを読みやすく記述できます。

```dockerfile
# syntax=docker/dockerfile:1

FROM debian:bookworm-slim

# 複数行のスクリプト
RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends \
    curl \
    ca-certificates
rm -rf /var/lib/apt/lists/*
EOF

# 別のファイルとして作成
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF
```

### シェルを指定

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.12-slim

# Pythonスクリプトとして実行
RUN <<EOF python
import sys
print(f"Python version: {sys.version}")
EOF
```

## マルチプラットフォームビルド

### 複数アーキテクチャ向けビルド

```bash
# ビルダーの作成（QEMUエミュレーション付き）
docker buildx create --name multiarch --driver docker-container --use

# 複数プラットフォーム向けビルド
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t myapp:latest \
    --push .
```

### プラットフォーム変数の活用

```dockerfile
# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

# ビルド環境とターゲット環境の情報
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH
ARG BUILDPLATFORM

WORKDIR /app
COPY . .

# クロスコンパイル
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o main .

FROM --platform=$TARGETPLATFORM alpine:3.19
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

## 出力形式の指定

```bash
# イメージとしてエクスポート（デフォルト）
docker buildx build -t myapp --load .

# tar形式でエクスポート
docker buildx build -o type=tar,dest=myapp.tar .

# ローカルディレクトリにエクスポート
docker buildx build -o type=local,dest=./output .

# OCIイメージ形式
docker buildx build -o type=oci,dest=myapp-oci.tar .
```

## 進捗表示オプション

```bash
# 自動（TTYに応じて切り替え）
docker buildx build --progress=auto -t myapp .

# プレーンテキスト（CI/CD向け）
docker buildx build --progress=plain -t myapp .

# TTY形式（デフォルト）
docker buildx build --progress=tty -t myapp .
```

## ビルドキャッシュの管理

### キャッシュのエクスポート/インポート

```bash
# ローカルキャッシュ
docker buildx build \
    --cache-from=type=local,src=/tmp/buildcache \
    --cache-to=type=local,dest=/tmp/buildcache,mode=max \
    -t myapp .

# レジストリキャッシュ
docker buildx build \
    --cache-from=type=registry,ref=myregistry/myapp:cache \
    --cache-to=type=registry,ref=myregistry/myapp:cache,mode=max \
    -t myapp .

# GitHub Actions キャッシュ
docker buildx build \
    --cache-from=type=gha \
    --cache-to=type=gha,mode=max \
    -t myapp .
```

### キャッシュモード

| モード | 説明 |
|--------|------|
| min | 最終イメージのレイヤーのみキャッシュ（デフォルト） |
| max | すべてのビルドステージをキャッシュ |

## 実践例: 完全に最適化されたDockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ========================================
# ステージ1: 依存関係のインストール
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./

# npmキャッシュを活用
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ========================================
# ステージ2: ビルド
# ========================================
FROM deps AS builder
WORKDIR /app

COPY . .

# TypeScriptビルドキャッシュを活用
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ========================================
# ステージ3: 本番用依存関係
# ========================================
FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

# ========================================
# ステージ4: 本番イメージ
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザー
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

USER nextjs

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## まとめ

- BuildKitはDockerの次世代ビルドシステム
- キャッシュマウントで依存関係のインストールを高速化
- シークレットマウントで機密情報を安全に扱う
- SSHマウントでプライベートリポジトリにアクセス
- ヒアドキュメントで複雑なスクリプトを読みやすく記述
- マルチプラットフォームビルドで複数アーキテクチャに対応
- キャッシュのエクスポート/インポートでCI/CDを高速化

これでChapter 6「イメージ最適化」のすべてのセクションが完了しました。次のChapter 7では「セキュリティ」について学びます。
