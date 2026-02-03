# コンテナ内での操作

## 概要

このセクションでは、実行中のコンテナ内でコマンドを実行したり、シェルに入って操作する方法を学びます。

## docker exec

実行中のコンテナ内で新しいコマンドを実行します。

### 基本構文

```bash
docker exec [オプション] コンテナ名 コマンド [引数...]
```

### よく使うオプション

| オプション | 説明 |
|-----------|------|
| `-i` | 標準入力を開いたままにする |
| `-t` | 疑似TTYを割り当てる |
| `-it` | インタラクティブ + TTY |
| `-d` | バックグラウンドで実行 |
| `-e` | 環境変数を設定 |
| `-w` | 作業ディレクトリを指定 |
| `-u` | 実行ユーザーを指定 |

### 使用例

```bash
# コンテナ内でコマンドを実行
docker exec mycontainer ls -la

# シェルに入る
docker exec -it mycontainer /bin/bash

# Alpine Linux の場合
docker exec -it mycontainer /bin/sh

# 特定のユーザーで実行
docker exec -u root mycontainer whoami

# 作業ディレクトリを指定
docker exec -w /var/log mycontainer ls -la

# 環境変数を設定して実行
docker exec -e MY_VAR=value mycontainer env
```

## 実践例：Web サーバーの確認

```bash
# nginx コンテナを起動
docker run -d --name webserver nginx

# 設定ファイルを確認
docker exec webserver cat /etc/nginx/nginx.conf

# プロセスを確認
docker exec webserver ps aux

# ネットワーク設定を確認
docker exec webserver cat /etc/hosts

# シェルで対話的に操作
docker exec -it webserver /bin/bash
root@abc123:/# nginx -t
root@abc123:/# exit
```

## docker attach

実行中のコンテナのメインプロセスに接続します。

```bash
# コンテナにアタッチ
docker attach mycontainer

# 注意: Ctrl+C で終了するとコンテナも停止する
# デタッチするには Ctrl+P, Ctrl+Q を使用
```

### exec と attach の違い

| 操作 | docker exec | docker attach |
|------|------------|--------------|
| 接続先 | 新しいプロセス | メインプロセス |
| 終了時 | プロセスのみ終了 | コンテナが停止する可能性 |
| 用途 | 追加コマンド実行 | ログ確認、デバッグ |

## ファイルのコピー（docker cp）

### コンテナからホストへ

```bash
# ファイルをコピー
docker cp mycontainer:/var/log/nginx/access.log ./access.log

# ディレクトリをコピー
docker cp mycontainer:/etc/nginx ./nginx-config
```

### ホストからコンテナへ

```bash
# ファイルをコピー
docker cp ./index.html mycontainer:/usr/share/nginx/html/

# ディレクトリをコピー
docker cp ./config mycontainer:/app/
```

### 使用例

```bash
# nginx のデフォルトページを差し替え
docker run -d --name webserver -p 8080:80 nginx

echo "<h1>Hello Docker!</h1>" > index.html
docker cp index.html webserver:/usr/share/nginx/html/index.html

# ブラウザで http://localhost:8080 にアクセス
```

## コンテナの変更を確認（docker diff）

```bash
# コンテナ内での変更を表示
docker diff mycontainer

# 出力例:
C /var
C /var/log
A /var/log/nginx/access.log
C /etc
A /etc/nginx/conf.d/custom.conf
```

| 記号 | 意味 |
|------|------|
| A | 追加（Added） |
| C | 変更（Changed） |
| D | 削除（Deleted） |

## コンテナのリソース使用状況（docker stats）

```bash
# リアルタイムで監視
docker stats

# 出力例:
CONTAINER   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O         BLOCK I/O
webserver   0.00%   3.5MiB / 7.7GiB     0.04%   1.2kB / 0B      0B / 0B
database    0.50%   380MiB / 7.7GiB     4.83%   5.3kB / 4.1kB   10MB / 5MB

# 特定のコンテナのみ
docker stats webserver database

# 1回だけ表示（監視を終了）
docker stats --no-stream

# カスタムフォーマット
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## コンテナのプロセス確認（docker top）

```bash
# コンテナ内のプロセス一覧
docker top mycontainer

# 出力例:
UID    PID    PPID   C   STIME   TTY   TIME     CMD
root   12345  12340  0   10:30   ?     00:00:00 nginx: master process
nginx  12346  12345  0   10:30   ?     00:00:00 nginx: worker process

# ps のオプションを指定
docker top mycontainer aux
```

## 実践シナリオ

### データベースの操作

```bash
# MySQL コンテナを起動
docker run -d --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# MySQL クライアントに接続
docker exec -it mysql-db mysql -uroot -psecret

# SQLを実行
mysql> SHOW DATABASES;
mysql> CREATE DATABASE myapp;
mysql> exit
```

### ログファイルの確認

```bash
# コンテナ内のログを確認
docker exec mycontainer cat /var/log/app.log

# ログをリアルタイムで追跡
docker exec mycontainer tail -f /var/log/app.log

# ログをホストにコピー
docker cp mycontainer:/var/log/app.log ./app.log
```

### デバッグツールのインストール

```bash
# シェルに入る
docker exec -it mycontainer /bin/bash

# デバッグツールをインストール（一時的）
apt-get update && apt-get install -y curl vim procps

# 確認
curl localhost
ps aux

# 終了
exit
```

## まとめ

| コマンド | 説明 |
|---------|------|
| `docker exec` | コンテナ内でコマンドを実行 |
| `docker exec -it` | インタラクティブシェルを起動 |
| `docker attach` | メインプロセスに接続 |
| `docker cp` | ファイルをコピー |
| `docker diff` | ファイル変更を確認 |
| `docker stats` | リソース使用状況を監視 |
| `docker top` | プロセス一覧を表示 |

次のセクションでは、コンテナのログの確認と管理について学びます。
