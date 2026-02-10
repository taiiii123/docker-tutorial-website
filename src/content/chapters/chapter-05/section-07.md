# データの永続化戦略

## 概要

このセクションでは、Dockerボリュームのバックアップ、リストア、マイグレーション方法など、本番環境で必要となるデータ永続化戦略について学びます。

## バックアップの重要性

コンテナ化されたアプリケーションでも、データのバックアップは必須です。

| リスク | 説明 |
|--------|------|
| データ損失 | ハードウェア障害、人為的ミス |
| 災害対策 | データセンターの障害 |
| ランサムウェア | 悪意のある攻撃 |
| 環境移行 | 開発→本番、クラウド移行 |

## ボリュームのバックアップ

### 基本的なバックアップ方法

一時コンテナを使用してボリュームの内容をtarファイルにバックアップします。

```bash
# バックアップ対象のボリューム
docker volume create mydata

# テストデータを作成
docker run --rm -v mydata:/data alpine sh -c "
  echo 'Important data' > /data/file1.txt
  echo 'More data' > /data/file2.txt
  mkdir /data/subdir
  echo 'Nested data' > /data/subdir/file3.txt
"

# バックアップ実行
docker run --rm \
  -v mydata:/source:ro \
  -v "$(pwd)":/backup \
  alpine tar cvf /backup/mydata-backup.tar -C /source .

# バックアップファイルを確認
ls -la mydata-backup.tar
```

### バックアップスクリプト

```bash
#!/bin/bash
# backup-volume.sh

VOLUME_NAME=$1
BACKUP_DIR=${2:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${VOLUME_NAME}_${TIMESTAMP}.tar.gz"

# バックアップディレクトリを作成
mkdir -p "$BACKUP_DIR"

# バックアップ実行
docker run --rm \
  -v "${VOLUME_NAME}:/source:ro" \
  -v "${BACKUP_DIR}:/backup" \
  alpine tar czf "/backup/${VOLUME_NAME}_${TIMESTAMP}.tar.gz" -C /source .

echo "Backup created: ${BACKUP_FILE}"
```

### 使用例

```bash
# スクリプトに実行権限を付与
chmod +x backup-volume.sh

# バックアップ実行
./backup-volume.sh mydata ./backups
# Backup created: ./backups/mydata_20240115_103000.tar.gz
```

## ボリュームのリストア

### 基本的なリストア方法

```bash
# 新しいボリュームを作成
docker volume create mydata-restored

# バックアップからリストア
docker run --rm \
  -v mydata-restored:/target \
  -v "$(pwd)":/backup:ro \
  alpine tar xvf /backup/mydata-backup.tar -C /target

# リストアされたデータを確認
docker run --rm -v mydata-restored:/data alpine ls -la /data
```

### リストアスクリプト

```bash
#!/bin/bash
# restore-volume.sh

BACKUP_FILE=$1
VOLUME_NAME=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$VOLUME_NAME" ]; then
  echo "Usage: $0 <backup-file> <volume-name>"
  exit 1
fi

# ボリュームを作成（存在しない場合）
docker volume create "$VOLUME_NAME" 2>/dev/null

# リストア実行
docker run --rm \
  -v "${VOLUME_NAME}:/target" \
  -v "$(pwd):/backup:ro" \
  alpine tar xzf "/backup/${BACKUP_FILE}" -C /target

echo "Restored to volume: ${VOLUME_NAME}"
```

## データベースのバックアップ

### MySQLのバックアップ

```bash
# MySQLコンテナが稼働中と仮定
docker run -d \
  --name mysql-server \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=myapp \
  mysql:8

# 方法1: mysqldumpを使用（推奨）
docker exec mysql-server mysqldump -uroot -prootpass --all-databases > backup.sql

# 方法2: 特定のデータベースのみ
docker exec mysql-server mysqldump -uroot -prootpass myapp > myapp-backup.sql

# 圧縮してバックアップ
docker exec mysql-server mysqldump -uroot -prootpass --all-databases | gzip > backup.sql.gz
```

### MySQLのリストア

```bash
# バックアップからリストア
cat backup.sql | docker exec -i mysql-server mysql -uroot -prootpass

# 圧縮ファイルからリストア
gunzip < backup.sql.gz | docker exec -i mysql-server mysql -uroot -prootpass
```

### PostgreSQLのバックアップ

```bash
# PostgreSQLコンテナが稼働中と仮定
docker run -d \
  --name postgres-server \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=pgpass \
  -e POSTGRES_DB=myapp \
  postgres:16

# pg_dumpを使用
docker exec postgres-server pg_dump -U postgres myapp > myapp-backup.sql

# 全データベースをバックアップ
docker exec postgres-server pg_dumpall -U postgres > all-databases-backup.sql

# カスタム形式（リストアが高速）
docker exec postgres-server pg_dump -U postgres -Fc myapp > myapp-backup.dump
```

### PostgreSQLのリストア

```bash
# SQLファイルからリストア
cat myapp-backup.sql | docker exec -i postgres-server psql -U postgres -d myapp

# カスタム形式からリストア
cat myapp-backup.dump | docker exec -i postgres-server pg_restore -U postgres -d myapp
```

## ボリュームの移行（マイグレーション）

### ホスト間の移行

```bash
# ソースサーバーでバックアップ
docker run --rm \
  -v source-volume:/data:ro \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/volume-migration.tar.gz -C /data .

# バックアップファイルを転送
scp volume-migration.tar.gz user@target-server:/tmp/

# ターゲットサーバーでリストア
ssh user@target-server "
  docker volume create target-volume
  docker run --rm \
    -v target-volume:/data \
    -v /tmp:/backup:ro \
    alpine tar xzf /backup/volume-migration.tar.gz -C /data
"
```

### Docker Compose環境間の移行

```bash
# 1. 現在の環境を停止
docker compose down

# 2. ボリュームをエクスポート
for vol in $(docker volume ls -q --filter name=myproject); do
  docker run --rm \
    -v ${vol}:/data:ro \
    -v "$(pwd)/migration":/backup \
    alpine tar czf "/backup/${vol}.tar.gz" -C /data .
done

# 3. 新しい環境でボリュームをインポート
cd /new/environment
for file in migration/*.tar.gz; do
  vol=$(basename "$file" .tar.gz)
  docker volume create "$vol"
  docker run --rm \
    -v "${vol}:/data" \
    -v "$(pwd)/migration":/backup:ro \
    alpine tar xzf "/backup/${vol}.tar.gz" -C /data
done

# 4. 新しい環境を起動
docker compose up -d
```

## 自動バックアップの設定

### cronを使用した定期バックアップ

```bash
# crontabを編集
crontab -e

# 毎日午前3時にバックアップを実行
0 3 * * * /path/to/backup-volume.sh mysql-data /backups/mysql >> /var/log/docker-backup.log 2>&1

# 週次で古いバックアップを削除
0 4 * * 0 find /backups -name "*.tar.gz" -mtime +30 -delete
```

### Docker Composeでのバックアップサービス

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: mysql:8
    volumes:
      - mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}

  backup:
    image: alpine
    volumes:
      - mysql-data:/source:ro
      - ./backups:/backup
    entrypoint: /bin/sh
    command: |
      -c "
        while true; do
          timestamp=\$(date +%Y%m%d_%H%M%S)
          tar czf /backup/mysql-data_\${timestamp}.tar.gz -C /source .
          echo \"Backup created: mysql-data_\${timestamp}.tar.gz\"
          # 7日以上古いバックアップを削除
          find /backup -name '*.tar.gz' -mtime +7 -delete
          sleep 86400  # 24時間待機
        done
      "
    depends_on:
      - db

volumes:
  mysql-data:
```

## バックアップのベストプラクティス

### 3-2-1ルール

| ルール | 説明 |
|--------|------|
| 3つのコピー | データの3つのコピーを保持 |
| 2種類のメディア | 2種類の異なるストレージに保存 |
| 1つはオフサイト | 1つは物理的に離れた場所に保管 |

### 実装例

![バックアップ戦略 3-2-1ルール](/images/diagrams/backup-strategy-321.png)

### クラウドへのバックアップ

```bash
# AWS S3へのバックアップ
docker run --rm \
  -v mysql-data:/data:ro \
  -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
  -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
  amazon/aws-cli s3 cp - s3://my-bucket/backups/mysql-$(date +%Y%m%d).tar.gz \
  < <(docker run --rm -v mysql-data:/data:ro alpine tar czf - -C /data .)
```

## ボリュームのクリーンアップ

### 未使用ボリュームの削除

```bash
# 未使用のボリュームを確認
docker volume ls -f dangling=true

# 未使用のボリュームを削除
docker volume prune

# 強制削除（確認なし）
docker volume prune -f

# 特定の条件でフィルタリング
docker volume prune --filter "label!=keep"
```

### ストレージ使用量の確認

```bash
# Dockerの全体的なディスク使用量
docker system df

# 詳細表示
docker system df -v

# ボリューム別の使用量
du -sh /var/lib/docker/volumes/*
```

## 災害復旧計画

### RPO（目標復旧時点）とRTO（目標復旧時間）

| 指標 | 定義 | 目標例 |
|------|------|--------|
| RPO | 許容できるデータ損失の期間 | 1時間（1時間ごとにバックアップ） |
| RTO | サービス復旧までの時間 | 30分以内 |

### 復旧手順書の例

```markdown
# 災害復旧手順

## 前提条件
- 最新のバックアップファイルが利用可能
- 代替サーバーがセットアップ済み

## 手順

1. 代替サーバーにログイン
   ```bash
   ssh admin@backup-server
   ```

2. 最新のバックアップを確認
   ```bash
   ls -la /backups/latest/
   ```

3. ボリュームを作成してリストア
   ```bash
   docker volume create mysql-data
   ./restore-volume.sh mysql-data_latest.tar.gz mysql-data
   ```

4. サービスを起動
   ```bash
   docker compose up -d
   ```

5. 動作確認
   ```bash
   docker compose ps
   curl http://localhost/health
   ```
```

## まとめ

- バックアップは本番環境で必須の運用タスク
- `tar` コマンドと一時コンテナでボリュームをバックアップできる
- データベースは専用のダンプツール（mysqldump, pg_dump）を使用
- 3-2-1ルール（3コピー、2メディア、1オフサイト）を適用する
- 自動バックアップをcronやDockerサービスで設定する
- 定期的にリストアテストを実施して、復旧手順を検証する
- RPO/RTOを定義し、それに応じたバックアップ戦略を立てる

これでChapter 5「ネットワークとボリューム」は完了です。次のチャプターでは、イメージの最適化について学びます。
