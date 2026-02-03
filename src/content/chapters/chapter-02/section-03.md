# イメージの取得・一覧・削除

## 概要

このセクションでは、Dockerイメージの基本的な管理操作を学びます。

## イメージの取得（docker pull）

### 基本構文

```bash
docker pull [オプション] イメージ名[:タグ]
```

### 使用例

```bash
# 最新版を取得
docker pull nginx

# 特定のバージョンを取得
docker pull nginx:1.25

# 特定のバリアント
docker pull node:20-alpine

# 特定のプラットフォーム
docker pull --platform linux/amd64 nginx
```

### すべてのタグを取得

```bash
# 特定リポジトリのすべてのタグを取得（注意：大量のディスク使用）
docker pull -a nginx
```

## イメージの一覧表示（docker images）

### 基本構文

```bash
docker images [オプション] [リポジトリ[:タグ]]
```

### 使用例

```bash
# すべてのイメージを表示
docker images

# 出力例:
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    a6bd71f48f68   2 days ago     187MB
nginx        1.25      b5d3f3e104d4   1 week ago     187MB
node         20        5d5d7b4e3a9c   1 week ago     1.1GB
mysql        8.0       3218b38490ce   2 weeks ago    577MB

# 特定のリポジトリのみ
docker images nginx

# タグも含めて絞り込み
docker images nginx:1.25
```

### フォーマット指定

```bash
# カスタムフォーマット
docker images --format "{{.Repository}}:{{.Tag}} - {{.Size}}"

# 出力例:
nginx:latest - 187MB
nginx:1.25 - 187MB
node:20 - 1.1GB

# JSON形式
docker images --format "{{json .}}"

# IDのみ表示
docker images -q

# 出力例:
a6bd71f48f68
b5d3f3e104d4
5d5d7b4e3a9c
```

### ダングリングイメージ

タグのないイメージ（`<none>`）をダングリングイメージと呼びます。

```bash
# ダングリングイメージを表示
docker images -f "dangling=true"

# 出力例:
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
<none>       <none>    abc123def456   1 week ago     150MB
```

## イメージの詳細確認

### docker inspect

```bash
# イメージの詳細情報をJSON形式で表示
docker inspect nginx

# 特定の情報を抽出
docker inspect --format='{{.Config.ExposedPorts}}' nginx
# 出力: map[80/tcp:{}]

docker inspect --format='{{.Config.Env}}' node:20-alpine
# 出力: [PATH=/usr/local/sbin:... NODE_VERSION=20.x.x ...]
```

### docker history

```bash
# イメージのレイヤー履歴を表示
docker history nginx

# 出力例:
IMAGE          CREATED       CREATED BY                                      SIZE
a6bd71f48f68   2 days ago    CMD ["nginx" "-g" "daemon off;"]                0B
<missing>      2 days ago    EXPOSE 80                                       0B
<missing>      2 days ago    STOPSIGNAL SIGQUIT                              0B
<missing>      2 days ago    RUN /bin/sh -c set -x ...                       61.4MB

# 完全なコマンドを表示
docker history --no-trunc nginx
```

## イメージの削除（docker rmi）

### 基本構文

```bash
docker rmi [オプション] イメージ [イメージ...]
```

### 使用例

```bash
# イメージ名で削除
docker rmi nginx

# タグ指定で削除
docker rmi nginx:1.25

# イメージIDで削除
docker rmi a6bd71f48f68

# 複数のイメージを削除
docker rmi nginx mysql redis

# 強制削除（コンテナが使用中でも削除）
docker rmi -f nginx
```

### 削除時のエラー

```bash
# エラー例: コンテナが使用中
Error response from daemon: conflict: unable to remove repository reference "nginx" (must force) - container abc123 is using its referenced image

# 解決策1: コンテナを先に削除
docker rm abc123
docker rmi nginx

# 解決策2: 強制削除
docker rmi -f nginx
```

## 一括削除

### 未使用イメージの削除

```bash
# ダングリングイメージ（タグなし）を削除
docker image prune

# 確認プロンプトをスキップ
docker image prune -f

# 未使用のすべてのイメージを削除
docker image prune -a

# 24時間以上前に作成されたイメージを削除
docker image prune -a --filter "until=24h"
```

### すべてのイメージを削除

```bash
# すべてのイメージIDを取得して削除
docker rmi $(docker images -q)

# 強制的にすべて削除
docker rmi -f $(docker images -q)
```

## イメージのタグ付け（docker tag）

### 基本構文

```bash
docker tag 元イメージ[:タグ] 新イメージ[:タグ]
```

### 使用例

```bash
# 新しいタグを追加
docker tag nginx:latest nginx:v1.0

# Docker Hub 用にタグ付け
docker tag myapp:latest myusername/myapp:v1.0

# 別のレジストリ用
docker tag myapp:latest myregistry.com/myapp:v1.0
```

## イメージの保存と読み込み

### ファイルに保存（docker save）

```bash
# tar ファイルとして保存
docker save nginx > nginx.tar

# gzip 圧縮して保存
docker save nginx | gzip > nginx.tar.gz

# 複数イメージを1つのファイルに
docker save nginx mysql redis > images.tar
```

### ファイルから読み込み（docker load）

```bash
# tar ファイルから読み込み
docker load < nginx.tar

# gzip 圧縮ファイルから
docker load < nginx.tar.gz

# 進捗を表示
docker load -i nginx.tar
```

## ディスク使用量の確認

```bash
# Docker全体のディスク使用量
docker system df

# 出力例:
TYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images          10      3        5.2GB     3.1GB (59%)
Containers      5       2        500MB     300MB (60%)
Local Volumes   3       2        1.5GB     500MB (33%)
Build Cache     15      0        2.1GB     2.1GB

# 詳細表示
docker system df -v
```

## まとめ

| コマンド | 説明 |
|---------|------|
| `docker pull` | イメージを取得 |
| `docker images` | イメージ一覧を表示 |
| `docker inspect` | イメージの詳細を表示 |
| `docker history` | レイヤー履歴を表示 |
| `docker rmi` | イメージを削除 |
| `docker image prune` | 未使用イメージを削除 |
| `docker tag` | イメージにタグを付ける |
| `docker save` | イメージをファイルに保存 |
| `docker load` | ファイルからイメージを読み込み |

次のセクションでは、コンテナの起動・停止・削除を学びます。
