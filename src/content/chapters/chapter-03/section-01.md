# Dockerfileの基本構文

## 概要

このセクションでは、Dockerfileの基本的な構文と書き方について学びます。Dockerfileはコンテナイメージを作成するための設計図であり、その構造を理解することはDocker活用の基礎となります。

## Dockerfileとは

**Dockerfile**は、Dockerイメージを作成するためのテキストファイルです。一連の命令（インストラクション）を記述することで、再現可能な方法でイメージをビルドできます。

### 特徴

| 特徴 | 説明 |
|------|------|
| テキストベース | 人間が読み書きしやすい形式 |
| バージョン管理可能 | Gitなどで履歴管理できる |
| 再現性 | 同じDockerfileから同じイメージを作成 |
| 自動化 | CI/CDパイプラインに組み込みやすい |

## Dockerfileの基本構造

```dockerfile
# ベースイメージを指定
FROM ubuntu:22.04

# メタデータを追加
LABEL maintainer="yourname@example.com"
LABEL version="1.0"

# 環境変数を設定
ENV APP_HOME=/app

# 作業ディレクトリを設定
WORKDIR /app

# ファイルをコピー
COPY . .

# コマンドを実行
RUN apt-get update && apt-get install -y curl

# ポートを公開
EXPOSE 8080

# コンテナ起動時に実行するコマンド
CMD ["./start.sh"]
```

## 命令（インストラクション）の書き方

### 基本形式

```dockerfile
# コメント
INSTRUCTION arguments
```

- **命令（INSTRUCTION）**: 大文字で記述（FROM, RUN, COPY など）
- **引数（arguments）**: 命令に渡すパラメータ

### コメントの書き方

```dockerfile
# これはコメントです
# 複数行のコメントも可能です
FROM node:20-alpine  # 行末コメントも可能

# ビルド引数を使用したコメント内の変数展開は行われません
```

## シェル形式とExec形式

多くの命令では、引数を2つの形式で記述できます。

### シェル形式

```dockerfile
# シェル形式（/bin/sh -c で実行される）
RUN apt-get update && apt-get install -y curl
CMD npm start
ENTRYPOINT ./start.sh
```

### Exec形式

```dockerfile
# Exec形式（JSONの配列形式）
RUN ["apt-get", "update"]
CMD ["npm", "start"]
ENTRYPOINT ["./start.sh"]
```

### 形式の違い

| 形式 | シェル | 環境変数展開 | シグナル処理 |
|------|--------|--------------|--------------|
| シェル形式 | `/bin/sh -c` で実行 | される | 間接的 |
| Exec形式 | 直接実行 | されない | 直接受信 |

```dockerfile
# シェル形式：環境変数が展開される
RUN echo $HOME

# Exec形式：環境変数は展開されない（$HOMEがそのまま出力）
RUN ["echo", "$HOME"]

# Exec形式で環境変数を展開するには
RUN ["/bin/sh", "-c", "echo $HOME"]
```

## 主要な命令一覧

| 命令 | 説明 |
|------|------|
| `FROM` | ベースイメージを指定 |
| `RUN` | ビルド時にコマンドを実行 |
| `COPY` | ファイルをコピー |
| `ADD` | ファイルをコピー（展開機能付き） |
| `WORKDIR` | 作業ディレクトリを設定 |
| `ENV` | 環境変数を設定 |
| `ARG` | ビルド時の引数を定義 |
| `EXPOSE` | 公開するポートを宣言 |
| `CMD` | コンテナ起動時のデフォルトコマンド |
| `ENTRYPOINT` | コンテナ起動時の実行プログラム |
| `LABEL` | メタデータを追加 |
| `USER` | 実行ユーザーを指定 |
| `VOLUME` | ボリュームを作成 |

## Dockerfileの命名規則

### 標準的なファイル名

```bash
# デフォルトのファイル名
Dockerfile

# カスタムファイル名（-fオプションで指定）
Dockerfile.dev
Dockerfile.prod
Dockerfile.test
```

### ビルド時のファイル指定

```bash
# デフォルトのDockerfileを使用
docker build -t myapp .

# カスタムファイル名を指定
docker build -t myapp -f Dockerfile.prod .
```

## ベストプラクティス

### 1. 1つのDockerfileで1つの役割

```dockerfile
# 良い例：単一の責務
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

### 2. 命令の順序を最適化

変更頻度の低いものを先に、高いものを後に配置します。

```dockerfile
# 良い例：キャッシュを効率的に使用
FROM node:20-alpine

# 1. 変更頻度が低い
WORKDIR /app

# 2. 依存関係（変更頻度：中）
COPY package*.json ./
RUN npm install

# 3. ソースコード（変更頻度：高）
COPY . .

CMD ["npm", "start"]
```

### 3. LABELでメタデータを追加

```dockerfile
FROM node:20-alpine

LABEL maintainer="team@example.com"
LABEL version="1.0.0"
LABEL description="サンプルアプリケーション"
LABEL org.opencontainers.image.source="https://github.com/example/app"
```

## シンプルなDockerfileの例

### Node.jsアプリケーション

```dockerfile
# Node.js 20のAlpineイメージをベースに使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# アプリケーションが使用するポートを公開
EXPOSE 3000

# アプリケーションを起動
CMD ["node", "server.js"]
```

### Pythonアプリケーション

```dockerfile
# Python 3.11のSlimイメージをベースに使用
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt .

# 依存関係をインストール
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

# アプリケーションを起動
CMD ["python", "app.py"]
```

## よくある間違い

### 1. 大文字小文字の混在

```dockerfile
# 悪い例：命令は大文字で統一すべき
from node:20-alpine
Run npm install
copy . .

# 良い例：大文字で統一
FROM node:20-alpine
RUN npm install
COPY . .
```

### 2. 不要なファイルのコピー

```dockerfile
# 悪い例：すべてをコピー（node_modules等も含まれる）
COPY . .

# 良い例：.dockerignoreで不要ファイルを除外
# .dockerignoreファイルに以下を記述
# node_modules
# .git
# *.log
```

## まとめ

- Dockerfileはイメージを作成するための設計図
- 命令は大文字で記述し、引数は命令に続けて記述
- シェル形式とExec形式の違いを理解する
- 命令の順序を最適化してキャッシュを活用
- LABELでメタデータを追加し、管理しやすくする

次のセクションでは、FROM、RUN、COPY、ADD命令について詳しく学びます。
