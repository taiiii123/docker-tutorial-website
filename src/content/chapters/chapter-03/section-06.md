# イメージのビルドとタグ付け

## 概要

このセクションでは、Dockerイメージのビルド方法とタグ付けの戦略について学びます。適切なビルドとタグ付けにより、イメージの管理とデプロイがスムーズになります。

## docker buildの基本

### 基本構文

```bash
docker build [オプション] パス
```

### シンプルなビルド

```bash
# カレントディレクトリのDockerfileを使用
docker build .

# 出力例:
# Sending build context to Docker daemon  2.048kB
# Step 1/5 : FROM node:20-alpine
# ...
# Successfully built abc123def456
```

### タグを指定してビルド

```bash
# -t（--tag）でイメージ名を指定
docker build -t myapp .

# タグ（バージョン）も指定
docker build -t myapp:1.0.0 .

# 複数のタグを付与
docker build -t myapp:1.0.0 -t myapp:latest .
```

## ビルドオプション

### よく使うオプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `-t, --tag` | イメージ名とタグを指定 | `-t myapp:1.0` |
| `-f, --file` | Dockerfileを指定 | `-f Dockerfile.prod` |
| `--build-arg` | ビルド引数を渡す | `--build-arg VERSION=1.0` |
| `--no-cache` | キャッシュを使用しない | `--no-cache` |
| `--target` | マルチステージのターゲット | `--target production` |
| `--platform` | プラットフォームを指定 | `--platform linux/amd64` |

### 使用例

```bash
# 別のDockerfileを指定
docker build -f Dockerfile.dev -t myapp:dev .

# ビルド引数を渡す
docker build --build-arg NODE_VERSION=18 -t myapp .

# キャッシュを使わずにビルド
docker build --no-cache -t myapp .

# マルチステージビルドのターゲットを指定
docker build --target builder -t myapp:builder .

# 複数プラットフォーム向けビルド
docker build --platform linux/amd64,linux/arm64 -t myapp .
```

## タグ付けの戦略

### タグの形式

```
[レジストリ/][ユーザー名/]リポジトリ名[:タグ]
```

### 一般的なタグ付けパターン

```bash
# バージョン番号
myapp:1.0.0
myapp:1.0
myapp:1

# セマンティックバージョニング
myapp:v1.2.3
myapp:v1.2
myapp:v1

# 環境別
myapp:production
myapp:staging
myapp:development

# Gitハッシュ
myapp:abc123f
myapp:git-abc123f

# 日付ベース
myapp:2024-01-15
myapp:20240115

# latest（最新版）
myapp:latest
```

### セマンティックバージョニングの推奨パターン

```bash
# バージョン1.2.3のリリース時
docker build -t myapp:1.2.3 \
             -t myapp:1.2 \
             -t myapp:1 \
             -t myapp:latest .

# これにより:
# myapp:1.2.3 → 完全固定（推奨）
# myapp:1.2   → パッチバージョンは最新
# myapp:1     → マイナーバージョンは最新
# myapp:latest → 最新版
```

### 本番環境でのタグ付け

```bash
# 本番環境では常に固定タグを使用
docker pull myapp:1.2.3  # 良い
docker pull myapp:latest # 避けるべき（変更される可能性）

# Gitハッシュで一意性を確保
docker build -t myapp:$(git rev-parse --short HEAD) .
```

## docker tag コマンド

既存のイメージにタグを追加できます。

### 基本構文

```bash
docker tag 元イメージ 新タグ
```

### 使用例

```bash
# 新しいタグを追加
docker tag myapp:1.0.0 myapp:latest

# レジストリ用のタグを追加
docker tag myapp:1.0.0 docker.io/myuser/myapp:1.0.0
docker tag myapp:1.0.0 ghcr.io/myuser/myapp:1.0.0

# 複数のタグを追加
docker tag myapp:1.0.0 myapp:1.0
docker tag myapp:1.0.0 myapp:1
```

## マルチステージビルド

### 基本的なマルチステージビルド

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行ステージ
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### ステージごとのビルド

```bash
# ビルドステージのみ
docker build --target builder -t myapp:builder .

# 本番ステージ
docker build --target production -t myapp:production .

# デフォルト（最終ステージ）
docker build -t myapp .
```

### 開発/本番環境の切り替え

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# 開発環境
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 本番環境
FROM base AS production
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

```bash
# 開発用
docker build --target development -t myapp:dev .

# 本番用
docker build --target production -t myapp:prod .
```

## ビルドコンテキスト

### コンテキストの指定

```bash
# カレントディレクトリ
docker build .

# 別のディレクトリ
docker build ./app

# URLから（Git）
docker build https://github.com/user/repo.git

# 標準入力から（Dockerfileのみ）
docker build - < Dockerfile

# tarアーカイブから
docker build - < context.tar.gz
```

### 最適なビルドコンテキスト

```bash
# 悪い例：プロジェクトルート全体
cd /home/user/projects
docker build .  # 大量のファイルが含まれる

# 良い例：必要なディレクトリのみ
docker build ./myapp

# 良い例：.dockerignoreで除外
# .dockerignoreファイルで不要ファイルを除外してからビルド
```

## BuildKit

Docker BuildKitは、新しいビルドエンジンで、パフォーマンスと機能が向上しています。

### BuildKitの有効化

```bash
# 環境変数で有効化
DOCKER_BUILDKIT=1 docker build -t myapp .

# Docker Desktop 4.x以降はデフォルトで有効
```

### BuildKitの機能

```dockerfile
# syntax=docker/dockerfile:1.4

# シークレットのマウント
RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret

# SSHのマウント
RUN --mount=type=ssh git clone git@github.com:user/repo.git

# キャッシュのマウント
RUN --mount=type=cache,target=/root/.npm npm install

# バインドマウント
RUN --mount=type=bind,source=package.json,target=/app/package.json \
    npm install
```

### キャッシュマウントの例

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./

# npmキャッシュをマウントして高速化
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
CMD ["npm", "start"]
```

## CI/CDでのビルド

### GitHub Actions

```yaml
name: Build and Push

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            user/myapp:${{ github.ref_name }}
            user/myapp:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### タグの自動生成

```bash
# Gitタグからバージョンを取得
VERSION=$(git describe --tags --abbrev=0)
docker build -t myapp:${VERSION} .

# Gitハッシュを使用
HASH=$(git rev-parse --short HEAD)
docker build -t myapp:${HASH} .

# 日付とハッシュの組み合わせ
TAG=$(date +%Y%m%d)-$(git rev-parse --short HEAD)
docker build -t myapp:${TAG} .
```

## イメージの確認

### ビルドしたイメージの確認

```bash
# イメージ一覧
docker images myapp

# 出力例:
# REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
# myapp        1.0.0     abc123def456   5 minutes ago    150MB
# myapp        latest    abc123def456   5 minutes ago    150MB

# 詳細情報
docker inspect myapp:1.0.0

# イメージの履歴（レイヤー）
docker history myapp:1.0.0
```

### イメージサイズの最適化確認

```bash
# サイズを比較
docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | sort

# 未使用イメージの削除
docker image prune

# ダングリングイメージ（タグなし）の削除
docker image prune -a
```

## ベストプラクティス

### 1. 固定タグを使用

```bash
# 本番環境では必ず固定タグ
FROM node:20.10.0-alpine  # 良い
FROM node:latest          # 避ける
```

### 2. 意味のあるタグ名

```bash
# 良い例
myapp:1.2.3
myapp:v1.2.3-rc1
myapp:feature-auth-abc123

# 避けるべき
myapp:new
myapp:test
myapp:final
```

### 3. CI/CDでの自動タグ付け

```bash
# バージョンタグ + Git SHA
docker build \
  -t myapp:${VERSION} \
  -t myapp:${VERSION}-${GIT_SHA} \
  -t myapp:latest .
```

### 4. レジストリURLを含める

```bash
# Docker Hub
docker tag myapp:1.0.0 docker.io/username/myapp:1.0.0

# GitHub Container Registry
docker tag myapp:1.0.0 ghcr.io/username/myapp:1.0.0

# Amazon ECR
docker tag myapp:1.0.0 123456789.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:1.0.0
```

## まとめ

- `docker build -t`でイメージ名とタグを指定してビルド
- セマンティックバージョニングで複数タグを付与
- 本番環境では固定タグ（latest避ける）を使用
- マルチステージビルドで効率的なイメージを作成
- BuildKitで高速化とセキュリティ向上
- CI/CDでタグ付けを自動化

次のセクションでは、レイヤーキャッシュの理解について学びます。
