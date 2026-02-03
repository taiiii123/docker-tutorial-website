# イメージサイズの削減テクニック

## 概要

このセクションでは、Dockerイメージのサイズを削減するための様々なテクニックを学びます。軽量なイメージはダウンロード時間の短縮、ストレージの節約、デプロイの高速化につながります。

## なぜイメージサイズを削減するのか

### 大きなイメージの問題点

| 問題 | 影響 |
|------|------|
| ダウンロード時間 | CI/CDパイプラインの遅延 |
| ストレージコスト | レジストリ、サーバーの容量圧迫 |
| 起動時間 | オートスケーリングの遅延 |
| セキュリティリスク | 不要なパッケージに脆弱性が含まれる可能性 |
| ネットワーク帯域 | 転送コストの増加 |

### サイズ削減の効果

```bash
# イメージサイズの確認
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 例：同じアプリケーションでも
myapp:unoptimized    1.2GB
myapp:optimized      150MB  # 約88%削減
```

## テクニック1: 不要なファイルの削除

### パッケージマネージャーのキャッシュ削除

```dockerfile
# Debian/Ubuntu系
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Alpine系
FROM alpine:3.19
RUN apk add --no-cache curl vim

# 注意: --no-cacheはキャッシュを残さない
```

### 不要なパッケージを含めない

```dockerfile
# 悪い例：推奨パッケージもインストール
RUN apt-get install -y python3

# 良い例：推奨パッケージを除外
RUN apt-get install -y --no-install-recommends python3
```

### 一時ファイルの削除

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build \
    && rm -rf src \
    && rm -rf node_modules \
    && npm ci --production
```

## テクニック2: レイヤーの最適化

### RUN命令の結合

各RUN命令は新しいレイヤーを作成します。関連する操作は1つにまとめましょう。

```dockerfile
# 悪い例：複数レイヤーが作成される
FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim
RUN rm -rf /var/lib/apt/lists/*

# 良い例：1つのレイヤーにまとめる
FROM ubuntu:22.04
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        vim \
    && rm -rf /var/lib/apt/lists/*
```

### 同一レイヤーでの追加と削除

ファイルの追加と削除は同じレイヤーで行わないと、削除しても容量は減りません。

```dockerfile
# 悪い例：ファイルは削除されてもレイヤーに残る
RUN curl -O https://example.com/large-file.tar.gz
RUN tar -xzf large-file.tar.gz
RUN rm large-file.tar.gz  # このレイヤーで削除しても上のレイヤーには残る

# 良い例：同一レイヤーで完結
RUN curl -O https://example.com/large-file.tar.gz \
    && tar -xzf large-file.tar.gz \
    && rm large-file.tar.gz
```

## テクニック3: .dockerignoreの活用

不要なファイルをビルドコンテキストから除外します。

```dockerignore
# .dockerignore

# Git関連
.git
.gitignore

# 開発用ファイル
.env.local
.env.development
*.log
*.md
!README.md

# テスト関連
__tests__
*.test.js
*.spec.js
coverage/

# IDE設定
.vscode
.idea
*.swp

# ビルド成果物（ローカル）
node_modules
dist
build

# Docker関連
Dockerfile*
docker-compose*.yml
.dockerignore

# OS固有
.DS_Store
Thumbs.db
```

### .dockerignoreの効果確認

```bash
# ビルドコンテキストのサイズ確認
du -sh .

# .dockerignore適用後
# ビルド時のログで「Sending build context to Docker daemon」を確認
docker build -t myapp .
```

## テクニック4: 必要なファイルのみCOPY

```dockerfile
# 悪い例：すべてコピー
COPY . .

# 良い例：必要なファイルのみ
COPY package*.json ./
COPY src ./src
COPY public ./public
```

## テクニック5: 圧縮と最小化

### フロントエンドアセットの最小化

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# プロダクションビルド時に最小化
RUN npm run build

FROM nginx:alpine
# 最小化されたファイルのみをコピー
COPY --from=builder /app/dist /usr/share/nginx/html
```

### バイナリのストリップ

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
# -ldflags="-s -w" でデバッグ情報を削除
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o main .

FROM scratch
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

### UPXによる実行ファイルの圧縮

```dockerfile
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache upx
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o main . \
    && upx --best --lzma main

FROM scratch
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

## テクニック6: ドキュメントとマニュアルの除外

```dockerfile
# Debian系でドキュメントをインストールしない設定
FROM debian:bullseye-slim
RUN echo 'path-exclude /usr/share/doc/*' >> /etc/dpkg/dpkg.cfg.d/excludes \
    && echo 'path-exclude /usr/share/man/*' >> /etc/dpkg/dpkg.cfg.d/excludes \
    && echo 'path-exclude /usr/share/info/*' >> /etc/dpkg/dpkg.cfg.d/excludes
```

## イメージサイズの分析ツール

### docker history

```bash
# 各レイヤーのサイズを確認
docker history myapp:latest

# 詳細表示
docker history --no-trunc myapp:latest
```

### dive（推奨ツール）

```bash
# diveのインストール（Windows: chocolatey）
choco install dive

# diveのインストール（Mac: homebrew）
brew install dive

# イメージの分析
dive myapp:latest
```

diveは対話的にレイヤーを探索し、無駄なスペースを特定できます。

### docker inspect

```bash
# イメージの詳細情報
docker inspect myapp:latest --format '{{.Size}}'

# レイヤーIDの一覧
docker inspect myapp:latest --format '{{json .RootFS.Layers}}' | jq
```

## サイズ削減のチェックリスト

```markdown
- [ ] 軽量なベースイメージを使用している（alpine, slim, distroless）
- [ ] マルチステージビルドを使用している
- [ ] パッケージキャッシュを削除している
- [ ] --no-install-recommendsを使用している
- [ ] RUN命令を適切に結合している
- [ ] .dockerignoreを設定している
- [ ] 必要なファイルのみCOPYしている
- [ ] 一時ファイルを同一レイヤーで削除している
- [ ] バイナリをストリップしている（該当する場合）
```

## まとめ

- パッケージキャッシュの削除で数百MB削減可能
- RUN命令の結合でレイヤー数とサイズを削減
- .dockerignoreでビルドコンテキストを最適化
- 同一レイヤーでファイルの追加と削除を行う
- diveなどのツールで無駄を特定

次のセクションでは、ベースイメージの選択について詳しく学びます。
