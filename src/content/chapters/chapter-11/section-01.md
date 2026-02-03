# Dockerコマンド一覧

## 概要

このセクションでは、Docker CLIで使用できる主要なコマンドを網羅的に解説します。日々の開発や運用で素早く参照できるリファレンスとして活用してください。

## コンテナ管理コマンド

### docker run - コンテナの作成と起動

コンテナを作成して起動する最も基本的なコマンドです。

```bash
# 基本構文
docker run [オプション] イメージ名 [コマンド] [引数]

# 基本的な実行
docker run nginx

# バックグラウンドで実行（デタッチモード）
docker run -d nginx

# 名前を付けて実行
docker run -d --name my-nginx nginx

# ポートマッピング
docker run -d -p 8080:80 nginx

# 環境変数を設定
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql

# ボリュームをマウント
docker run -d -v /host/path:/container/path nginx

# インタラクティブモードで実行（TTY付き）
docker run -it ubuntu bash

# コンテナ終了時に自動削除
docker run --rm -it ubuntu bash
```

| オプション | 説明 |
|-----------|------|
| `-d, --detach` | バックグラウンドで実行 |
| `-p, --publish` | ポートマッピング（ホスト:コンテナ） |
| `-P, --publish-all` | 公開ポートをランダムなホストポートにマップ |
| `-v, --volume` | ボリュームのマウント |
| `--mount` | ボリュームマウント（詳細指定） |
| `-e, --env` | 環境変数を設定 |
| `--env-file` | 環境変数ファイルを読み込む |
| `--name` | コンテナ名を指定 |
| `-it` | インタラクティブモード + TTY |
| `--rm` | 終了時にコンテナを自動削除 |
| `--network` | 接続するネットワークを指定 |
| `--restart` | 再起動ポリシーを設定 |
| `-w, --workdir` | 作業ディレクトリを設定 |
| `-u, --user` | 実行ユーザーを指定 |
| `--cpus` | CPU使用量を制限 |
| `-m, --memory` | メモリ使用量を制限 |

### docker start / stop / restart - コンテナの起動・停止・再起動

```bash
# コンテナを起動
docker start コンテナ名

# コンテナを停止
docker stop コンテナ名

# タイムアウトを指定して停止（秒）
docker stop -t 30 コンテナ名

# コンテナを再起動
docker restart コンテナ名

# 複数コンテナを一括操作
docker start container1 container2 container3
docker stop $(docker ps -q)  # 全ての実行中コンテナを停止
```

### docker ps - コンテナの一覧表示

```bash
# 実行中のコンテナを表示
docker ps

# すべてのコンテナを表示（停止中含む）
docker ps -a

# 最後に作成されたコンテナのみ表示
docker ps -l

# コンテナIDのみ表示
docker ps -q

# 特定のフィルタで表示
docker ps --filter "status=exited"
docker ps --filter "name=nginx"
docker ps --filter "ancestor=ubuntu"

# 出力フォーマットを指定
docker ps --format "{{.Names}}: {{.Status}}"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
```

### docker rm - コンテナの削除

```bash
# コンテナを削除（停止中のみ）
docker rm コンテナ名

# 実行中のコンテナを強制削除
docker rm -f コンテナ名

# ボリュームも一緒に削除
docker rm -v コンテナ名

# 停止中のすべてのコンテナを削除
docker container prune

# すべてのコンテナを強制削除
docker rm -f $(docker ps -aq)
```

### docker exec - 実行中のコンテナでコマンド実行

```bash
# コンテナ内でコマンドを実行
docker exec コンテナ名 コマンド

# インタラクティブシェルを起動
docker exec -it コンテナ名 bash
docker exec -it コンテナ名 sh

# 作業ディレクトリを指定
docker exec -w /var/www コンテナ名 ls

# 環境変数を設定してコマンド実行
docker exec -e MY_VAR=value コンテナ名 printenv

# 特定のユーザーで実行
docker exec -u root コンテナ名 whoami
```

### docker logs - ログの表示

```bash
# コンテナのログを表示
docker logs コンテナ名

# リアルタイムでログを追跡
docker logs -f コンテナ名

# 最新のN行のみ表示
docker logs --tail 100 コンテナ名

# タイムスタンプを表示
docker logs -t コンテナ名

# 特定の時間以降のログ
docker logs --since 2024-01-01T00:00:00 コンテナ名
docker logs --since 1h コンテナ名

# 組み合わせ
docker logs -f --tail 50 -t コンテナ名
```

### docker inspect - 詳細情報の表示

```bash
# コンテナの詳細情報をJSON形式で表示
docker inspect コンテナ名

# 特定の情報のみ抽出
docker inspect --format '{{.NetworkSettings.IPAddress}}' コンテナ名
docker inspect --format '{{.State.Status}}' コンテナ名
docker inspect --format '{{json .Config.Env}}' コンテナ名

# マウント情報を取得
docker inspect --format '{{json .Mounts}}' コンテナ名 | jq
```

### docker cp - ファイルのコピー

```bash
# ホストからコンテナへコピー
docker cp /host/file.txt コンテナ名:/container/path/

# コンテナからホストへコピー
docker cp コンテナ名:/container/file.txt /host/path/

# ディレクトリをコピー
docker cp /host/directory コンテナ名:/container/
```

### docker stats - リソース使用状況の表示

```bash
# 全コンテナのリソース使用状況をリアルタイム表示
docker stats

# 特定のコンテナのみ
docker stats コンテナ名

# 1回だけ表示して終了
docker stats --no-stream

# 出力フォーマットを指定
docker stats --format "{{.Container}}: {{.CPUPerc}}"
```

### docker top - プロセス一覧の表示

```bash
# コンテナ内のプロセス一覧
docker top コンテナ名

# psオプションを指定
docker top コンテナ名 aux
```

## イメージ管理コマンド

### docker images / docker image ls - イメージの一覧

```bash
# ローカルイメージの一覧
docker images
docker image ls

# 特定のリポジトリのイメージのみ
docker images nginx

# ダングリングイメージを含めて表示
docker images -a

# イメージIDのみ表示
docker images -q

# フィルタを適用
docker images --filter "dangling=true"

# フォーマットを指定
docker images --format "{{.Repository}}:{{.Tag}} - {{.Size}}"
```

### docker pull - イメージの取得

```bash
# 最新タグのイメージを取得
docker pull nginx

# 特定のタグを指定
docker pull nginx:1.25-alpine

# 特定のダイジェストを指定
docker pull nginx@sha256:abc123...

# すべてのタグを取得
docker pull -a nginx
```

### docker push - イメージのプッシュ

```bash
# イメージをレジストリにプッシュ
docker push ユーザー名/イメージ名:タグ

# 例
docker push myuser/myapp:1.0
```

### docker build - イメージのビルド

```bash
# 現在のディレクトリでビルド
docker build .

# タグを付けてビルド
docker build -t myapp:1.0 .

# Dockerfileを指定
docker build -f Dockerfile.prod -t myapp:prod .

# ビルド引数を渡す
docker build --build-arg VERSION=1.0 -t myapp .

# キャッシュを使用しない
docker build --no-cache -t myapp .

# マルチプラットフォームビルド（BuildKit）
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .

# ターゲットステージを指定
docker build --target builder -t myapp:builder .
```

### docker tag - イメージのタグ付け

```bash
# イメージにタグを付ける
docker tag イメージID ユーザー名/イメージ名:タグ
docker tag myapp:latest myuser/myapp:1.0
docker tag myapp:latest registry.example.com/myapp:1.0
```

### docker rmi - イメージの削除

```bash
# イメージを削除
docker rmi nginx

# 複数イメージを削除
docker rmi nginx mysql redis

# 強制削除
docker rmi -f nginx

# ダングリングイメージを削除
docker image prune

# 未使用イメージをすべて削除
docker image prune -a
```

### docker save / load - イメージのエクスポート・インポート

```bash
# イメージをtarファイルに保存
docker save -o myapp.tar myapp:1.0
docker save myapp:1.0 | gzip > myapp.tar.gz

# tarファイルからイメージをロード
docker load -i myapp.tar
gunzip -c myapp.tar.gz | docker load
```

### docker history - イメージの履歴

```bash
# イメージのレイヤー履歴を表示
docker history nginx

# 省略せずに表示
docker history --no-trunc nginx
```

## ネットワーク管理コマンド

### docker network ls - ネットワークの一覧

```bash
# ネットワーク一覧を表示
docker network ls

# フィルタを適用
docker network ls --filter "driver=bridge"
```

### docker network create - ネットワークの作成

```bash
# ブリッジネットワークを作成
docker network create my-network

# ドライバーを指定
docker network create --driver bridge my-bridge
docker network create --driver overlay my-overlay

# サブネットを指定
docker network create --subnet=172.20.0.0/16 my-network

# 詳細オプション
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --gateway=172.20.0.1 \
  --ip-range=172.20.0.0/24 \
  my-custom-network
```

### docker network connect / disconnect - ネットワークへの接続・切断

```bash
# コンテナをネットワークに接続
docker network connect my-network コンテナ名

# IPアドレスを指定して接続
docker network connect --ip 172.20.0.100 my-network コンテナ名

# ネットワークから切断
docker network disconnect my-network コンテナ名
```

### docker network inspect - ネットワークの詳細情報

```bash
# ネットワークの詳細を表示
docker network inspect my-network

# 特定の情報を抽出
docker network inspect --format '{{json .Containers}}' my-network
```

### docker network rm / prune - ネットワークの削除

```bash
# ネットワークを削除
docker network rm my-network

# 未使用ネットワークをすべて削除
docker network prune
```

## ボリューム管理コマンド

### docker volume ls - ボリュームの一覧

```bash
# ボリューム一覧を表示
docker volume ls

# フィルタを適用
docker volume ls --filter "dangling=true"
```

### docker volume create - ボリュームの作成

```bash
# ボリュームを作成
docker volume create my-volume

# ドライバーを指定
docker volume create --driver local my-volume

# オプションを指定
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/dir \
  nfs-volume
```

### docker volume inspect - ボリュームの詳細情報

```bash
# ボリュームの詳細を表示
docker volume inspect my-volume
```

### docker volume rm / prune - ボリュームの削除

```bash
# ボリュームを削除
docker volume rm my-volume

# 未使用ボリュームをすべて削除
docker volume prune
```

## システム管理コマンド

### docker system df - ディスク使用量の表示

```bash
# Dockerのディスク使用量を表示
docker system df

# 詳細表示
docker system df -v
```

### docker system prune - 不要リソースの一括削除

```bash
# 未使用リソースを削除（イメージ、コンテナ、ネットワーク）
docker system prune

# ボリュームも含めて削除
docker system prune --volumes

# すべての未使用イメージを削除（タグ付きも含む）
docker system prune -a

# 確認なしで削除
docker system prune -f
```

### docker info - システム情報の表示

```bash
# Docker環境の情報を表示
docker info
```

### docker version - バージョン情報の表示

```bash
# バージョン情報を表示
docker version

# クライアントのバージョンのみ
docker version --format '{{.Client.Version}}'
```

## レジストリ関連コマンド

### docker login / logout - レジストリへのログイン・ログアウト

```bash
# Docker Hubにログイン
docker login

# 特定のレジストリにログイン
docker login registry.example.com

# ユーザー名とパスワードを指定
docker login -u username -p password

# ログアウト
docker logout
docker logout registry.example.com
```

### docker search - イメージの検索

```bash
# Docker Hubでイメージを検索
docker search nginx

# スター数でフィルタ
docker search --filter "stars=100" nginx

# 公式イメージのみ
docker search --filter "is-official=true" nginx
```

## まとめ

このリファレンスで紹介した主要なDockerコマンドは以下の通りです。

| カテゴリ | 主要コマンド |
|---------|-------------|
| コンテナ管理 | `run`, `start`, `stop`, `ps`, `rm`, `exec`, `logs` |
| イメージ管理 | `images`, `pull`, `push`, `build`, `tag`, `rmi` |
| ネットワーク | `network create`, `connect`, `disconnect`, `ls`, `rm` |
| ボリューム | `volume create`, `ls`, `inspect`, `rm` |
| システム | `system df`, `system prune`, `info`, `version` |

頻繁に使用するコマンドはエイリアスを設定しておくと便利です。

```bash
# ~/.bashrc または ~/.zshrc に追加
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dex='docker exec -it'
alias dlogs='docker logs -f'
```
