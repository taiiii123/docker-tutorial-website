# レイヤーキャッシュの理解

## 概要

このセクションでは、Dockerイメージのレイヤー構造とキャッシュの仕組みを学びます。キャッシュを効果的に活用することで、ビルド時間を大幅に短縮できます。

## Dockerイメージのレイヤー構造

### レイヤーとは

Dockerイメージは、複数の読み取り専用レイヤーで構成されています。各レイヤーは、Dockerfileの命令（FROM、RUN、COPY、ADDなど）に対応しています。

![Dockerイメージのレイヤー構造](/images/diagrams/dockerfile-layer-structure.png)

### レイヤーを作成する命令

| 命令 | レイヤー作成 | 説明 |
|------|-------------|------|
| FROM | ○ | ベースレイヤー |
| RUN | ○ | コマンド実行結果 |
| COPY | ○ | ファイルコピー |
| ADD | ○ | ファイル追加 |
| ENV | × | メタデータのみ |
| EXPOSE | × | メタデータのみ |
| CMD | × | メタデータのみ |
| ENTRYPOINT | × | メタデータのみ |
| WORKDIR | × | メタデータのみ |
| LABEL | × | メタデータのみ |

### レイヤーの確認

```bash
# イメージの履歴を表示
docker history myapp:latest

# 出力例:
IMAGE          CREATED         CREATED BY                                      SIZE
abc123def456   5 minutes ago   CMD ["npm" "start"]                             0B
<missing>      5 minutes ago   COPY . /app                                     1.2MB
<missing>      5 minutes ago   RUN /bin/sh -c npm install                      85MB
<missing>      5 minutes ago   COPY package*.json ./                           1.5kB
<missing>      2 weeks ago     /bin/sh -c #(nop) WORKDIR /app                  0B
...
```

## キャッシュの仕組み

### キャッシュの動作原理

Dockerは各命令の実行前に、同じ命令が以前に実行されたかどうかをチェックします。

![ビルド時のキャッシュ判定フロー](/images/diagrams/cache-decision-flow.png)

### キャッシュが有効な場合

```bash
# 1回目のビルド
docker build -t myapp .
# → すべてのレイヤーを新規作成

# 2回目のビルド（変更なし）
docker build -t myapp .
# → "Using cache" と表示され、即座に完了
```

### キャッシュが無効化される条件

| 条件 | 説明 |
|------|------|
| 命令が変更された | RUNのコマンドが変わった |
| コピーするファイルが変更された | COPY/ADDのソースファイルが変わった |
| 前のレイヤーが変更された | 上位のレイヤーが再ビルドされた |
| --no-cacheオプション | 明示的にキャッシュを無効化 |

## キャッシュ効率の最適化

### 悪い例：キャッシュが効かない

```dockerfile
FROM node:20-alpine

WORKDIR /app

# すべてのファイルをコピー
COPY . .

# 依存関係をインストール
RUN npm install

CMD ["npm", "start"]
```

問題点:
- ソースコードを変更するたびに、COPY以降のすべてが再実行される
- npm installも毎回実行される

### 良い例：キャッシュを効率的に使用

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 1. 依存関係ファイルを先にコピー
COPY package.json package-lock.json ./

# 2. 依存関係をインストール
RUN npm ci

# 3. ソースコードをコピー（変更頻度が高い）
COPY . .

CMD ["npm", "start"]
```

利点:
- package.jsonが変更されない限り、npm ciはキャッシュされる
- ソースコード変更時はCOPY . .以降のみ再実行

### 変更頻度による順序付け

```dockerfile
# 変更頻度: 低 → 高 の順に配置

FROM node:20-alpine          # 1. ベースイメージ（ほぼ変更なし）

WORKDIR /app                 # 2. 作業ディレクトリ（ほぼ変更なし）

# 3. システム依存関係（たまに変更）
RUN apk add --no-cache python3 make g++

# 4. 依存関係定義（時々変更）
COPY package.json package-lock.json ./
RUN npm ci

# 5. ソースコード（頻繁に変更）
COPY . .

# 6. ビルド（ソースに依存）
RUN npm run build

CMD ["npm", "start"]
```

## 実践的なキャッシュ最適化

### Node.jsプロジェクト

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 依存関係のキャッシュを最大化
COPY package.json package-lock.json ./

# npm ciは再現性が高く、キャッシュ効率が良い
RUN npm ci --only=production

# TypeScriptの設定（変更頻度：中）
COPY tsconfig.json ./

# ソースコード（変更頻度：高）
COPY src/ ./src/

# ビルド
RUN npm run build

CMD ["node", "dist/index.js"]
```

### Pythonプロジェクト

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# システム依存関係（変更頻度：低）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係（変更頻度：中）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコード（変更頻度：高）
COPY . .

CMD ["python", "app.py"]
```

### Go言語プロジェクト

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# モジュールのキャッシュ
COPY go.mod go.sum ./
RUN go mod download

# ソースコード
COPY . .
RUN CGO_ENABLED=0 go build -o main .

# 実行ステージ
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

## BuildKitのキャッシュ機能

### マウントキャッシュ

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./

# npmキャッシュをマウント
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
CMD ["npm", "start"]
```

### 言語別のキャッシュマウント

```dockerfile
# Node.js
RUN --mount=type=cache,target=/root/.npm npm ci

# Python pip
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Go modules
RUN --mount=type=cache,target=/go/pkg/mod go mod download

# Maven
RUN --mount=type=cache,target=/root/.m2 mvn install

# Gradle
RUN --mount=type=cache,target=/root/.gradle gradle build
```

## キャッシュの管理

### キャッシュを使わずにビルド

```bash
# キャッシュを無効化してビルド
docker build --no-cache -t myapp .

# 特定のステージからキャッシュを無効化
docker build --no-cache-filter builder -t myapp .
```

### キャッシュの削除

```bash
# ビルドキャッシュを削除
docker builder prune

# すべてのキャッシュを削除
docker builder prune -a

# 特定期間より古いキャッシュを削除
docker builder prune --filter "until=24h"
```

### キャッシュの状態確認

```bash
# ビルダーの使用状況
docker system df

# 出力例:
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        3         2.5GB     1.8GB (72%)
Containers      5         2         100MB     50MB (50%)
Local Volumes   10        5         500MB     200MB (40%)
Build Cache     50        0         1.2GB     1.2GB (100%)
```

## マルチステージビルドとキャッシュ

### ステージごとのキャッシュ

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# テストステージ
FROM builder AS tester
RUN npm run test

# 本番ステージ
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
```

```bash
# ビルドステージのみ（テスト、本番をスキップ）
docker build --target builder -t myapp:builder .

# テストまで実行
docker build --target tester -t myapp:tested .

# 本番イメージ（テストをスキップ）
docker build --target production -t myapp:prod .
```

### CI/CDでのキャッシュ活用

```yaml
# GitHub Actions
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: user/myapp:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## キャッシュが効かない場合のトラブルシューティング

### 問題1: ARGによるキャッシュ無効化

```dockerfile
# 問題: ARGが変わるとそれ以降のキャッシュが無効化
ARG BUILD_DATE
FROM node:20-alpine
RUN echo "Build date: ${BUILD_DATE}"  # 毎回再実行される
COPY . .

# 解決: ARGは使用する直前に配置
FROM node:20-alpine
COPY . .
ARG BUILD_DATE
RUN echo "Build date: ${BUILD_DATE}"  # COPYはキャッシュされる
```

### 問題2: COPYの順序ミス

```dockerfile
# 問題: すべてのファイルをコピーしてからインストール
COPY . .
RUN npm install  # 常に再実行される

# 解決: 依存関係ファイルを先にコピー
COPY package*.json ./
RUN npm install  # package.jsonが変わらなければキャッシュされる
COPY . .
```

### 問題3: apt-get updateの分離

```dockerfile
# 問題: updateとinstallが別のRUN
RUN apt-get update
RUN apt-get install -y curl  # updateのキャッシュが古くなる可能性

# 解決: 同じRUNで実行
RUN apt-get update && apt-get install -y curl
```

### 問題4: タイムスタンプの影響

```bash
# 問題: ファイルのタイムスタンプが変わるとキャッシュ無効化
# git cloneした直後など

# 解決: .dockerignoreで不要ファイルを除外
# または、ファイルのチェックサムベースの判定を利用
```

## キャッシュ効率の測定

### ビルド時間の計測

```bash
# 時間を計測
time docker build -t myapp .

# キャッシュあり
# real    0m5.123s

# キャッシュなし
time docker build --no-cache -t myapp .
# real    1m45.678s
```

### ビルドログの確認

```bash
# キャッシュ使用時のログ
docker build -t myapp .

# 出力例:
# Step 3/7 : COPY package*.json ./
#  ---> Using cache
#  ---> abc123def456
# Step 4/7 : RUN npm ci
#  ---> Using cache
#  ---> def456ghi789
```

## まとめ

- Dockerイメージは複数のレイヤーで構成される
- 各命令の結果がキャッシュされ、再ビルドを高速化
- 変更頻度の低い命令を先に、高い命令を後に配置
- 依存関係ファイルはソースコードより先にコピー
- BuildKitのマウントキャッシュでさらに高速化可能
- --no-cacheで強制的にキャッシュを無効化できる

これでChapter 3「Dockerfile」のすべてのセクションが完了しました。次のChapterでは、Docker Composeについて学びます。
