# CI/CDパイプラインでのDocker

## 概要

このセクションでは、CI/CD（継続的インテグレーション/継続的デリバリー）パイプラインにおけるDockerの役割と活用方法について学びます。

## CI/CDとは

**CI/CD**は、ソフトウェア開発における自動化されたワークフローです。

| 用語 | 正式名称 | 説明 |
|------|----------|------|
| CI | Continuous Integration | コードの統合とテストを自動化 |
| CD | Continuous Delivery | デプロイ可能な状態を維持 |
| CD | Continuous Deployment | 本番環境への自動デプロイ |

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  コード  │ → │  ビルド  │ → │  テスト  │ → │ ステージ │ → │  本番   │
│  コミット │    │         │    │         │    │  ング   │    │  環境   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                         CI/CDパイプライン
```

## DockerがCI/CDにもたらす価値

### 1. 環境の一貫性

Dockerを使うことで、開発・テスト・本番環境の差異を排除できます。

```dockerfile
# 開発からテスト、本番まで同じイメージを使用
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS test
COPY . .
RUN npm test

FROM base AS production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 2. 再現性のあるビルド

同じDockerfileから常に同じ結果を得られます。

```bash
# ビルドの再現性を確保
docker build --no-cache -t myapp:${GIT_COMMIT_SHA} .
```

### 3. 高速なテスト実行

コンテナは秒単位で起動するため、テストの並列実行が効率的です。

```yaml
# 並列テスト実行の例
test:
  parallel:
    - docker run myapp:test npm run test:unit
    - docker run myapp:test npm run test:integration
    - docker run myapp:test npm run test:e2e
```

## CI/CDパイプラインの基本構成

### 典型的なパイプラインステージ

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD パイプライン                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────────────┐  │
│  │ ソース  │ → │ ビルド  │ → │  テスト  │ → │ イメージ公開    │  │
│  │ チェック │   │  Stage  │   │  Stage  │   │    Stage       │  │
│  └─────────┘   └─────────┘   └─────────┘   └─────────────────┘  │
│       │             │             │                │            │
│       ▼             ▼             ▼                ▼            │
│   - lint        - docker     - 単体テスト    - レジストリに     │
│   - format       build       - 統合テスト      push            │
│   - security                 - E2Eテスト    - タグ付け         │
│     scan                                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │ ステージング     │ → │  承認/レビュー   │ → │    本番      │  │
│  │   デプロイ       │   │                 │   │   デプロイ   │  │
│  └─────────────────┘   └─────────────────┘   └───────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### パイプライン定義の例

```yaml
# .ci/pipeline.yml の例
stages:
  - name: lint
    script:
      - docker run --rm -v $(pwd):/app myapp:dev npm run lint

  - name: build
    script:
      - docker build -t myapp:${CI_COMMIT_SHA} .

  - name: test
    script:
      - docker run --rm myapp:${CI_COMMIT_SHA} npm test

  - name: push
    script:
      - docker tag myapp:${CI_COMMIT_SHA} registry.example.com/myapp:${CI_COMMIT_SHA}
      - docker push registry.example.com/myapp:${CI_COMMIT_SHA}
    only:
      - main

  - name: deploy-staging
    script:
      - kubectl set image deployment/myapp myapp=registry.example.com/myapp:${CI_COMMIT_SHA}
    environment: staging
    only:
      - main
```

## Dockerを使ったテスト戦略

### テスト用のDocker Compose

```yaml
# docker-compose.test.yml
services:
  app:
    build:
      context: .
      target: test
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgres://test:test@db:5432/testdb
      - REDIS_URL=redis://redis:6379

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    tmpfs:
      - /var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```

### テスト実行スクリプト

```bash
#!/bin/bash
# scripts/run-tests.sh

set -e

echo "テスト環境を起動中..."
docker compose -f docker-compose.test.yml up -d db redis

echo "データベースの準備を待機中..."
docker compose -f docker-compose.test.yml run --rm app npm run db:migrate

echo "テストを実行中..."
docker compose -f docker-compose.test.yml run --rm app npm test

echo "テスト環境をクリーンアップ中..."
docker compose -f docker-compose.test.yml down -v

echo "テスト完了!"
```

## セキュリティスキャンの統合

### イメージの脆弱性スキャン

```yaml
# CI/CDパイプラインでのセキュリティスキャン
security-scan:
  stage: test
  script:
    # Trivyを使用した脆弱性スキャン
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest image --severity HIGH,CRITICAL myapp:${CI_COMMIT_SHA}
```

### スキャン結果の例

```bash
# Trivyの出力例
myapp:latest (alpine 3.18.4)
============================
Total: 2 (HIGH: 1, CRITICAL: 1)

┌──────────────┬────────────────┬──────────┬─────────────────┐
│   Library    │ Vulnerability  │ Severity │  Fixed Version  │
├──────────────┼────────────────┼──────────┼─────────────────┤
│ openssl      │ CVE-2024-XXXX  │ CRITICAL │ 3.1.4-r1        │
│ curl         │ CVE-2024-YYYY  │ HIGH     │ 8.5.0-r0        │
└──────────────┴────────────────┴──────────┴─────────────────┘
```

## キャッシュ戦略

### BuildKit とは

**BuildKit** は Docker のビルドエンジンの改良版で、以下の機能を提供します：

| 機能 | 説明 |
|------|------|
| 並列ビルド | 独立したステージを同時にビルド |
| 高度なキャッシュ | リモートキャッシュ、インラインキャッシュ対応 |
| シークレット管理 | ビルド時の機密情報を安全に扱う |
| SSH転送 | プライベートリポジトリへのアクセス |

**BuildKit の有効化方法:**

```bash
# 方法1: 環境変数で有効化
export DOCKER_BUILDKIT=1
docker build -t myapp .

# 方法2: docker buildx を使用（推奨）
docker buildx build -t myapp .

# 方法3: Docker Daemon の設定（永続化）
# /etc/docker/daemon.json
{
  "features": {
    "buildkit": true
  }
}
```

> **注意**: Docker Desktop 23.0 以降では BuildKit がデフォルトで有効です。

### docker build vs docker buildx build

| コマンド | ビルドエンジン | 主な用途 |
|---------|--------------|---------|
| `docker build` | レガシー または BuildKit | 基本的なビルド |
| `docker buildx build` | BuildKit（必須） | マルチプラットフォーム、高度なキャッシュ |

### ビルドキャッシュの活用

```yaml
# BuildKitキャッシュを使用
build:
  script:
    # BuildKitが有効になっていることを確認
    - export DOCKER_BUILDKIT=1
    - docker buildx build \
        --cache-from type=registry,ref=registry.example.com/myapp:cache \
        --cache-to type=registry,ref=registry.example.com/myapp:cache,mode=max \
        -t myapp:${CI_COMMIT_SHA} \
        --push .
```

### レイヤーキャッシュの最適化

```dockerfile
# キャッシュを最大限活用するDockerfile
FROM node:20-alpine AS deps
WORKDIR /app
# package.jsonは頻繁に変更されないのでキャッシュが効く
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# ソースコードは頻繁に変更される
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

## CI/CDプラットフォームの比較

| プラットフォーム | Docker対応 | 特徴 |
|-----------------|-----------|------|
| GitHub Actions | 優秀 | GitHubとの統合、豊富なAction |
| GitLab CI | 優秀 | Docker-in-Docker対応 |
| Jenkins | 良好 | 高いカスタマイズ性 |
| CircleCI | 優秀 | 高速なビルド、Docker Layer Caching |
| AWS CodeBuild | 良好 | AWSサービスとの統合 |

## まとめ

- CI/CDパイプラインにDockerを組み込むことで環境の一貫性を確保
- マルチステージビルドでテスト・本番イメージを効率的に作成
- セキュリティスキャンをパイプラインに統合して脆弱性を早期発見
- キャッシュ戦略でビルド時間を短縮
- Docker Composeでテスト環境を簡単に構築

次のセクションでは、GitHub ActionsでのDocker利用について詳しく学びます。
