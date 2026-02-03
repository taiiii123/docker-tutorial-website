# セキュリティベストプラクティス

## 概要

このセクションでは、Dockerセキュリティのベストプラクティスを総まとめします。CIS Docker Benchmarkに基づくチェックリスト、監査ログの設定、定期的なセキュリティレビューの方法について学びます。

## CIS Docker Benchmark

CIS（Center for Internet Security）Docker Benchmarkは、Dockerセキュリティの業界標準ガイドラインです。

### カテゴリ別チェック項目

```
┌─────────────────────────────────────────────────────────────┐
│              CIS Docker Benchmark カテゴリ                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ホストの設定                                             │
│     └─→ カーネル、パーティション、監査設定                   │
│                                                             │
│  2. Docker Daemonの設定                                     │
│     └─→ ネットワーク、認証、ログ設定                        │
│                                                             │
│  3. Docker Daemon設定ファイル                               │
│     └─→ ファイルパーミッション、所有者                       │
│                                                             │
│  4. コンテナイメージとビルド                                 │
│     └─→ 信頼できるベースイメージ、脆弱性スキャン            │
│                                                             │
│  5. コンテナランタイム                                       │
│     └─→ 権限、Capability、リソース制限                      │
│                                                             │
│  6. Docker Security Operations                              │
│     └─→ 監視、インシデント対応、更新管理                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Docker Bench Securityツール

```bash
# Docker Bench Securityを実行
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security
```

出力例:

```
[INFO] 1 - Host Configuration
[PASS] 1.1 - Ensure a separate partition for containers has been created
[WARN] 1.2 - Ensure only trusted users are allowed to control Docker daemon
...
[INFO] 4 - Container Images and Build File
[PASS] 4.1 - Ensure that a user for the container has been created
[WARN] 4.6 - Ensure that HEALTHCHECK instructions have been added to container images
```

## セキュリティチェックリスト

### イメージセキュリティ

```markdown
## イメージセキュリティチェックリスト

### ベースイメージ
- [ ] 公式イメージまたは信頼できるソースを使用
- [ ] 軽量イメージ（Alpine, Distroless）を優先
- [ ] タグにlatestを使用せず、バージョンを固定
- [ ] ダイジェストでイメージを固定（重要な本番環境）

### Dockerfile
- [ ] USER命令で非rootユーザーを指定
- [ ] 不要なパッケージをインストールしない
- [ ] マルチステージビルドを使用
- [ ] シークレットをイメージに含めない
- [ ] .dockerignoreを適切に設定
- [ ] HEALTHCHECKを定義

### スキャン
- [ ] ビルド時に脆弱性スキャンを実行
- [ ] CRITICALな脆弱性がある場合はビルドを失敗させる
- [ ] 定期的に既存イメージを再スキャン
```

### ランタイムセキュリティ

```markdown
## ランタイムセキュリティチェックリスト

### 権限
- [ ] --privileged を使用しない
- [ ] 不要なCapabilityをすべて削除（--cap-drop=ALL）
- [ ] 必要なCapabilityのみ追加
- [ ] 読み取り専用ファイルシステムを使用
- [ ] no-new-privilegesを設定

### リソース
- [ ] メモリ制限を設定
- [ ] CPU制限を設定
- [ ] プロセス数制限を設定
- [ ] ファイルディスクリプタ制限を設定

### ネットワーク
- [ ] 必要なポートのみ公開
- [ ] カスタムネットワークで分離
- [ ] 内部ネットワークを適切に使用
- [ ] ホストネットワークを避ける
```

### 運用セキュリティ

```markdown
## 運用セキュリティチェックリスト

### シークレット管理
- [ ] Docker Secretsまたは外部ツールを使用
- [ ] 環境変数に機密情報を直接設定しない
- [ ] シークレットのローテーションを実施

### 監視とログ
- [ ] コンテナログを収集
- [ ] Docker Daemonログを監視
- [ ] 異常検知を設定
- [ ] セキュリティイベントのアラートを設定

### 更新管理
- [ ] 定期的にベースイメージを更新
- [ ] Docker Engineを最新に保つ
- [ ] セキュリティパッチを迅速に適用
```

## セキュアなDockerfile テンプレート

```dockerfile
# syntax=docker/dockerfile:1

# ベースイメージ（バージョン固定）
FROM node:20.11.0-alpine AS builder

# 非rootユーザーでビルド
WORKDIR /app

# 依存関係を先にコピー（キャッシュ効率化）
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY --chown=node:node . .

# ビルド
RUN npm run build

# ---
# 実行ステージ（最小限のイメージ）
FROM node:20.11.0-alpine

# セキュリティ更新を適用
RUN apk update && apk upgrade --no-cache

# 非rootユーザーを使用
USER node

WORKDIR /app

# ビルド成果物のみをコピー
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# メタデータ
LABEL maintainer="team@example.com"
LABEL version="1.0.0"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# 非特権ポート
EXPOSE 8080

# 読み取り専用ファイルシステムで実行可能
# 書き込みが必要な場合は tmpfs を使用

# アプリケーション起動
CMD ["node", "dist/index.js"]
```

## セキュアなdocker-compose.yml テンプレート

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: myapp:${VERSION:-latest}

    # 非rootユーザー
    user: "1000:1000"

    # 読み取り専用ファイルシステム
    read_only: true

    # 書き込みが必要な場合のみtmpfs
    tmpfs:
      - /tmp
      - /var/run

    # セキュリティオプション
    security_opt:
      - no-new-privileges:true

    # Capabilityの制限
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # 必要な場合のみ

    # リソース制限
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

    # プロセス数制限
    pids_limit: 100

    # ファイルディスクリプタ制限
    ulimits:
      nofile:
        soft: 1024
        hard: 2048

    # ネットワーク分離
    networks:
      - frontend

    # ヘルスチェック
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

    # ログ設定
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

    # シークレット
    secrets:
      - db_password

    # 環境変数（機密情報を含まない）
    environment:
      NODE_ENV: production
      LOG_LEVEL: info

  db:
    image: postgres:15-alpine
    user: "999:999"  # postgresユーザー
    read_only: true
    tmpfs:
      - /tmp
      - /run/postgresql
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    networks:
      - backend
    volumes:
      - db-data:/var/lib/postgresql/data
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 外部アクセス不可

volumes:
  db-data:
    driver: local

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 監査ログの設定

### Docker Daemon監査ログ

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  },
  "userns-remap": "default",
  "no-new-privileges": true,
  "live-restore": true,
  "userland-proxy": false
}
```

### Linux Auditd設定

```bash
# Dockerの監査ルールを追加
sudo auditctl -w /usr/bin/docker -p rwxa -k docker
sudo auditctl -w /var/lib/docker -p rwxa -k docker
sudo auditctl -w /etc/docker -p rwxa -k docker
sudo auditctl -w /var/run/docker.sock -p rwxa -k docker

# 永続化（/etc/audit/rules.d/docker.rules）
-w /usr/bin/docker -p rwxa -k docker
-w /var/lib/docker -p rwxa -k docker
-w /etc/docker -p rwxa -k docker
-w /var/run/docker.sock -p rwxa -k docker
```

### 監査ログの確認

```bash
# auditdログを検索
ausearch -k docker

# 特定の時間範囲
ausearch -k docker -ts today -te now

# レポート生成
aureport -k docker
```

## 定期的なセキュリティレビュー

### 自動化スクリプト例

```bash
#!/bin/bash
# security-audit.sh

echo "=== Docker Security Audit ==="
echo "Date: $(date)"
echo ""

echo "=== 1. Running containers ==="
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=== 2. Containers running as root ==="
for container in $(docker ps -q); do
    user=$(docker exec $container whoami 2>/dev/null)
    if [ "$user" = "root" ]; then
        echo "WARNING: $container is running as root"
    fi
done
echo ""

echo "=== 3. Privileged containers ==="
docker ps --filter "label=privileged=true" --format "{{.Names}}"
echo ""

echo "=== 4. Containers without resource limits ==="
docker ps -q | xargs docker inspect --format '{{.Name}} Memory: {{.HostConfig.Memory}} CPU: {{.HostConfig.NanoCpus}}' | grep "Memory: 0"
echo ""

echo "=== 5. Images without tags ==="
docker images --filter "dangling=true" --format "{{.ID}}"
echo ""

echo "=== 6. Running Docker Bench Security ==="
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -v /etc:/etc:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    docker/docker-bench-security 2>/dev/null | grep -E "(WARN|PASS|INFO)"

echo ""
echo "=== Audit Complete ==="
```

### CI/CDでの定期チェック

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜日
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy on all images
        run: |
          for image in $(cat images.txt); do
            echo "Scanning $image"
            trivy image --severity HIGH,CRITICAL $image
          done

      - name: Check Dockerfile best practices
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile
```

## インシデント対応

### コンテナ侵害時の対応手順

```
┌─────────────────────────────────────────────────────────────┐
│              インシデント対応手順                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 検知                                                    │
│     └─→ 異常なプロセス、ネットワーク通信、リソース使用       │
│                                                             │
│  2. 隔離                                                    │
│     ├─→ ネットワークから切断                                │
│     └─→ docker pause でプロセス一時停止                     │
│                                                             │
│  3. 証拠保全                                                │
│     ├─→ docker export でファイルシステム保存               │
│     ├─→ docker logs でログ保存                             │
│     └─→ docker inspect で設定保存                          │
│                                                             │
│  4. 分析                                                    │
│     ├─→ 侵入経路の特定                                      │
│     └─→ 影響範囲の調査                                      │
│                                                             │
│  5. 復旧                                                    │
│     ├─→ 安全なイメージから再デプロイ                        │
│     └─→ シークレットのローテーション                        │
│                                                             │
│  6. 事後対応                                                │
│     ├─→ 根本原因の修正                                      │
│     └─→ 再発防止策の実施                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 証拠保全コマンド

```bash
# コンテナを一時停止
docker pause suspicious-container

# ファイルシステムをエクスポート
docker export suspicious-container > evidence/container-$(date +%Y%m%d).tar

# ログを保存
docker logs suspicious-container > evidence/logs-$(date +%Y%m%d).txt

# 設定を保存
docker inspect suspicious-container > evidence/inspect-$(date +%Y%m%d).json

# ネットワーク接続を確認
docker exec suspicious-container netstat -an > evidence/netstat-$(date +%Y%m%d).txt
```

## まとめ

- CIS Docker Benchmarkをセキュリティ基準として採用
- Docker Bench Securityで定期的に自動チェック
- セキュリティチェックリストを作成し、全コンテナに適用
- 監査ログを有効化し、セキュリティイベントを記録
- インシデント対応手順を事前に準備
- 定期的なセキュリティレビューを実施
- セキュアなテンプレートを標準化して使用

これでChapter 7「セキュリティ」の学習は完了です。次のChapter 8では、本番環境でのDocker運用について学びます。
