# バックアップとリストア

## 概要

このセクションでは、Dockerコンテナとボリュームのバックアップ・リストア手法について学びます。データ損失を防ぎ、障害時に迅速に復旧できる体制を整えます。

## バックアップ対象の整理

### Dockerにおけるデータの種類

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker環境                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                                        │
│  │    イメージ      │ → レジストリに保存（Hub, ECRなど）     │
│  └─────────────────┘                                        │
│  ┌─────────────────┐                                        │
│  │   コンテナ       │ → 再作成可能（イメージ + 設定）        │
│  └─────────────────┘                                        │
│  ┌─────────────────┐                                        │
│  │   ボリューム     │ → 【要バックアップ】永続データ         │
│  └─────────────────┘                                        │
│  ┌─────────────────┐                                        │
│  │   設定ファイル   │ → Git管理（docker-compose.yml等）     │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### バックアップの優先度

| 対象 | 重要度 | バックアップ方法 |
|------|--------|-----------------|
| ボリューム（DB等） | 高 | 定期自動バックアップ |
| 設定ファイル | 高 | Git管理 |
| イメージ | 中 | レジストリに保存 |
| ログ | 低〜中 | ログ集約システム |

## ボリュームのバックアップ

### 基本的なバックアップ手順

```bash
# バックアップ対象のボリュームを確認
docker volume ls

# ボリュームの詳細確認
docker volume inspect mydata
```

### tarを使用したバックアップ

```bash
# ボリュームをtarファイルにバックアップ
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar cvf /backup/mydata-backup.tar -C /source .

# 圧縮バックアップ
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czvf /backup/mydata-backup.tar.gz -C /source .
```

### タイムスタンプ付きバックアップ

```bash
# バックアップスクリプト
#!/bin/bash
VOLUME_NAME="mydata"
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${VOLUME_NAME}_${TIMESTAMP}.tar.gz"

docker run --rm \
  -v ${VOLUME_NAME}:/source:ro \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czvf /backup/${VOLUME_NAME}_${TIMESTAMP}.tar.gz -C /source .

echo "Backup created: ${BACKUP_FILE}"
```

### リストア手順

```bash
# 新しいボリュームを作成
docker volume create mydata-restored

# tarファイルからリストア
docker run --rm \
  -v mydata-restored:/target \
  -v $(pwd)/backup:/backup \
  alpine tar xzvf /backup/mydata-backup.tar.gz -C /target

# リストアの確認
docker run --rm -v mydata-restored:/data alpine ls -la /data
```

## データベースのバックアップ

### PostgreSQL

```bash
# バックアップ
docker exec postgres-container pg_dump -U postgres mydb > backup.sql

# 圧縮バックアップ
docker exec postgres-container pg_dump -U postgres mydb | gzip > backup.sql.gz

# カスタム形式（推奨）
docker exec postgres-container pg_dump -U postgres -Fc mydb > backup.dump
```

```bash
# リストア（SQLファイル）
cat backup.sql | docker exec -i postgres-container psql -U postgres mydb

# リストア（カスタム形式）
docker exec -i postgres-container pg_restore -U postgres -d mydb < backup.dump
```

### MySQL / MariaDB

```bash
# バックアップ
docker exec mysql-container mysqldump -u root -ppassword mydb > backup.sql

# 全データベースのバックアップ
docker exec mysql-container mysqldump -u root -ppassword --all-databases > backup.sql
```

```bash
# リストア
cat backup.sql | docker exec -i mysql-container mysql -u root -ppassword mydb
```

### MongoDB

```bash
# バックアップ
docker exec mongo-container mongodump --out /backup
docker cp mongo-container:/backup ./backup

# リストア
docker cp ./backup mongo-container:/backup
docker exec mongo-container mongorestore /backup
```

### Redis

```bash
# RDBファイルのバックアップ
docker exec redis-container redis-cli BGSAVE
docker cp redis-container:/data/dump.rdb ./backup/

# リストア
docker cp ./backup/dump.rdb redis-container:/data/
docker restart redis-container
```

## Docker Composeでの自動バックアップ

### バックアップサービスの追加

```yaml
version: '3.8'

services:
  db:
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret

  backup:
    image: postgres:16
    depends_on:
      - db
    volumes:
      - ./backups:/backups
    environment:
      PGHOST: db
      PGUSER: postgres
      PGPASSWORD: secret
    entrypoint: |
      sh -c '
        while true; do
          TIMESTAMP=$$(date +%Y%m%d_%H%M%S)
          pg_dump -Fc mydb > /backups/mydb_$$TIMESTAMP.dump
          echo "Backup created: mydb_$$TIMESTAMP.dump"
          # 7日以上古いバックアップを削除
          find /backups -name "*.dump" -mtime +7 -delete
          sleep 86400  # 24時間
        done
      '

volumes:
  db-data:
```

### 専用バックアップコンテナ

```dockerfile
# backup/Dockerfile
FROM alpine:3.19

RUN apk add --no-cache \
    postgresql16-client \
    mysql-client \
    mongodb-tools \
    redis \
    aws-cli \
    dcron

COPY backup.sh /usr/local/bin/
COPY crontab /etc/crontabs/root

RUN chmod +x /usr/local/bin/backup.sh

CMD ["crond", "-f", "-l", "2"]
```

```bash
# backup/backup.sh
#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# PostgreSQLバックアップ
pg_dump -h db -U postgres -Fc mydb > ${BACKUP_DIR}/postgres_${TIMESTAMP}.dump

# S3にアップロード（オプション）
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp ${BACKUP_DIR}/postgres_${TIMESTAMP}.dump s3://${AWS_S3_BUCKET}/backups/
fi

# 古いローカルバックアップを削除
find ${BACKUP_DIR} -name "*.dump" -mtime +7 -delete

echo "Backup completed: ${TIMESTAMP}"
```

## クラウドストレージへのバックアップ

### AWS S3

```bash
# S3にアップロード
docker run --rm \
  -v mydata:/source:ro \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  amazon/aws-cli s3 cp /source s3://mybucket/backups/ --recursive
```

### Google Cloud Storage

```bash
# GCSにアップロード
docker run --rm \
  -v mydata:/source:ro \
  -v ~/.config/gcloud:/root/.config/gcloud \
  google/cloud-sdk gsutil -m cp -r /source gs://mybucket/backups/
```

### Restic（統合バックアップツール）

```yaml
version: '3.8'

services:
  backup:
    image: restic/restic
    volumes:
      - db-data:/data:ro
      - ./restic-password:/password:ro
    environment:
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      RESTIC_REPOSITORY: s3:s3.amazonaws.com/mybucket/restic
      RESTIC_PASSWORD_FILE: /password
    entrypoint: |
      sh -c '
        restic backup /data
        restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
      '
```

## イメージのバックアップ

### イメージの保存と読み込み

```bash
# イメージをtarファイルに保存
docker save myapp:latest > myapp-latest.tar
docker save myapp:latest | gzip > myapp-latest.tar.gz

# tarファイルからイメージを読み込み
docker load < myapp-latest.tar
docker load < myapp-latest.tar.gz
```

### プライベートレジストリへの保存

```bash
# タグ付け
docker tag myapp:latest myregistry.com/myapp:latest

# プッシュ
docker push myregistry.com/myapp:latest
```

## 完全バックアップスクリプト

```bash
#!/bin/bash
# full-backup.sh

set -e

# 設定
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
COMPOSE_PROJECT="myproject"

mkdir -p ${BACKUP_DIR}

echo "=== Docker Full Backup ==="
echo "Backup directory: ${BACKUP_DIR}"

# 1. ボリュームのバックアップ
echo "Backing up volumes..."
for volume in $(docker volume ls -q); do
  echo "  - ${volume}"
  docker run --rm \
    -v ${volume}:/source:ro \
    -v ${BACKUP_DIR}:/backup \
    alpine tar czvf /backup/volume_${volume}.tar.gz -C /source .
done

# 2. イメージのバックアップ
echo "Backing up images..."
for image in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>"); do
  safe_name=$(echo ${image} | tr '/:' '_')
  echo "  - ${image}"
  docker save ${image} | gzip > ${BACKUP_DIR}/image_${safe_name}.tar.gz
done

# 3. 設定ファイルのコピー
echo "Copying configuration files..."
cp docker-compose.yml ${BACKUP_DIR}/
cp .env ${BACKUP_DIR}/ 2>/dev/null || true

# 4. バックアップの検証
echo "Verifying backup..."
ls -la ${BACKUP_DIR}

# 5. バックアップサイズの表示
echo "Total backup size:"
du -sh ${BACKUP_DIR}

echo "=== Backup completed ==="
```

## リストアスクリプト

```bash
#!/bin/bash
# full-restore.sh

set -e

BACKUP_DIR=$1

if [ -z "${BACKUP_DIR}" ]; then
  echo "Usage: $0 <backup_directory>"
  exit 1
fi

echo "=== Docker Full Restore ==="
echo "Restoring from: ${BACKUP_DIR}"

# 1. ボリュームのリストア
echo "Restoring volumes..."
for archive in ${BACKUP_DIR}/volume_*.tar.gz; do
  volume_name=$(basename ${archive} .tar.gz | sed 's/volume_//')
  echo "  - ${volume_name}"

  # 既存ボリュームがあれば削除
  docker volume rm ${volume_name} 2>/dev/null || true
  docker volume create ${volume_name}

  docker run --rm \
    -v ${volume_name}:/target \
    -v ${BACKUP_DIR}:/backup:ro \
    alpine tar xzvf /backup/$(basename ${archive}) -C /target
done

# 2. イメージのリストア
echo "Restoring images..."
for archive in ${BACKUP_DIR}/image_*.tar.gz; do
  echo "  - $(basename ${archive})"
  docker load < ${archive}
done

echo "=== Restore completed ==="
echo "Start your services with: docker compose up -d"
```

## バックアップの検証

### 定期的なリストアテスト

```bash
#!/bin/bash
# test-restore.sh

# テスト用の一時ディレクトリ
TEST_DIR=$(mktemp -d)
cd ${TEST_DIR}

# 最新のバックアップをリストア
LATEST_BACKUP=$(ls -td /backup/*/ | head -1)

# テスト用ボリュームにリストア
docker volume create test-restore

docker run --rm \
  -v test-restore:/target \
  -v ${LATEST_BACKUP}:/backup:ro \
  alpine tar xzf /backup/volume_mydata.tar.gz -C /target

# データの整合性チェック
docker run --rm \
  -v test-restore:/data:ro \
  alpine sh -c 'ls -la /data && wc -l /data/*'

# クリーンアップ
docker volume rm test-restore
rm -rf ${TEST_DIR}

echo "Restore test completed successfully"
```

## ベストプラクティス

### 1. 3-2-1 ルール

```
3つのコピー    - 本番データ + 2つのバックアップ
2種類のメディア - ローカル + クラウド
1つはオフサイト - 物理的に離れた場所
```

### 2. バックアップのスケジュール

| 種類 | 頻度 | 保持期間 |
|------|------|----------|
| フル | 週1回 | 4週間 |
| 差分 | 日1回 | 7日間 |
| ログ | リアルタイム | 30日間 |

### 3. 監視とアラート

```yaml
# バックアップ監視の例
services:
  backup-monitor:
    image: prom/blackbox-exporter
    volumes:
      - ./backup:/backup:ro
    # バックアップファイルの存在と新しさをチェック
```

## まとめ

- ボリュームは最も重要なバックアップ対象
- `docker run`でtarアーカイブを作成してバックアップ
- データベースは専用のダンプツールを使用
- 自動バックアップをcronまたは専用コンテナで設定
- クラウドストレージにオフサイトバックアップ
- 定期的にリストアテストを実施
- 3-2-1ルールに従ってバックアップを保管

次のセクションでは、Docker Swarmの基礎について学びます。
