# 初めてのDockerコマンド

## 概要

このセクションでは、Dockerの基本的なコマンドを実際に実行しながら学びます。

## Hello World を実行しよう

まずは最も基本的なコマンドから始めましょう。

```bash
docker run hello-world
```

このコマンドを実行すると、以下の処理が行われます：

```
1. ローカルに hello-world イメージがあるか確認
          │
          ▼ (ない場合)
2. Docker Hub から hello-world イメージをダウンロード
          │
          ▼
3. イメージからコンテナを作成
          │
          ▼
4. コンテナ内のプログラムを実行
          │
          ▼
5. 実行完了後、コンテナは停止
```

**出力例:**

```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete
Digest: sha256:d211f485f2dd1dee407a80973c8f129f00d54604d2c90732e8e320e5038a0348
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

## よく使うDockerコマンド

### コンテナの実行（docker run）

```bash
# 基本形
docker run [オプション] イメージ名 [コマンド]

# nginx を起動（フォアグラウンド）
docker run nginx

# nginx をバックグラウンドで起動（-d: detached mode）
docker run -d nginx

# 名前を付けて起動
docker run -d --name my-nginx nginx

# ポートを公開（-p: ホスト:コンテナ）
docker run -d -p 8080:80 nginx

# 環境変数を設定（-e）
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql
```

### 実行中のコンテナを確認（docker ps）

```bash
# 実行中のコンテナ一覧
docker ps

# 出力例:
CONTAINER ID   IMAGE   COMMAND                  CREATED         STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx   "/docker-entrypoint.…"   5 minutes ago   Up 5 minutes   0.0.0.0:8080->80/tcp   my-nginx

# すべてのコンテナ（停止中も含む）
docker ps -a

# 簡潔な表示
docker ps -q  # IDのみ
```

### コンテナの停止と削除

```bash
# コンテナを停止
docker stop my-nginx

# コンテナを削除
docker rm my-nginx

# 停止と削除を同時に（強制）
docker rm -f my-nginx

# 停止中のコンテナをすべて削除
docker container prune
```

### イメージの管理

```bash
# イメージ一覧
docker images

# 出力例:
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    a6bd71f48f68   2 days ago     187MB
hello-world  latest    9c7a54a9a43c   3 months ago   13.3kB

# イメージのダウンロード
docker pull nginx:1.25

# イメージの削除
docker rmi nginx:1.25

# 未使用イメージをすべて削除
docker image prune -a
```

## 実践：Web サーバーを起動しよう

### Step 1: nginx コンテナを起動

```bash
docker run -d --name webserver -p 8080:80 nginx
```

**オプションの意味:**
- `-d`: バックグラウンドで実行
- `--name webserver`: コンテナに名前を付ける
- `-p 8080:80`: ホストの8080番ポートをコンテナの80番ポートに転送

### Step 2: ブラウザで確認

ブラウザで `http://localhost:8080` にアクセスすると、nginx のウェルカムページが表示されます。

### Step 3: コンテナの状態を確認

```bash
# 実行中か確認
docker ps

# ログを確認
docker logs webserver

# リアルタイムでログを追跡
docker logs -f webserver
```

### Step 4: コンテナ内に入る

```bash
# コンテナ内でシェルを起動
docker exec -it webserver /bin/bash

# コンテナ内で確認
root@a1b2c3d4e5f6:/# ls /usr/share/nginx/html/
50x.html  index.html

# コンテナから出る
exit
```

### Step 5: コンテナの停止と削除

```bash
# 停止
docker stop webserver

# 削除
docker rm webserver
```

## コマンドのショートカット

よく使うコマンドの省略形：

```bash
# docker container run → docker run
docker run nginx

# docker container ls → docker ps
docker ps

# docker image ls → docker images
docker images

# docker container rm → docker rm
docker rm container_name

# docker image rm → docker rmi
docker rmi image_name
```

## 複数コンテナの操作

```bash
# 複数のコンテナを一度に停止
docker stop container1 container2 container3

# すべての実行中コンテナを停止
docker stop $(docker ps -q)

# すべてのコンテナを削除
docker rm $(docker ps -aq)

# すべてのイメージを削除
docker rmi $(docker images -q)
```

## コマンドのヘルプ

```bash
# 全体のヘルプ
docker --help

# 特定コマンドのヘルプ
docker run --help
docker ps --help

# 出力例（docker run --help の一部）:
Usage:  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
Run a command in a new container

Options:
  -d, --detach         Run container in background
  -e, --env list       Set environment variables
  -p, --publish list   Publish container's port(s) to host
  --name string        Assign a name to the container
  ...
```

## まとめ

| コマンド | 説明 |
|---------|------|
| `docker run` | コンテナを作成・実行 |
| `docker ps` | 実行中のコンテナ一覧 |
| `docker stop` | コンテナを停止 |
| `docker rm` | コンテナを削除 |
| `docker images` | イメージ一覧 |
| `docker pull` | イメージをダウンロード |
| `docker rmi` | イメージを削除 |
| `docker logs` | コンテナのログを表示 |
| `docker exec` | 実行中コンテナでコマンド実行 |

次のセクションでは、Docker Desktopの使い方を学びます。
