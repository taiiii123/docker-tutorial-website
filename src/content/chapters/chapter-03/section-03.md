# WORKDIR, ENV, ARG

## 概要

このセクションでは、作業ディレクトリの設定（WORKDIR）、環境変数の定義（ENV）、ビルド時の引数（ARG）について詳しく学びます。これらの命令を適切に使うことで、柔軟で保守性の高いDockerfileを作成できます。

## WORKDIR命令

**WORKDIR**命令は、Dockerfile内の後続の命令（RUN、CMD、ENTRYPOINT、COPY、ADD）の作業ディレクトリを設定します。

### 基本構文

```dockerfile
WORKDIR /path/to/directory
```

### 使用例

```dockerfile
# 作業ディレクトリを設定
WORKDIR /app

# 後続の命令は/appで実行される
COPY package.json .
RUN npm install
COPY . .
```

### WORKDIRの動作

```dockerfile
FROM ubuntu:22.04

# /appディレクトリに移動（存在しない場合は自動作成）
WORKDIR /app

# 現在のディレクトリは/app
RUN pwd
# 出力: /app

# 相対パスでの移動も可能
WORKDIR src
RUN pwd
# 出力: /app/src

# 絶対パスで別の場所に移動
WORKDIR /var/log
RUN pwd
# 出力: /var/log
```

### RUN cdとの違い

```dockerfile
# 悪い例：cdは次のRUNに影響しない
FROM ubuntu:22.04
RUN cd /app
RUN pwd
# 出力: /（ルートディレクトリ）

# 良い例：WORKDIRを使用
FROM ubuntu:22.04
WORKDIR /app
RUN pwd
# 出力: /app
```

### WORKDIRと環境変数

```dockerfile
# 環境変数を使った動的なパス設定
ENV APP_HOME=/app
WORKDIR ${APP_HOME}

# ARGとの組み合わせ
ARG APP_DIR=/application
WORKDIR ${APP_DIR}
```

## ENV命令

**ENV**命令は、環境変数を設定します。設定した環境変数はビルド時とコンテナ実行時の両方で使用できます。

### 基本構文

```dockerfile
# 形式1：単一の環境変数
ENV KEY=value

# 形式2：複数の環境変数
ENV KEY1=value1 KEY2=value2

# 形式3：複数行
ENV KEY1=value1 \
    KEY2=value2 \
    KEY3=value3
```

### 使用例

```dockerfile
# アプリケーション設定
ENV NODE_ENV=production
ENV PORT=3000

# パス設定
ENV PATH=/app/bin:$PATH

# 複数の環境変数
ENV APP_HOME=/app \
    LOG_LEVEL=info \
    MAX_CONNECTIONS=100
```

### ENV変数の参照

```dockerfile
ENV APP_HOME=/app
ENV CONFIG_DIR=${APP_HOME}/config

# RUN内での参照
RUN echo "App home: ${APP_HOME}"

# WORKDIR内での参照
WORKDIR ${APP_HOME}

# COPY/ADDのパスでも使用可能
COPY config/ ${CONFIG_DIR}/
```

### ENVのスコープ

```dockerfile
FROM node:20-alpine

# この時点から環境変数が有効
ENV NODE_ENV=production

# RUN内で参照可能
RUN echo $NODE_ENV
# 出力: production

# コンテナ実行時も有効
CMD ["sh", "-c", "echo $NODE_ENV"]
# 出力: production
```

### コンテナ実行時の上書き

```bash
# docker runで環境変数を上書き
docker run -e NODE_ENV=development myapp

# docker-compose.ymlで上書き
services:
  app:
    environment:
      - NODE_ENV=development
```

## ARG命令

**ARG**命令は、ビルド時のみ使用できる変数を定義します。`docker build`コマンドの`--build-arg`で値を渡せます。

### 基本構文

```dockerfile
# デフォルト値なし
ARG VARIABLE_NAME

# デフォルト値あり
ARG VARIABLE_NAME=default_value
```

### 使用例

```dockerfile
# バージョン指定
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# ビルド時の設定
ARG BUILD_ENV=production
ARG API_URL=https://api.example.com

# 値の使用
RUN echo "Building for ${BUILD_ENV}"
```

### ビルド時の値の指定

```bash
# ARGの値を指定してビルド
docker build --build-arg NODE_VERSION=18 -t myapp .

# 複数のARGを指定
docker build \
  --build-arg NODE_VERSION=18 \
  --build-arg BUILD_ENV=development \
  -t myapp .
```

### ARGとENVの違い

| 特徴 | ARG | ENV |
|------|-----|-----|
| ビルド時に使用可能 | ○ | ○ |
| 実行時に使用可能 | × | ○ |
| docker buildで上書き | ○（--build-arg） | × |
| docker runで上書き | × | ○（-e） |
| イメージに永続化 | × | ○ |

### ARGの有効範囲

```dockerfile
# FROM前のARGはFROMでのみ使用可能
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# FROM後に再定義が必要
ARG NODE_VERSION
RUN echo "Node version: ${NODE_VERSION}"
# 出力: Node version: （空）

# FROM後に再定義
ARG NODE_VERSION=20
RUN echo "Node version: ${NODE_VERSION}"
# 出力: Node version: 20
```

### ARGからENVへの変換

```dockerfile
# ARGで受け取った値をENVに設定
ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}

# これでコンテナ実行時にもAPP_VERSIONが使用可能
CMD ["sh", "-c", "echo Version: $APP_VERSION"]
```

## 実践的な使い方

### 設定可能なDockerfile

```dockerfile
# ビルド時引数
ARG NODE_VERSION=20
ARG BUILD_ENV=production

# ベースイメージ
FROM node:${NODE_VERSION}-alpine

# 環境変数
ENV NODE_ENV=${BUILD_ENV} \
    APP_HOME=/app \
    PORT=3000

# 作業ディレクトリ
WORKDIR ${APP_HOME}

# 依存関係のインストール
COPY package*.json ./
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm ci; \
    fi

# ソースコードのコピー
COPY . .

# ポート公開
EXPOSE ${PORT}

# 起動コマンド
CMD ["node", "server.js"]
```

### マルチ環境対応

```dockerfile
ARG TARGET_ENV=production

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# 開発環境用
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# 本番環境用
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

ビルド:
```bash
# 開発環境用イメージ
docker build --target development -t myapp:dev .

# 本番環境用イメージ
docker build --target production -t myapp:prod .
```

### データベース接続設定

```dockerfile
FROM python:3.11-slim

# デフォルト値を持つ環境変数
ENV DATABASE_HOST=localhost \
    DATABASE_PORT=5432 \
    DATABASE_NAME=myapp \
    DATABASE_USER=user

# 機密情報は実行時に渡す（Dockerfileに書かない）
# DATABASE_PASSWORD は docker run -e で設定

WORKDIR /app
COPY . .

CMD ["python", "app.py"]
```

実行:
```bash
docker run -e DATABASE_PASSWORD=secret myapp
```

### ビルドキャッシュを意識した構成

```dockerfile
ARG BASE_IMAGE=node:20-alpine

FROM ${BASE_IMAGE}

# 変更頻度の低い環境変数
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn

WORKDIR /app

# 依存関係（変更頻度：中）
COPY package*.json ./
RUN npm ci --only=production

# 変更頻度の高い環境変数（アプリ設定）
ARG APP_VERSION=1.0.0
ARG BUILD_DATE
ENV APP_VERSION=${APP_VERSION} \
    BUILD_DATE=${BUILD_DATE}

# ソースコード（変更頻度：高）
COPY . .

CMD ["node", "server.js"]
```

## よくあるパターン

### パスの追加

```dockerfile
# PATHに追加
ENV PATH=/app/bin:$PATH

# 複数のパスを追加
ENV PATH=/app/bin:/app/scripts:$PATH
```

### ロケール設定

```dockerfile
ENV LANG=ja_JP.UTF-8 \
    LANGUAGE=ja_JP:ja \
    LC_ALL=ja_JP.UTF-8
```

### タイムゾーン設定

```dockerfile
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

### npmの設定

```dockerfile
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PATH=/home/node/.npm-global/bin:$PATH
```

## セキュリティ上の注意

### 機密情報の取り扱い

```dockerfile
# 悪い例：パスワードをENVに直接書く
ENV DATABASE_PASSWORD=mysecretpassword

# 悪い例：ARGで機密情報を渡す（履歴に残る）
ARG SECRET_KEY

# 良い例：実行時に環境変数で渡す
# docker run -e DATABASE_PASSWORD=secret myapp

# 良い例：シークレットマウントを使用（BuildKit）
RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret
```

### ARGの履歴への注意

```dockerfile
# ARGで渡した値はdocker historyで確認できる可能性がある
ARG API_KEY
RUN curl -H "Authorization: $API_KEY" https://api.example.com

# 機密情報には--mount=type=secretを使用
# syntax=docker/dockerfile:1.4
RUN --mount=type=secret,id=api_key \
    curl -H "Authorization: $(cat /run/secrets/api_key)" https://api.example.com
```

## まとめ

- **WORKDIR**: 作業ディレクトリを設定。自動的にディレクトリを作成
- **ENV**: 環境変数を設定。ビルド時と実行時の両方で使用可能
- **ARG**: ビルド時のみ使用できる変数。`--build-arg`で値を渡せる
- ENVとARGを組み合わせて、柔軟で設定可能なDockerfileを作成できる
- 機密情報はDockerfileに直接書かず、実行時に渡す

次のセクションでは、EXPOSE、CMD、ENTRYPOINT命令について学びます。
