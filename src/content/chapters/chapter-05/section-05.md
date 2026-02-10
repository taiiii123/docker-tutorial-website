# Dockerボリュームの基礎

## 概要

このセクションでは、Dockerにおけるデータ永続化の必要性と、ボリュームの基本概念について学びます。コンテナのライフサイクルからデータを独立させる方法を理解しましょう。

## なぜボリュームが必要なのか

### コンテナの一時的な性質

Dockerコンテナは基本的に一時的（ephemeral）なものです。コンテナを削除すると、その中のデータもすべて失われます。

```bash
# コンテナを起動してファイルを作成
docker run -d --name temp-container alpine sh -c "echo 'Hello' > /data.txt && sleep 3600"

# ファイルが存在することを確認
docker exec temp-container cat /data.txt
# 出力: Hello

# コンテナを削除
docker stop temp-container && docker rm temp-container

# 同じイメージで新しいコンテナを起動
docker run --name new-container alpine cat /data.txt
# エラー: ファイルが存在しない

docker rm new-container
```

### コンテナレイヤーの仕組み

![コンテナの読み書きレイヤー](/images/diagrams/container-layers-rw.png)

### データ永続化が必要なケース

| ケース | 例 |
|--------|-----|
| データベース | MySQL, PostgreSQL, MongoDB のデータファイル |
| アプリケーション設定 | 設定ファイル、証明書 |
| ユーザーデータ | アップロードファイル、ログ |
| 開発環境 | ソースコードのホットリロード |
| 共有データ | 複数コンテナ間でのデータ共有 |

## Dockerボリュームとは

**Dockerボリューム**は、コンテナのライフサイクルとは独立してデータを永続化する仕組みです。

### ボリュームの特徴

| 特徴 | 説明 |
|------|------|
| 永続性 | コンテナを削除してもデータは残る |
| 独立性 | ホストのファイルシステムから分離 |
| 共有性 | 複数のコンテナで共有可能 |
| バックアップ | 簡単にバックアップ・移行が可能 |
| ドライバー | 様々なストレージドライバーに対応 |

### ボリュームの仕組み

![ボリューム管理の仕組み](/images/diagrams/volume-management.png)

## 基本的なボリューム操作

### ボリュームの作成

```bash
# 名前付きボリュームを作成
docker volume create my-volume

# 作成されたことを確認
docker volume ls
# DRIVER    VOLUME NAME
# local     my-volume
```

### ボリュームの詳細確認

```bash
# ボリュームの詳細を表示
docker volume inspect my-volume

# 出力例:
[
    {
        "CreatedAt": "2024-01-15T10:30:00Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-volume/_data",
        "Name": "my-volume",
        "Options": {},
        "Scope": "local"
    }
]
```

### コンテナへのボリュームのマウント

```bash
# -v オプションを使用（短い形式）
docker run -d \
  --name app1 \
  -v my-volume:/app/data \
  alpine sh -c "echo 'Data from app1' > /app/data/test.txt && sleep 3600"

# --mount オプションを使用（長い形式、推奨）
docker run -d \
  --name app2 \
  --mount source=my-volume,target=/app/data \
  alpine sleep 3600

# app2からデータを読み取り（app1で書き込んだデータ）
docker exec app2 cat /app/data/test.txt
# 出力: Data from app1
```

### -v と --mount の比較

| 項目 | -v / --volume | --mount |
|------|---------------|---------|
| 構文 | `source:target:options` | `key=value` 形式 |
| 存在しないボリューム | 自動作成 | エラー（type=volume時） |
| 可読性 | 簡潔だが分かりにくい | 明示的で分かりやすい |
| 推奨度 | 互換性のために残存 | Docker公式推奨 |

```bash
# -v の例
docker run -v my-volume:/data alpine

# --mount の同等の例
docker run --mount type=volume,source=my-volume,target=/data alpine
```

## ボリュームのライフサイクル

### ボリュームの一覧表示

```bash
# 全ボリュームを一覧表示
docker volume ls

# フィルタリング
docker volume ls --filter driver=local
docker volume ls --filter name=my-

# フォーマット指定
docker volume ls --format "{{.Name}}: {{.Driver}}"
```

### ボリュームの削除

```bash
# 特定のボリュームを削除
docker volume rm my-volume

# 注意: ボリュームを使用中のコンテナがあると削除できない
# エラー: volume is in use

# 未使用のボリュームを一括削除
docker volume prune

# 確認なしで削除
docker volume prune -f

# フィルタ付きで削除
docker volume prune --filter "label!=keep"
```

## 実践例：データベースのデータ永続化

### MySQLの例

```bash
# MySQLデータ用のボリュームを作成
docker volume create mysql-data

# MySQLコンテナを起動（ボリュームをマウント）
docker run -d \
  --name mysql-server \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  mysql:8

# データを追加
docker exec -it mysql-server mysql -uroot -prootpassword -e "
  USE myapp;
  CREATE TABLE users (id INT, name VARCHAR(100));
  INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
  SELECT * FROM users;
"

# コンテナを削除
docker stop mysql-server && docker rm mysql-server

# 新しいコンテナで同じボリュームを使用
docker run -d \
  --name mysql-server-new \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -v mysql-data:/var/lib/mysql \
  mysql:8

# データが残っていることを確認
docker exec mysql-server-new mysql -uroot -prootpassword -e "
  USE myapp;
  SELECT * FROM users;
"
# 出力:
# +------+-------+
# | id   | name  |
# +------+-------+
# |    1 | Alice |
# |    2 | Bob   |
# +------+-------+
```

### PostgreSQLの例

```bash
# PostgreSQLデータ用のボリュームを作成
docker volume create postgres-data

# PostgreSQLコンテナを起動
docker run -d \
  --name postgres-server \
  -e POSTGRES_PASSWORD=pgpassword \
  -e POSTGRES_DB=myapp \
  --mount type=volume,source=postgres-data,target=/var/lib/postgresql/data \
  postgres:16

# データが永続化される
```

## 匿名ボリューム

名前を指定せずにボリュームを作成することもできます。

```bash
# 匿名ボリューム（名前なし）
docker run -d -v /data alpine sleep 3600

# 匿名ボリュームの確認
docker volume ls
# DRIVER    VOLUME NAME
# local     a1b2c3d4e5f6g7h8i9j0...  ← ランダムなID

# 匿名ボリュームは管理が難しいため、本番環境では名前付きボリュームを推奨
```

## Docker Composeでのボリューム定義

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  db-data:
    driver: local
  redis-data:
    driver: local
    driver_opts:
      type: none
      device: /path/to/local/storage
      o: bind
```

## ボリューム関連のコマンドまとめ

| コマンド | 説明 |
|---------|------|
| `docker volume create` | ボリュームを作成 |
| `docker volume ls` | ボリューム一覧を表示 |
| `docker volume inspect` | ボリュームの詳細を表示 |
| `docker volume rm` | ボリュームを削除 |
| `docker volume prune` | 未使用のボリュームを削除 |

## クリーンアップ

```bash
# コンテナを停止・削除
docker stop app1 app2 mysql-server mysql-server-new postgres-server
docker rm app1 app2 mysql-server mysql-server-new postgres-server

# ボリュームを削除
docker volume rm my-volume mysql-data postgres-data
```

## まとめ

- コンテナは一時的であり、削除するとデータも消失する
- Dockerボリュームはコンテナのライフサイクルから独立してデータを永続化する
- ボリュームは複数のコンテナ間で共有できる
- `-v` よりも `--mount` オプションの使用が推奨される
- データベースなどのステートフルなアプリケーションにはボリュームが必須
- 名前付きボリュームは管理が容易で、本番環境での使用に適している

次のセクションでは、ボリュームの種類（名前付きボリューム、バインドマウント、tmpfs）について詳しく学びます。
