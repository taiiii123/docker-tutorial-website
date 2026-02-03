# 自動デプロイメント

## 概要

このセクションでは、Dockerイメージの自動デプロイメント戦略、デプロイパイプラインの構築、そしてゼロダウンタイムデプロイの実現方法について学びます。

## デプロイメント戦略

### 主要な戦略の比較

```
┌─────────────────────────────────────────────────────────────────┐
│                  デプロイメント戦略                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ローリングアップデート                                          │
│  ┌───┐ ┌───┐ ┌───┐    ┌───┐ ┌───┐ ┌───┐    ┌───┐ ┌───┐ ┌───┐  │
│  │v1 │ │v1 │ │v1 │ → │v2 │ │v1 │ │v1 │ → │v2 │ │v2 │ │v2 │  │
│  └───┘ └───┘ └───┘    └───┘ └───┘ └───┘    └───┘ └───┘ └───┘  │
│                                                                 │
│  ブルー/グリーンデプロイ                                         │
│  Blue (v1)  ─────────────→  Green (v2)                         │
│  ┌───┐ ┌───┐ ┌───┐        ┌───┐ ┌───┐ ┌───┐                   │
│  │v1 │ │v1 │ │v1 │  切替  │v2 │ │v2 │ │v2 │                   │
│  └───┘ └───┘ └───┘    →   └───┘ └───┘ └───┘                   │
│                                                                 │
│  カナリアデプロイ                                                │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐    10%  →  50%  →  100%              │
│  │v1 │ │v1 │ │v1 │ │v2 │    の段階的な切り替え                  │
│  └───┘ └───┘ └───┘ └───┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| 戦略 | メリット | デメリット |
|-----|---------|----------|
| ローリング | リソース効率が良い | 一時的に混在状態 |
| ブルー/グリーン | 即座にロールバック可能 | リソースが2倍必要 |
| カナリア | リスクを最小化 | 複雑な設定が必要 |

## Docker Composeでの自動デプロイ

### 基本的なデプロイスクリプト

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# 設定
IMAGE="myapp"
TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "デプロイ開始: ${IMAGE}:${TAG}"

# 最新イメージをプル
docker compose -f ${COMPOSE_FILE} pull

# ローリングアップデートで更新
docker compose -f ${COMPOSE_FILE} up -d --no-deps --scale app=3

# 古いコンテナを削除
docker system prune -f

echo "デプロイ完了!"
```

### 本番用docker-compose.yml

```yaml
# docker-compose.prod.yml
services:
  app:
    image: myregistry/myapp:${IMAGE_TAG:-latest}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    environment:
      - NODE_ENV=production
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## GitHub Actionsでの自動デプロイ

### SSH経由でのデプロイ

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: イメージをビルドしてプッシュ
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myregistry/myapp:${{ github.ref_name }}
            myregistry/myapp:latest

      - name: サーバーにデプロイ
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/myapp
            export IMAGE_TAG=${{ github.ref_name }}
            docker compose pull
            docker compose up -d
            docker system prune -f
```

### Webhookによるデプロイ

```yaml
# .github/workflows/webhook-deploy.yml
name: Trigger Deploy Webhook

on:
  workflow_run:
    workflows: ["Build and Push"]
    types:
      - completed
    branches: [main]

jobs:
  trigger-deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: デプロイWebhookを呼び出し
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"image_tag": "${{ github.sha }}"}' \
            ${{ secrets.DEPLOY_WEBHOOK_URL }}
```

## Kubernetesへのデプロイ

### マニフェストの自動更新

```yaml
# .github/workflows/k8s-deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: イメージをビルドしてプッシュ
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: myregistry/myapp:${{ github.sha }}

      - name: kubectlをセットアップ
        uses: azure/setup-kubectl@v4

      - name: kubeconfigを設定
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > ~/.kube/config

      - name: イメージを更新
        run: |
          kubectl set image deployment/myapp \
            myapp=myregistry/myapp:${{ github.sha }} \
            --record

      - name: ロールアウト状態を確認
        run: |
          kubectl rollout status deployment/myapp --timeout=300s
```

### Kustomizeを使用した環境別デプロイ

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myregistry/myapp:latest
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: production
resources:
  - ../../base
images:
  - name: myregistry/myapp
    newTag: v1.2.3
replicas:
  - name: myapp
    count: 5
```

## ヘルスチェックとロールバック

### アプリケーションのヘルスエンドポイント

```typescript
// src/health.ts
import express from 'express';

const router = express.Router();

// ライブネスチェック（コンテナが生きているか）
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// レディネスチェック（リクエストを受け付けられるか）
router.get('/health/ready', async (req, res) => {
  try {
    // データベース接続確認
    await db.query('SELECT 1');
    // 外部サービス確認
    await checkExternalServices();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

export default router;
```

### 自動ロールバック

```yaml
# .github/workflows/deploy-with-rollback.yml
name: Deploy with Rollback

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 現在のバージョンを記録
        id: current
        run: |
          CURRENT=$(kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}')
          echo "image=${CURRENT}" >> $GITHUB_OUTPUT

      - name: 新しいバージョンをデプロイ
        run: |
          kubectl set image deployment/myapp myapp=myregistry/myapp:${{ github.sha }}

      - name: デプロイ状態を確認
        id: rollout
        run: |
          if ! kubectl rollout status deployment/myapp --timeout=300s; then
            echo "status=failed" >> $GITHUB_OUTPUT
          else
            echo "status=success" >> $GITHUB_OUTPUT
          fi

      - name: ロールバック（失敗時）
        if: steps.rollout.outputs.status == 'failed'
        run: |
          echo "デプロイ失敗、ロールバック実行中..."
          kubectl rollout undo deployment/myapp
          kubectl rollout status deployment/myapp --timeout=300s
          exit 1
```

## 環境別のデプロイ設定

### GitHub Environmentsの活用

```yaml
# .github/workflows/multi-env-deploy.yml
name: Multi-Environment Deploy

on:
  push:
    branches: [main, develop]
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: myregistry/myapp:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: ステージングにデプロイ
        run: |
          # ステージング環境へのデプロイ
          echo "Deploying to staging..."

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    if: github.event_name == 'release'
    steps:
      - name: 本番にデプロイ
        run: |
          # 本番環境へのデプロイ
          echo "Deploying to production..."
```

## デプロイ通知

### Slackへの通知

```yaml
- name: Slack通知（成功）
  if: success()
  uses: slackapi/slack-github-action@v1.26.0
  with:
    payload: |
      {
        "text": "デプロイ成功",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*デプロイ成功* :white_check_mark:\n環境: production\nバージョン: ${{ github.sha }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

- name: Slack通知（失敗）
  if: failure()
  uses: slackapi/slack-github-action@v1.26.0
  with:
    payload: |
      {
        "text": "デプロイ失敗",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*デプロイ失敗* :x:\n環境: production\n詳細: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## デプロイのベストプラクティス

### チェックリスト

```
デプロイ前:
□ すべてのテストが通過している
□ セキュリティスキャンに問題がない
□ ステージング環境で動作確認済み
□ ロールバック手順が準備されている
□ モニタリングが設定されている

デプロイ中:
□ ヘルスチェックが正常に応答する
□ エラーレートが急増していない
□ レスポンスタイムが正常範囲内

デプロイ後:
□ アプリケーションログを確認
□ メトリクスを確認
□ アラートが発生していない
```

## まとめ

- デプロイ戦略は要件に応じて選択（ローリング、ブルー/グリーン、カナリア）
- ヘルスチェックとロールバック機能で安全なデプロイを実現
- GitHub Environmentsで環境別の承認フローを設定
- 自動通知でデプロイ状況をチームに共有
- モニタリングと組み合わせて問題を早期発見

これでChapter 9「CI/CD」の学習は完了です。次のチャプターでは、Dockerのセキュリティについて学びます。
