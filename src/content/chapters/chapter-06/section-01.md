# マルチステージビルド

## 概要

このセクションでは、Dockerのマルチステージビルドについて学びます。ビルド環境と実行環境を分離することで、軽量で安全なイメージを作成する方法を習得します。

## マルチステージビルドとは

**マルチステージビルド**は、1つのDockerfile内で複数のビルドステージを定義し、最終的なイメージに必要なファイルのみを含める手法です。

### 従来の問題点

ビルドツールやソースコードを含んだままのイメージは：

- サイズが大きくなる
- 不要なツールがセキュリティリスクになる
- 本番環境には不要なファイルが含まれる

```dockerfile
# 従来の方法（問題あり）
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
# ビルドツール、ソースコード、node_modulesがすべて残る
CMD ["node", "dist/index.js"]
```

### マルチステージビルドによる解決

```dockerfile
# マルチステージビルド（推奨）
# ステージ1: ビルド環境
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ステージ2: 実行環境
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production
CMD ["node", "dist/index.js"]
```

## 基本構文

### FROM ... AS による名前付きステージ

```dockerfile
# ステージに名前を付ける
FROM image:tag AS stage-name
```

### COPY --from による成果物のコピー

```dockerfile
# 別ステージから特定のファイルをコピー
COPY --from=stage-name /source/path /destination/path

# ステージ番号でも指定可能（0から始まる）
COPY --from=0 /source/path /destination/path
```

## 実践例

### Go言語アプリケーション

Go言語はコンパイルして単一バイナリを生成できるため、マルチステージビルドの効果が特に高いです。

```dockerfile
# ステージ1: ビルド
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 依存関係のキャッシュを活用
COPY go.mod go.sum ./
RUN go mod download

# ソースコードをコピーしてビルド
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# ステージ2: 実行（超軽量）
FROM scratch
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

**サイズ比較**:
- ビルドステージ: 約800MB
- 最終イメージ: 約10MB（ビルドのみ）

### TypeScript / Node.jsアプリケーション

```dockerfile
# ステージ1: 依存関係のインストールとビルド
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# TypeScriptのビルド
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ステージ2: 本番用依存関係のみ
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# ステージ3: 最終イメージ
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# 非rootユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nodeuser

CMD ["node", "dist/index.js"]
```

### Reactアプリケーション（フロントエンド）

```dockerfile
# ステージ1: ビルド
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ステージ2: Nginxで配信
FROM nginx:alpine AS runner

# ビルド成果物のみをコピー
COPY --from=builder /app/build /usr/share/nginx/html

# カスタム設定（オプション）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**サイズ比較**:
- ビルドステージ: 約1.5GB（node_modules含む）
- 最終イメージ: 約25MB（静的ファイル + Nginx）

## 外部イメージからのコピー

公開されているイメージから直接ファイルをコピーすることもできます。

```dockerfile
FROM alpine

# 別のイメージからバイナリをコピー
COPY --from=busybox:latest /bin/busybox /bin/busybox

# 公開イメージからツールをコピー
COPY --from=docker:latest /usr/local/bin/docker /usr/local/bin/docker
```

## ターゲットステージの指定

ビルド時に特定のステージまでをビルドすることができます。

```dockerfile
FROM node:20-alpine AS deps
# 依存関係のインストール
COPY package*.json ./
RUN npm install

FROM deps AS test
# テスト用の設定
COPY . .
RUN npm test

FROM deps AS build
# 本番ビルド
COPY . .
RUN npm run build

FROM nginx:alpine AS production
# 本番環境
COPY --from=build /app/dist /usr/share/nginx/html
```

```bash
# テストステージまでビルド
docker build --target test -t myapp:test .

# 本番ステージをビルド
docker build --target production -t myapp:prod .

# 開発時は依存関係ステージのみ
docker build --target deps -t myapp:deps .
```

## ベストプラクティス

### 1. ステージに意味のある名前を付ける

```dockerfile
# 良い例
FROM node:20-alpine AS builder
FROM node:20-alpine AS runner

# 避けるべき例
FROM node:20-alpine AS stage1
FROM node:20-alpine AS stage2
```

### 2. 最終ステージは最小限に

```dockerfile
# 最終ステージには必要最小限のファイルのみ
FROM alpine AS runner
COPY --from=builder /app/binary /app/binary
COPY --from=builder /app/config /app/config
# ソースコード、テストファイル、ビルドツールは含めない
```

### 3. セキュリティを考慮

```dockerfile
# 非rootユーザーで実行
FROM alpine AS runner
RUN adduser -D appuser
USER appuser
COPY --from=builder --chown=appuser:appuser /app/binary /app/binary
```

### 4. 各ステージでキャッシュを活用

```dockerfile
# 変更が少ないファイルを先にコピー
COPY package*.json ./
RUN npm install
# 変更が多いファイルは後でコピー
COPY src ./src
```

## まとめ

- マルチステージビルドはビルド環境と実行環境を分離する技術
- 最終イメージに必要なファイルのみを含められる
- イメージサイズの大幅な削減が可能
- セキュリティ向上（不要なツールを含まない）
- `--target`オプションで開発・テスト・本番を切り替え可能

次のセクションでは、イメージサイズの削減テクニックについて詳しく学びます。
