# コンテナの起動・停止・削除

## 概要

このセクションでは、コンテナの基本的なライフサイクル操作を学びます。

## コンテナの起動（docker run）

### 基本構文

```bash
docker run [オプション] イメージ名 [コマンド] [引数...]
```

### よく使うオプション

| オプション | 説明 |
|-----------|------|
| `-d` | バックグラウンドで実行（デタッチモード） |
| `-it` | インタラクティブ + TTY |
| `--name` | コンテナ名を指定 |
| `-p` | ポートマッピング |
| `-v` | ボリュームマウント |
| `-e` | 環境変数を設定 |
| `--rm` | 終了時に自動削除 |
| `--restart` | 再起動ポリシー |

### 実行例

```bash
# 基本的な実行
docker run nginx

# バックグラウンドで実行
docker run -d nginx

# 名前を付けて実行
docker run -d --name webserver nginx

# ポートを公開
docker run -d -p 8080:80 nginx

# 環境変数を設定
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql

# 複数のオプションを組み合わせ
docker run -d \
  --name myapp \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  node:20-alpine npm start
```

### インタラクティブ実行

```bash
# シェルに入る
docker run -it ubuntu /bin/bash

# Alpine Linux の場合
docker run -it alpine /bin/sh

# 終了後にコンテナを自動削除
docker run -it --rm ubuntu /bin/bash
```

## 実行中のコンテナ一覧（docker ps）

```bash
# 実行中のコンテナ
docker ps

# 出力例:
CONTAINER ID   IMAGE   COMMAND                  CREATED         STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx   "/docker-entrypoint.…"   5 minutes ago   Up 5 minutes   0.0.0.0:8080->80/tcp   webserver

# すべてのコンテナ（停止中も含む）
docker ps -a

# IDのみ表示
docker ps -q

# 最後に作成されたコンテナ
docker ps -l

# フォーマット指定
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## コンテナの停止（docker stop）

```bash
# 名前で停止
docker stop webserver

# IDで停止
docker stop a1b2c3d4e5f6

# 複数のコンテナを停止
docker stop web1 web2 web3

# すべての実行中コンテナを停止
docker stop $(docker ps -q)

# タイムアウトを指定（デフォルト10秒）
docker stop -t 30 webserver
```

### stop と kill の違い

```bash
# stop: SIGTERM を送信し、タイムアウト後に SIGKILL
docker stop webserver

# kill: 即座に SIGKILL を送信
docker kill webserver

# kill でシグナルを指定
docker kill --signal=SIGHUP webserver
```

## コンテナの開始（docker start）

```bash
# 停止中のコンテナを開始
docker start webserver

# 複数のコンテナを開始
docker start web1 web2 web3

# インタラクティブモードで開始
docker start -ai my-ubuntu
```

## コンテナの再起動（docker restart）

```bash
# 再起動
docker restart webserver

# タイムアウトを指定
docker restart -t 5 webserver
```

## コンテナの削除（docker rm）

```bash
# 停止中のコンテナを削除
docker rm webserver

# IDで削除
docker rm a1b2c3d4e5f6

# 複数削除
docker rm web1 web2 web3

# 強制削除（実行中でも削除）
docker rm -f webserver

# ボリュームも一緒に削除
docker rm -v webserver
```

### 一括削除

```bash
# 停止中のコンテナをすべて削除
docker container prune

# 確認なしで削除
docker container prune -f

# すべてのコンテナを削除
docker rm -f $(docker ps -aq)

# 終了ステータスでフィルタリング
docker rm $(docker ps -a -f status=exited -q)
```

## コンテナの一時停止・再開

```bash
# 一時停止（SIGSTOP）
docker pause webserver

# 再開（SIGCONT）
docker unpause webserver
```

## 実践例

### Web サーバーの起動から削除まで

```bash
# 1. コンテナを起動
docker run -d --name webserver -p 8080:80 nginx

# 2. 状態を確認
docker ps

# 3. ブラウザでアクセス（http://localhost:8080）

# 4. ログを確認
docker logs webserver

# 5. コンテナを停止
docker stop webserver

# 6. 状態を確認（停止中）
docker ps -a

# 7. コンテナを再起動
docker start webserver

# 8. コンテナを削除
docker stop webserver
docker rm webserver
```

### 一時的なコンテナ

```bash
# 終了後に自動削除
docker run --rm -it ubuntu bash

# コマンド実行して終了
docker run --rm alpine echo "Hello, Docker!"
```

## 再起動ポリシー

```bash
# 常に再起動
docker run -d --restart=always nginx

# 異常終了時のみ再起動
docker run -d --restart=on-failure nginx

# 異常終了時に最大3回まで再起動
docker run -d --restart=on-failure:3 nginx

# Docker デーモン起動時に再起動（手動停止は除く）
docker run -d --restart=unless-stopped nginx
```

| ポリシー | 説明 |
|---------|------|
| `no` | 再起動しない（デフォルト） |
| `always` | 常に再起動 |
| `on-failure` | 異常終了時のみ再起動 |
| `on-failure:N` | 異常終了時にN回まで再起動 |
| `unless-stopped` | 手動停止以外で再起動 |

## まとめ

| コマンド | 説明 |
|---------|------|
| `docker run` | コンテナを作成して実行 |
| `docker ps` | コンテナ一覧を表示 |
| `docker stop` | コンテナを停止 |
| `docker start` | コンテナを開始 |
| `docker restart` | コンテナを再起動 |
| `docker rm` | コンテナを削除 |
| `docker kill` | コンテナを強制停止 |
| `docker pause/unpause` | コンテナを一時停止/再開 |

次のセクションでは、コンテナのライフサイクルについて詳しく学びます。
