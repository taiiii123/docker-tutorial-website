# FROM, RUN, COPY, ADD

## 概要

このセクションでは、Dockerfileで最も頻繁に使用される4つの命令について詳しく学びます。これらの命令を理解することで、実用的なDockerイメージを作成できるようになります。

## FROM命令

**FROM**命令は、ビルドの基盤となるベースイメージを指定します。すべてのDockerfileは必ずFROM命令から始まります。

### 基本構文

```dockerfile
FROM イメージ名[:タグ]
FROM イメージ名[@ダイジェスト]
```

### 使用例

```dockerfile
# 公式イメージ（タグ指定なし = latest）
FROM ubuntu

# バージョン指定
FROM ubuntu:22.04

# 軽量イメージ
FROM node:20-alpine

# ダイジェストで完全固定
FROM python@sha256:3c5e0e5e8e4c6b7a9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c
```

### ベースイメージの選択

| イメージタイプ | 特徴 | ユースケース |
|---------------|------|-------------|
| `alpine` | 軽量（約5MB） | 本番環境、セキュリティ重視 |
| `slim` | 中程度（約100MB） | バランス重視 |
| `bullseye`/`bookworm` | フル機能 | デバッグ、開発環境 |
| `scratch` | 空のイメージ | スタティックバイナリ |

### マルチステージビルドでの使用

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行ステージ
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### ARGを使った動的なベースイメージ

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

WORKDIR /app
COPY . .
```

ビルド時に指定:
```bash
docker build --build-arg NODE_VERSION=18 -t myapp .
```

## RUN命令

**RUN**命令は、イメージのビルド時にコマンドを実行します。パッケージのインストールやファイルの作成などに使用します。

### 基本構文

```dockerfile
# シェル形式
RUN コマンド

# Exec形式
RUN ["実行ファイル", "引数1", "引数2"]
```

### 使用例

```dockerfile
# パッケージのインストール
RUN apt-get update && apt-get install -y curl

# ディレクトリの作成
RUN mkdir -p /app/logs

# ファイルの権限変更
RUN chmod +x /app/start.sh
```

### コマンドの連結

1つのRUN命令で複数のコマンドを実行する方が、レイヤー数を減らせます。

```dockerfile
# 悪い例：レイヤーが3つ作成される
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean

# 良い例：レイヤーが1つだけ
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### パッケージインストールのベストプラクティス

```dockerfile
# Debian/Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Alpine
RUN apk add --no-cache \
    curl \
    git \
    vim
```

| オプション | 説明 |
|-----------|------|
| `--no-install-recommends` | 推奨パッケージをインストールしない |
| `--no-cache` | キャッシュを保存しない（Alpine） |
| `apt-get clean` | キャッシュを削除 |
| `rm -rf /var/lib/apt/lists/*` | パッケージリストを削除 |

## COPY命令

**COPY**命令は、ホストマシンのファイルやディレクトリをイメージにコピーします。

### 基本構文

```dockerfile
COPY [オプション] ソース... コピー先
COPY [オプション] ["ソース", ..., "コピー先"]
```

### 使用例

```dockerfile
# 単一ファイルをコピー
COPY package.json /app/

# 複数ファイルをコピー
COPY package.json package-lock.json /app/

# ディレクトリをコピー
COPY src/ /app/src/

# すべてをコピー
COPY . /app/

# ワイルドカードの使用
COPY *.json /app/
COPY config/*.yml /app/config/
```

### COPYのオプション

```dockerfile
# --chown: 所有者とグループを指定
COPY --chown=node:node package.json /app/

# --chmod: パーミッションを指定（Docker BuildKit必要）
COPY --chmod=755 start.sh /app/

# --from: 別のステージからコピー
COPY --from=builder /app/dist /usr/share/nginx/html
```

### WORKDIRとの組み合わせ

```dockerfile
WORKDIR /app

# 相対パスが使用可能
COPY package.json .
COPY src/ ./src/
```

## ADD命令

**ADD**命令は、COPYと似ていますが、追加機能があります。

### 基本構文

```dockerfile
ADD [オプション] ソース... コピー先
```

### COPYとの違い

| 機能 | COPY | ADD |
|------|------|-----|
| ローカルファイルのコピー | ○ | ○ |
| URLからのダウンロード | × | ○ |
| アーカイブの自動展開 | × | ○ |
| 推奨度 | 高 | 状況による |

### 使用例

```dockerfile
# アーカイブの自動展開
ADD app.tar.gz /app/
# → /app/ にtar.gzの内容が展開される

# URLからのダウンロード（非推奨）
ADD https://example.com/file.txt /app/
```

### ADDのアーカイブ展開機能

```dockerfile
# 展開されるアーカイブ形式
# tar, tar.gz, tar.bz2, tar.xz, tgz, tbz2

# 例：app.tar.gzを/appに展開
ADD app.tar.gz /app/

# ディレクトリ構造
# app.tar.gz の中身:
#   app/
#     index.js
#     package.json
#
# 結果:
#   /app/
#     index.js
#     package.json
```

### COPYを使うべき場合（推奨）

```dockerfile
# ほとんどの場合はCOPYを使用
COPY package.json /app/
COPY src/ /app/src/
```

### ADDを使うべき場合

```dockerfile
# ローカルのアーカイブを展開したい場合のみ
ADD app.tar.gz /app/
```

### URLからのダウンロード（curlを推奨）

```dockerfile
# 悪い例：ADDでURLからダウンロード
ADD https://example.com/file.txt /app/

# 良い例：curlでダウンロード（キャッシュ制御可能）
RUN curl -SL https://example.com/file.txt -o /app/file.txt

# より良い例：ダウンロードと展開を1ステップで
RUN curl -SL https://example.com/app.tar.gz | tar -xzC /app
```

## 実践的なDockerfileの例

### Node.jsアプリケーション

```dockerfile
# ベースイメージ
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルを先にコピー（キャッシュ最適化）
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY src/ ./src/
COPY public/ ./public/

# アプリケーション起動
CMD ["node", "src/index.js"]
```

### Pythonアプリケーション

```dockerfile
# ベースイメージ
FROM python:3.11-slim

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ
WORKDIR /app

# 依存関係を先にインストール（キャッシュ最適化）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

CMD ["python", "app.py"]
```

### Go言語（マルチステージビルド）

```dockerfile
# ビルドステージ
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 実行ステージ
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

## よくある間違いと対処法

### 1. COPYの順序ミス

```dockerfile
# 悪い例：毎回すべてのレイヤーが再ビルドされる
COPY . .
RUN npm install

# 良い例：依存関係のキャッシュが効く
COPY package*.json ./
RUN npm install
COPY . .
```

### 2. RUNの分割しすぎ

```dockerfile
# 悪い例：レイヤーが多すぎる
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get clean

# 良い例：1つのRUNにまとめる
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && apt-get clean
```

### 3. キャッシュが無効化されない

```dockerfile
# 悪い例：apt-get updateのキャッシュが古くなる可能性
RUN apt-get update
RUN apt-get install -y curl  # 別のレイヤー

# 良い例：updateとinstallを同じRUNで
RUN apt-get update && apt-get install -y curl
```

## まとめ

- **FROM**: すべてのDockerfileの出発点。適切なベースイメージを選択する
- **RUN**: ビルド時にコマンドを実行。コマンドを連結してレイヤーを減らす
- **COPY**: ファイルのコピーに使用。ほとんどの場合でADDより推奨
- **ADD**: アーカイブの展開が必要な場合のみ使用

次のセクションでは、WORKDIR、ENV、ARG命令について学びます。
