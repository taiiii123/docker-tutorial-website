# ベストプラクティス集

## 概要

このセクションでは、Dockerを使用した開発・運用における推奨プラクティスをまとめています。効率的でセキュアなコンテナ環境を構築するための指針として活用してください。

## Dockerfile のベストプラクティス

### 1. 軽量なベースイメージを使用する

```dockerfile
# 良い例: Alpine ベースを使用
FROM node:20-alpine

# 良い例: slim バリアントを使用
FROM python:3.12-slim

# 良い例: distroless を使用（最小限のランタイム）
FROM gcr.io/distroless/nodejs20-debian12

# 避けるべき例: フルイメージ
FROM node:20       # 約1GB
FROM ubuntu:22.04  # 約77MB（必要なパッケージを追加するとさらに増加）
```

| イメージタイプ | サイズ目安 | 用途 |
|--------------|----------|------|
| scratch | 0MB | 静的バイナリのみ |
| distroless | 数MB〜数十MB | 本番環境向け |
| alpine | 数MB | 軽量で汎用的 |
| slim | 数十MB〜100MB | 軽量かつ互換性重視 |
| 通常版 | 数百MB〜1GB | 開発・デバッグ用 |

### 2. レイヤー数を最小化する

```dockerfile
# 悪い例: 複数のRUN命令
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN rm -rf /var/lib/apt/lists/*

# 良い例: 1つのRUN命令に結合
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        git && \
    rm -rf /var/lib/apt/lists/*
```

### 3. キャッシュを最大限に活用する

変更頻度の低いものを先に、高いものを後に配置します。

```dockerfile
# 良い例: 依存関係ファイルを先にコピー
FROM node:20-alpine

WORKDIR /app

# 1. パッケージ定義ファイルをコピー（変更頻度: 低）
COPY package*.json ./

# 2. 依存関係をインストール（キャッシュ可能）
RUN npm ci --only=production

# 3. アプリケーションコードをコピー（変更頻度: 高）
COPY . .

CMD ["node", "server.js"]
```

### 4. マルチステージビルドを活用する

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS production
WORKDIR /app

# 本番用の依存関係のみインストール
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ビルド成果物のみコピー
COPY --from=builder /app/dist ./dist

# 非rootユーザーで実行
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 5. .dockerignore を適切に設定する

```dockerignore
# バージョン管理
.git
.gitignore

# 依存関係（コンテナ内で再インストール）
node_modules
vendor
__pycache__

# ビルド成果物
dist
build
*.log

# 開発用ファイル
.env.local
.env.*.local
*.md
!README.md

# IDE・エディタ
.idea
.vscode
*.swp
*.swo

# テスト
coverage
__tests__
*.test.js
*.spec.js

# Docker関連
Dockerfile*
docker-compose*
.dockerignore
```

### 6. 固定バージョンのタグを使用する

```dockerfile
# 悪い例: latest は避ける
FROM node:latest

# 良い例: 具体的なバージョンを指定
FROM node:20.10.0-alpine3.19

# 良い例: メジャー.マイナーまで指定
FROM node:20.10-alpine
```

### 7. 不要なパッケージをインストールしない

```dockerfile
# 良い例: 推奨パッケージを除外
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*
```

## セキュリティのベストプラクティス

### 1. 非rootユーザーで実行する

```dockerfile
# ユーザーを作成
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# アプリケーションディレクトリの所有者を変更
WORKDIR /app
RUN chown -R appuser:appgroup /app

# ユーザーを切り替え
USER appuser

# または既存のユーザーを使用（Node.js）
USER node
```

### 2. 最小権限の原則を適用する

```dockerfile
# 読み取り専用ファイルシステムで実行
# docker run --read-only myimage

# 必要なディレクトリのみ書き込み可能に
# docker run --read-only --tmpfs /tmp myimage

# capabilities を最小化
# docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myimage
```

### 3. 機密情報をイメージに含めない

```dockerfile
# 悪い例: 機密情報をハードコード
ENV API_KEY=sk-secret-key

# 悪い例: 機密情報をCOPY
COPY .env /app/

# 良い例: 実行時に環境変数で渡す
# docker run -e API_KEY=sk-secret-key myimage

# 良い例: シークレットマウントを使用（ビルド時）
RUN --mount=type=secret,id=api_key \
    export API_KEY=$(cat /run/secrets/api_key) && \
    some-command-that-needs-key
```

### 4. 定期的にイメージをスキャンする

```bash
# Trivy でスキャン
trivy image myimage:latest

# Docker Scout でスキャン
docker scout cves myimage:latest

# GitHub Actions での自動スキャン
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myimage:latest'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

### 5. ベースイメージを定期的に更新する

```bash
# 最新のベースイメージでリビルド
docker build --pull -t myimage .

# 自動更新の仕組み（Dependabot, Renovate など）を導入
```

## Docker Compose のベストプラクティス

### 1. 環境ごとにファイルを分離する

```bash
# ファイル構成
docker-compose.yml           # 基本設定
docker-compose.override.yml  # 開発用（自動読み込み）
docker-compose.prod.yml      # 本番用
docker-compose.test.yml      # テスト用
```

```yaml
# docker-compose.yml（基本設定）
services:
  web:
    build: .
    environment:
      - NODE_ENV=production

# docker-compose.override.yml（開発用）
services:
  web:
    volumes:
      - .:/app
    environment:
      - NODE_ENV=development
      - DEBUG=1
    ports:
      - "3000:3000"
```

```bash
# 本番環境での起動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. 環境変数を適切に管理する

```yaml
# .env ファイル
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret
POSTGRES_DB=myapp

# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
```

```bash
# 環境ごとに.envファイルを分離
.env              # デフォルト（.gitignore推奨）
.env.example      # テンプレート（git管理）
.env.production   # 本番用（git管理外）
```

### 3. ヘルスチェックを設定する

```yaml
services:
  web:
    image: nginx
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    depends_on:
      db:
        condition: service_healthy
```

### 4. リソース制限を設定する

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 5. ログ設定を適切に行う

```yaml
services:
  web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## イメージ管理のベストプラクティス

### 1. タグ付け戦略を策定する

```bash
# セマンティックバージョニング
myapp:1.0.0
myapp:1.0
myapp:1

# 環境別タグ
myapp:latest     # 最新の安定版
myapp:stable     # 本番環境用
myapp:staging    # ステージング環境用
myapp:develop    # 開発環境用

# Git連携タグ
myapp:abc1234    # コミットハッシュ
myapp:main       # ブランチ名
myapp:v1.0.0     # Gitタグ

# 日付タグ
myapp:20240115
myapp:20240115-abc1234
```

### 2. イメージサイズを最小化する

```bash
# サイズを確認
docker images myapp
docker history myapp

# dive でレイヤー分析
dive myapp:latest
```

```dockerfile
# サイズ削減のテクニック
# 1. 不要なファイルを削除
RUN npm ci && npm cache clean --force

# 2. 単一レイヤーでクリーンアップ
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# 3. マルチステージビルドで必要なものだけコピー
COPY --from=builder /app/dist /app/dist
```

### 3. 定期的にクリーンアップする

```bash
# 未使用リソースの削除（安全）
docker system prune

# より積極的なクリーンアップ（注意して使用）
docker system prune -a --volumes

# 古いイメージを保持するポリシー（例: 30日以上前のもの）
docker image prune -a --filter "until=720h"

# CI/CDでの自動クリーンアップ
docker image prune -f --filter "until=24h"
```

## 開発ワークフローのベストプラクティス

### 1. ローカル開発環境を統一する

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules  # node_modules はコンテナ内のものを使用
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
    command: npm run dev  # ホットリロード有効
```

### 2. デバッグしやすい環境を用意する

```yaml
# docker-compose.override.yml（開発用）
services:
  app:
    build:
      target: development
    volumes:
      - .:/app
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js デバッガーポート
    environment:
      - DEBUG=*
    command: npm run debug
```

### 3. テストをコンテナで実行する

```bash
# ユニットテスト
docker compose run --rm app npm test

# E2Eテスト
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# カバレッジ
docker compose run --rm app npm run coverage
```

```yaml
# docker-compose.test.yml
services:
  app:
    build:
      target: test
    environment:
      - NODE_ENV=test
    command: npm test
    depends_on:
      db-test:
        condition: service_healthy

  db-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: test
    tmpfs:
      - /var/lib/postgresql/data
```

## 本番環境のベストプラクティス

### 1. 適切な再起動ポリシーを設定する

```yaml
services:
  web:
    restart: unless-stopped  # 手動停止以外は再起動

# または
services:
  web:
    restart: on-failure:5  # 失敗時に最大5回再起動
```

| ポリシー | 説明 |
|---------|------|
| no | 再起動しない（デフォルト） |
| always | 常に再起動 |
| unless-stopped | 手動停止以外は再起動 |
| on-failure[:max] | 失敗時のみ再起動 |

### 2. ログを外部に集約する

```yaml
services:
  web:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "docker.{{.Name}}"
```

### 3. メトリクスを収集する

```yaml
services:
  app:
    # Prometheusメトリクスエンドポイントを公開
    ports:
      - "9090:9090"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9091:9090"
```

### 4. グレースフルシャットダウンを実装する

```dockerfile
# シグナルを適切に処理
STOPSIGNAL SIGTERM

# Node.js の例
CMD ["node", "server.js"]
```

```javascript
// server.js
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## まとめ

ベストプラクティスのチェックリスト

**Dockerfile**
- [ ] 軽量なベースイメージを使用
- [ ] マルチステージビルドを活用
- [ ] レイヤーキャッシュを最適化
- [ ] .dockerignore を設定
- [ ] 固定バージョンのタグを使用

**セキュリティ**
- [ ] 非rootユーザーで実行
- [ ] 機密情報をイメージに含めない
- [ ] 定期的に脆弱性スキャン
- [ ] ベースイメージを最新に保つ

**Docker Compose**
- [ ] 環境ごとにファイルを分離
- [ ] 環境変数を適切に管理
- [ ] ヘルスチェックを設定
- [ ] リソース制限を設定

**本番環境**
- [ ] 適切な再起動ポリシー
- [ ] ログの外部集約
- [ ] メトリクス収集
- [ ] グレースフルシャットダウン
