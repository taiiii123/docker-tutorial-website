# Dockerfile命令一覧

## 概要

このセクションでは、Dockerfileで使用できるすべての命令を網羅的に解説します。効率的でセキュアなDockerイメージを作成するためのリファレンスとして活用してください。

## 基本命令

### FROM - ベースイメージの指定

すべてのDockerfileの最初に記述する命令で、ベースとなるイメージを指定します。

```dockerfile
# 基本構文
FROM イメージ名[:タグ]

# 例
FROM ubuntu:22.04
FROM node:20-alpine
FROM python:3.12-slim

# プラットフォームを指定
FROM --platform=linux/amd64 node:20-alpine

# スクラッチ（空のベースイメージ）
FROM scratch

# マルチステージビルドでの名前付け
FROM node:20-alpine AS builder
FROM nginx:alpine AS production
```

| オプション | 説明 |
|-----------|------|
| `--platform` | ターゲットプラットフォームを指定 |
| `AS` | ステージに名前を付ける（マルチステージビルド用） |

### RUN - コマンドの実行

イメージビルド時にコマンドを実行します。

```dockerfile
# シェル形式
RUN apt-get update && apt-get install -y curl

# exec形式
RUN ["apt-get", "update"]

# 複数コマンドの結合（推奨：レイヤー数削減）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        git \
        vim && \
    rm -rf /var/lib/apt/lists/*

# 異なるシェルを使用
RUN ["/bin/bash", "-c", "echo Hello"]

# マウントオプション（BuildKit）
# キャッシュマウント
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y curl

# シークレットマウント
RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret

# バインドマウント
RUN --mount=type=bind,source=package.json,target=/app/package.json \
    npm install
```

| マウントタイプ | 説明 |
|---------------|------|
| `cache` | ビルド間で共有されるキャッシュディレクトリ |
| `secret` | 機密情報をビルド時のみ利用可能にする |
| `bind` | ビルドコンテキストからファイルをマウント |
| `ssh` | SSHエージェントソケットをマウント |

### COPY - ファイルのコピー

ホストからイメージにファイルをコピーします。

```dockerfile
# 基本構文
COPY ソース... 宛先

# 単一ファイルのコピー
COPY package.json /app/

# 複数ファイルのコピー
COPY package.json package-lock.json /app/

# ディレクトリのコピー
COPY src/ /app/src/

# ワイルドカードの使用
COPY *.json /app/

# 所有者を指定
COPY --chown=node:node . /app/

# 権限を指定（BuildKit）
COPY --chmod=755 scripts/*.sh /app/scripts/

# 別のステージからコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 外部イメージからコピー
COPY --from=nginx:alpine /etc/nginx/nginx.conf /etc/nginx/
```

| オプション | 説明 |
|-----------|------|
| `--chown` | ファイルの所有者を指定 |
| `--chmod` | ファイルの権限を指定（BuildKit） |
| `--from` | 別のステージまたはイメージからコピー |

### ADD - ファイルの追加

COPYの拡張版で、URLからのダウンロードやtar展開機能があります。

```dockerfile
# 基本構文
ADD ソース... 宛先

# ローカルファイルのコピー
ADD app.tar.gz /app/

# URLからダウンロード
ADD https://example.com/file.tar.gz /tmp/

# tarファイルの自動展開
ADD archive.tar.gz /app/

# 所有者を指定
ADD --chown=node:node . /app/
```

> **注意**: 単純なファイルコピーには `COPY` を使用することを推奨します。`ADD` は自動展開やURLダウンロードが必要な場合のみ使用してください。

### WORKDIR - 作業ディレクトリの設定

以降の命令の作業ディレクトリを設定します。

```dockerfile
# 作業ディレクトリを設定
WORKDIR /app

# ディレクトリは自動作成される
WORKDIR /app/src

# 相対パスも使用可能
WORKDIR src
WORKDIR ./config

# 環境変数を使用
ENV APP_HOME=/application
WORKDIR $APP_HOME

# 複数回設定可能
WORKDIR /app
RUN npm install
WORKDIR /app/client
RUN npm install
```

## 環境変数・引数

### ENV - 環境変数の設定

コンテナ実行時にも有効な環境変数を設定します。

```dockerfile
# 基本構文
ENV キー=値

# 単一の変数
ENV NODE_ENV=production

# 複数の変数
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# 旧形式（非推奨）
ENV NODE_ENV production

# 変数の参照
ENV APP_HOME=/app
WORKDIR $APP_HOME
```

### ARG - ビルド引数の定義

ビルド時のみ有効な引数を定義します。

```dockerfile
# 基本構文
ARG 変数名[=デフォルト値]

# デフォルト値なし
ARG VERSION

# デフォルト値あり
ARG VERSION=1.0
ARG NODE_VERSION=20

# 使用例
ARG BASE_IMAGE=node:20-alpine
FROM $BASE_IMAGE

# ビルドコマンド
# docker build --build-arg VERSION=2.0 .

# FROMの前でも使用可能（スコープ注意）
ARG BASE_VERSION=20
FROM node:${BASE_VERSION}-alpine

# FROMの後で再度定義が必要
ARG BASE_VERSION
RUN echo $BASE_VERSION
```

| 事前定義されたARG | 説明 |
|-----------------|------|
| `HTTP_PROXY` | HTTPプロキシ |
| `HTTPS_PROXY` | HTTPSプロキシ |
| `FTP_PROXY` | FTPプロキシ |
| `NO_PROXY` | プロキシ除外リスト |
| `TARGETPLATFORM` | ターゲットプラットフォーム |
| `TARGETOS` | ターゲットOS |
| `TARGETARCH` | ターゲットアーキテクチャ |
| `BUILDPLATFORM` | ビルドプラットフォーム |

## 実行設定

### CMD - デフォルトコマンドの指定

コンテナ起動時のデフォルトコマンドを指定します。

```dockerfile
# exec形式（推奨）
CMD ["npm", "start"]

# シェル形式
CMD npm start

# ENTRYPOINTの引数として
ENTRYPOINT ["python"]
CMD ["app.py"]

# 複数の引数
CMD ["node", "server.js", "--port", "3000"]
```

> **注意**: `docker run` でコマンドを指定すると、CMDは上書きされます。

### ENTRYPOINT - エントリポイントの設定

コンテナをコマンドとして実行する際のエントリポイントを設定します。

```dockerfile
# exec形式（推奨）
ENTRYPOINT ["docker-entrypoint.sh"]

# シェル形式
ENTRYPOINT docker-entrypoint.sh

# CMDとの組み合わせ
ENTRYPOINT ["python"]
CMD ["app.py"]
# → python app.py

# 実行例
# docker run myimage other.py
# → python other.py（CMDが上書きされる）
```

| 形式 | ENTRYPOINT なし | ENTRYPOINT ["exec"] | ENTRYPOINT exec |
|-----|----------------|---------------------|-----------------|
| CMD なし | エラー | exec | /bin/sh -c exec |
| CMD ["arg"] | arg | exec arg | /bin/sh -c exec |
| CMD arg | /bin/sh -c arg | exec /bin/sh -c arg | /bin/sh -c exec |

### EXPOSE - ポートの公開宣言

コンテナがリッスンするポートを宣言します。

```dockerfile
# 単一ポート
EXPOSE 80

# 複数ポート
EXPOSE 80 443

# プロトコルを指定
EXPOSE 80/tcp
EXPOSE 53/udp

# 範囲指定
EXPOSE 8000-8080
```

> **注意**: `EXPOSE` はドキュメント目的であり、実際のポート公開には `-p` フラグが必要です。

### USER - 実行ユーザーの設定

以降の命令を実行するユーザーを設定します。

```dockerfile
# ユーザー名で指定
USER node

# ユーザーIDで指定
USER 1000

# ユーザーとグループを指定
USER node:node
USER 1000:1000

# ユーザー作成の例
RUN useradd -r -s /bin/false appuser
USER appuser

# Alpine Linux の場合
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### SHELL - デフォルトシェルの変更

RUN、CMD、ENTRYPOINTのシェル形式で使用するシェルを変更します。

```dockerfile
# デフォルト
# Linux: ["/bin/sh", "-c"]
# Windows: ["cmd", "/S", "/C"]

# bashに変更
SHELL ["/bin/bash", "-c"]
RUN echo $SHELL

# PowerShellに変更（Windows）
SHELL ["powershell", "-Command"]
RUN Write-Host "Hello"
```

## メタデータ・ドキュメント

### LABEL - メタデータの追加

イメージにメタデータを追加します。

```dockerfile
# 基本構文
LABEL キー=値

# 単一のラベル
LABEL version="1.0"

# 複数のラベル
LABEL version="1.0" \
      description="My application" \
      maintainer="example@example.com"

# OCI標準ラベル
LABEL org.opencontainers.image.title="My App"
LABEL org.opencontainers.image.description="Application description"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="My Company"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/example/repo"
```

### MAINTAINER（非推奨）

メンテナー情報を設定します。LABELの使用を推奨。

```dockerfile
# 非推奨
MAINTAINER example@example.com

# 推奨
LABEL maintainer="example@example.com"
```

## ボリューム・マウント

### VOLUME - ボリュームマウントポイントの作成

永続データ用のマウントポイントを定義します。

```dockerfile
# 単一のボリューム
VOLUME /data

# 複数のボリューム
VOLUME /data /logs

# JSON配列形式
VOLUME ["/data", "/logs"]

# 例：データベースのデータディレクトリ
VOLUME /var/lib/mysql
VOLUME /var/lib/postgresql/data
```

> **注意**: VOLUMEで指定したパスは、以降のRUN命令での変更が保持されません。

## ヘルスチェック

### HEALTHCHECK - ヘルスチェックの設定

コンテナの正常性を確認するコマンドを設定します。

```dockerfile
# 基本構文
HEALTHCHECK [オプション] CMD コマンド

# HTTPエンドポイントをチェック
HEALTHCHECK CMD curl -f http://localhost/health || exit 1

# オプション付き
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# exec形式
HEALTHCHECK CMD ["curl", "-f", "http://localhost/health"]

# ヘルスチェックを無効化
HEALTHCHECK NONE
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--interval` | 30s | チェック間隔 |
| `--timeout` | 30s | タイムアウト |
| `--start-period` | 0s | 起動猶予期間 |
| `--retries` | 3 | 失敗判定までのリトライ回数 |

ヘルスチェックの終了コード

| コード | 状態 |
|-------|------|
| 0 | healthy |
| 1 | unhealthy |
| 2 | reserved |

## その他の命令

### STOPSIGNAL - 停止シグナルの設定

コンテナ停止時に送信するシグナルを設定します。

```dockerfile
# デフォルトはSIGTERM
STOPSIGNAL SIGTERM

# シグナル番号で指定
STOPSIGNAL 9

# SIGQUITを使用
STOPSIGNAL SIGQUIT
```

### ONBUILD - 派生イメージ用の命令

このイメージをベースとする派生イメージのビルド時に実行される命令を定義します。

```dockerfile
# 派生イメージで実行される命令
ONBUILD COPY package*.json /app/
ONBUILD RUN npm install
ONBUILD COPY . /app/

# 使用例：ベースイメージ
FROM node:20-alpine
WORKDIR /app
ONBUILD COPY . /app/
ONBUILD RUN npm install

# 派生イメージでは自動的に実行される
FROM mybase:latest
# COPY . /app/ と RUN npm install が自動実行
```

## .dockerignore ファイル

ビルドコンテキストから除外するファイルを指定します。

```dockerignore
# コメント
# Git関連
.git
.gitignore

# Node.js
node_modules
npm-debug.log

# ビルド成果物
dist
build
*.log

# 開発用ファイル
.env.local
.env.*.local
*.md
!README.md

# IDE
.idea
.vscode
*.swp

# テスト
coverage
__tests__
*.test.js
*.spec.js

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

パターン構文

| パターン | 説明 |
|---------|------|
| `*` | 任意の文字列（パス区切り除く） |
| `**` | 任意のディレクトリ |
| `?` | 任意の1文字 |
| `!` | 除外の例外（含める） |

## マルチステージビルドの例

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
RUN npm test

# 本番ステージ
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## まとめ

Dockerfile命令の分類

| カテゴリ | 命令 |
|---------|------|
| ベース設定 | `FROM`, `ARG` |
| ファイル操作 | `COPY`, `ADD`, `WORKDIR` |
| 実行 | `RUN`, `CMD`, `ENTRYPOINT`, `SHELL` |
| 環境設定 | `ENV`, `ARG`, `USER`, `EXPOSE` |
| メタデータ | `LABEL`, `MAINTAINER` |
| ヘルスチェック | `HEALTHCHECK` |
| ボリューム | `VOLUME` |
| その他 | `STOPSIGNAL`, `ONBUILD` |

推奨事項

- ベースイメージは公式イメージを使用
- RUN命令は可能な限り結合してレイヤー数を削減
- 機密情報はARGではなくシークレットマウントを使用
- 本番環境では非rootユーザーで実行
- マルチステージビルドでイメージサイズを最小化
