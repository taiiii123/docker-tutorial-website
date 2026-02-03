# EXPOSE, CMD, ENTRYPOINT

## 概要

このセクションでは、ネットワークポートの公開（EXPOSE）、コンテナ起動時のコマンド設定（CMD、ENTRYPOINT）について学びます。これらの命令はコンテナの実行時の動作を定義する重要な要素です。

## EXPOSE命令

**EXPOSE**命令は、コンテナが実行時にリッスンするネットワークポートを宣言します。

### 基本構文

```dockerfile
EXPOSE ポート番号
EXPOSE ポート番号/プロトコル
```

### 使用例

```dockerfile
# 単一のポート（TCP）
EXPOSE 80

# プロトコル指定
EXPOSE 80/tcp
EXPOSE 53/udp

# 複数のポート
EXPOSE 80 443

# 複数行で指定
EXPOSE 3000
EXPOSE 5432
```

### EXPOSEの役割

| 役割 | 説明 |
|------|------|
| ドキュメント | このコンテナが使用するポートを明示 |
| 自動マッピング | `-P`オプションで自動ポートマッピング |
| 通信の意図 | コンテナ間通信で使用するポートを示す |

**重要**: EXPOSEだけではホストからアクセスできません。

### 実際のポート公開との関係

```bash
# EXPOSEしただけ（ホストからアクセス不可）
docker run myapp

# -pで明示的にマッピング（ホストからアクセス可能）
docker run -p 8080:80 myapp

# -Pで自動マッピング（EXPOSEされたポートをランダムなホストポートに割り当て）
docker run -P myapp
docker port コンテナ名  # 割り当てられたポートを確認
```

### 環境変数との組み合わせ

```dockerfile
# 環境変数でポートを設定
ENV PORT=3000
EXPOSE ${PORT}

# 実行時に変更可能
# docker run -e PORT=8080 -p 8080:8080 myapp
```

## CMD命令

**CMD**命令は、コンテナ起動時に実行されるデフォルトのコマンドを指定します。

### 基本構文

```dockerfile
# Exec形式（推奨）
CMD ["実行ファイル", "引数1", "引数2"]

# シェル形式
CMD コマンド 引数1 引数2

# パラメータ形式（ENTRYPOINTと組み合わせ）
CMD ["引数1", "引数2"]
```

### 使用例

```dockerfile
# Exec形式
CMD ["node", "server.js"]
CMD ["python", "-m", "flask", "run"]
CMD ["nginx", "-g", "daemon off;"]

# シェル形式
CMD npm start
CMD python app.py
```

### CMDの特徴

| 特徴 | 説明 |
|------|------|
| 上書き可能 | `docker run`でコマンドを指定すると上書きされる |
| デフォルト | 引数なしで実行したときの動作を定義 |
| 単一 | Dockerfile内で複数指定しても最後の1つのみ有効 |

### docker run での上書き

```dockerfile
# Dockerfile
CMD ["echo", "Hello"]
```

```bash
# デフォルト
docker run myapp
# 出力: Hello

# コマンドを上書き
docker run myapp echo "World"
# 出力: World

# 別のコマンドを実行
docker run myapp sh
# シェルが起動
```

### Exec形式とシェル形式の違い

```dockerfile
# Exec形式（推奨）
CMD ["echo", "Hello World"]
# → PID 1で直接実行される
# → シグナルを直接受け取る
# → 変数展開されない

# シェル形式
CMD echo "Hello World"
# → /bin/sh -c "echo Hello World" として実行
# → シェルがPID 1になる
# → シグナルがシェル経由で渡される
```

## ENTRYPOINT命令

**ENTRYPOINT**命令は、コンテナを実行可能ファイルとして構成します。

### 基本構文

```dockerfile
# Exec形式（推奨）
ENTRYPOINT ["実行ファイル", "引数1"]

# シェル形式
ENTRYPOINT コマンド 引数1
```

### 使用例

```dockerfile
# 基本的な使用
ENTRYPOINT ["nginx", "-g", "daemon off;"]

# スクリプトを実行
ENTRYPOINT ["/entrypoint.sh"]

# Pythonアプリケーション
ENTRYPOINT ["python", "app.py"]
```

### ENTRYPOINTの特徴

| 特徴 | 説明 |
|------|------|
| 上書き困難 | `docker run`のコマンドは引数として追加される |
| 固定動作 | コンテナの主要な動作を定義 |
| --entrypoint | 上書きするには明示的なオプションが必要 |

### docker run での動作

```dockerfile
# Dockerfile
ENTRYPOINT ["echo"]
```

```bash
# 引数として追加される
docker run myapp "Hello World"
# 出力: Hello World

# 上書きするには --entrypoint が必要
docker run --entrypoint /bin/sh myapp
```

## CMDとENTRYPOINTの組み合わせ

CMDとENTRYPOINTを組み合わせることで、柔軟なコンテナ設計が可能です。

### パターン1: ENTRYPOINTのみ

```dockerfile
ENTRYPOINT ["nginx", "-g", "daemon off;"]
```

```bash
# 固定のコマンドが実行される
docker run myapp
# → nginx -g daemon off;
```

### パターン2: CMDのみ

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# デフォルトコマンド
docker run myapp
# → nginx -g daemon off;

# 上書き可能
docker run myapp /bin/sh
# → /bin/sh
```

### パターン3: ENTRYPOINT + CMD（推奨）

```dockerfile
# ENTRYPOINTでベースコマンド、CMDでデフォルト引数
ENTRYPOINT ["python"]
CMD ["app.py"]
```

```bash
# デフォルト
docker run myapp
# → python app.py

# 引数を変更
docker run myapp test.py
# → python test.py

# オプションを追加
docker run myapp app.py --debug
# → python app.py --debug
```

### 組み合わせの例

```dockerfile
# 実行可能なcurlコンテナ
FROM alpine:3.18
RUN apk add --no-cache curl
ENTRYPOINT ["curl"]
CMD ["--help"]
```

```bash
# デフォルト（ヘルプを表示）
docker run mycurl
# → curl --help

# URLを指定
docker run mycurl https://example.com
# → curl https://example.com

# オプション付き
docker run mycurl -I https://example.com
# → curl -I https://example.com
```

## エントリーポイントスクリプト

複雑な初期化処理が必要な場合は、エントリーポイントスクリプトを使用します。

### スクリプトの例

```bash
#!/bin/sh
# entrypoint.sh

# 環境変数の検証
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set"
    exit 1
fi

# データベースの準備完了を待機
echo "Waiting for database..."
while ! nc -z db 5432; do
    sleep 1
done
echo "Database is ready!"

# マイグレーション実行
python manage.py migrate

# アプリケーション起動（CMDで指定されたコマンドを実行）
exec "$@"
```

### Dockerfileでの使用

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# スクリプトをコピーして実行権限を付与
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

### exec "$@" の重要性

```bash
# execを使わない場合
# → スクリプトがPID 1のまま、アプリはサブプロセス
# → シグナルが正しく伝播しない

# execを使う場合
exec "$@"
# → アプリケーションがPID 1になる
# → シグナルを直接受け取れる
```

## 実践的なパターン

### Webサーバー

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

### コマンドラインツール

```dockerfile
FROM python:3.11-alpine

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY cli.py /usr/local/bin/mytool
RUN chmod +x /usr/local/bin/mytool

ENTRYPOINT ["mytool"]
CMD ["--help"]
```

### 開発/本番切り替え

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000

# 本番環境のデフォルト
CMD ["npm", "start"]

# 開発時は上書き: docker run myapp npm run dev
```

### デーモンプロセス

```dockerfile
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY html/ /usr/share/nginx/html/

EXPOSE 80 443

# フォアグラウンドで実行（重要）
CMD ["nginx", "-g", "daemon off;"]
```

## シグナル処理

### PID 1問題

```dockerfile
# 問題のある設定（シェル形式）
CMD npm start
# → /bin/sh -c "npm start"
# → shがPID 1、npmはサブプロセス
# → SIGTERMがnpmに届かない

# 正しい設定（Exec形式）
CMD ["npm", "start"]
# → npmがPID 1
# → SIGTERMを直接受け取れる
```

### tiniの使用

```dockerfile
FROM node:20-alpine

# tiniをインストール
RUN apk add --no-cache tini

WORKDIR /app
COPY . .

# tiniをENTRYPOINTに
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### ゾンビプロセス対策

```dockerfile
# Docker 1.13以降は--initオプションが使用可能
# docker run --init myapp
```

## よくある間違い

### 1. 複数のCMD

```dockerfile
# 悪い例：最初のCMDは無視される
CMD ["echo", "first"]
CMD ["echo", "second"]
# → second のみ出力
```

### 2. フォアグラウンド実行忘れ

```dockerfile
# 悪い例：バックグラウンドで起動してコンテナが終了
CMD ["nginx"]

# 良い例：フォアグラウンドで実行
CMD ["nginx", "-g", "daemon off;"]
```

### 3. シグナル処理の考慮漏れ

```dockerfile
# 悪い例：シェル形式でシグナルが伝播しない
CMD npm start

# 良い例：Exec形式
CMD ["npm", "start"]
```

## まとめ

- **EXPOSE**: コンテナが使用するポートを宣言（ドキュメント的役割）
- **CMD**: デフォルトコマンドを指定。`docker run`で上書き可能
- **ENTRYPOINT**: コンテナの実行コマンドを固定。引数のみ変更可能
- ENTRYPOINT + CMD の組み合わせで柔軟な設計が可能
- Exec形式を使用してシグナルを正しく処理する
- 複雑な初期化にはエントリーポイントスクリプトを使用

次のセクションでは、.dockerignoreの活用方法を学びます。
