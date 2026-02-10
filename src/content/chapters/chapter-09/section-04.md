# イメージの自動ビルド

## 概要

このセクションでは、Dockerイメージを自動的にビルドするための戦略、ベストプラクティス、そして様々なトリガー条件について学びます。

## 自動ビルドの基本

### 自動ビルドのトリガー

![自動ビルドトリガー](/images/diagrams/auto-build-triggers.png)

## タグ戦略

### セマンティックバージョニング

```yaml
# GitHub Actions でのタグ生成
- name: メタデータを抽出
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: myuser/myapp
    tags: |
      # ブランチ名
      type=ref,event=branch
      # PRの場合 pr-123
      type=ref,event=pr
      # タグの場合 v1.2.3
      type=semver,pattern={{version}}
      # メジャー.マイナー v1.2
      type=semver,pattern={{major}}.{{minor}}
      # メジャーのみ v1
      type=semver,pattern={{major}}
      # コミットSHA
      type=sha,prefix=
      # mainブランチの場合 latest
      type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
```

### タグ例

| イベント | 生成されるタグ |
|---------|--------------|
| Push to main | `latest`, `main`, `abc1234` |
| Push tag v1.2.3 | `1.2.3`, `1.2`, `1`, `latest` |
| Pull Request #42 | `pr-42` |
| Nightly build | `nightly`, `nightly-2024-01-15` |

## マルチステージビルドの自動化

### 効率的なDockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ベースステージ - 共通の依存関係
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 依存関係のインストール
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_modules && \
    npm ci

# ビルドステージ
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 開発ステージ
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]

# テストステージ
FROM builder AS test
ENV NODE_ENV=test
RUN npm run test:ci

# 本番ステージ
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### ステージ別ビルドのワークフロー

```yaml
# .github/workflows/build.yml
name: Build All Stages

on:
  push:
    branches: [main]

jobs:
  build-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: .
          target: development
          tags: myapp:dev

  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: .
          target: test
          tags: myapp:test

  build-prod:
    runs-on: ubuntu-latest
    needs: build-test
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: true
          tags: myapp:latest
```

## キャッシュ戦略

### GitHub Actionsのキャッシュ

```yaml
- name: ビルドしてプッシュ
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### レジストリキャッシュ

```yaml
- name: ビルドしてプッシュ
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:latest
    cache-from: type=registry,ref=myuser/myapp:cache
    cache-to: type=registry,ref=myuser/myapp:cache,mode=max
```

### ローカルキャッシュ

```yaml
- name: キャッシュを設定
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-

- name: ビルドしてプッシュ
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:latest
    cache-from: type=local,src=/tmp/.buildx-cache
    cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max

# キャッシュの移動（増加を防ぐ）
- name: キャッシュを更新
  run: |
    rm -rf /tmp/.buildx-cache
    mv /tmp/.buildx-cache-new /tmp/.buildx-cache
```

## 定期ビルド（Nightly Build）

### スケジュール設定

```yaml
# .github/workflows/nightly.yml
name: Nightly Build

on:
  schedule:
    # 毎日 UTC 0:00 (JST 9:00)
    - cron: '0 0 * * *'
  workflow_dispatch: # 手動実行も可能

jobs:
  nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 日付を取得
        id: date
        run: echo "date=$(date +'%Y-%m-%d')" >> $GITHUB_OUTPUT

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myapp:nightly
            myapp:nightly-${{ steps.date.outputs.date }}
```

## 依存関係更新時の自動ビルド

### Dependabotとの連携

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

### ベースイメージ更新の検出

```yaml
# .github/workflows/base-image-update.yml
name: Check Base Image Updates

on:
  schedule:
    - cron: '0 0 * * 1' # 毎週月曜日

jobs:
  check-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: ベースイメージの更新を確認
        id: check
        run: |
          # Dockerfileからベースイメージを取得
          BASE_IMAGE=$(grep "^FROM" Dockerfile | head -1 | awk '{print $2}')

          # 最新のダイジェストを取得
          REMOTE_DIGEST=$(docker manifest inspect $BASE_IMAGE 2>/dev/null | jq -r '.config.digest')

          # 現在使用中のダイジェストと比較
          CURRENT_DIGEST=$(cat .base-image-digest 2>/dev/null || echo "")

          if [ "$REMOTE_DIGEST" != "$CURRENT_DIGEST" ]; then
            echo "update_available=true" >> $GITHUB_OUTPUT
            echo "$REMOTE_DIGEST" > .base-image-digest
          else
            echo "update_available=false" >> $GITHUB_OUTPUT
          fi

      - name: 更新PRを作成
        if: steps.check.outputs.update_available == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          title: "chore: ベースイメージを更新"
          body: "ベースイメージの新しいバージョンが利用可能です。"
          branch: update-base-image
```

## ビルド最適化

### 並列ビルド

```yaml
jobs:
  build:
    strategy:
      matrix:
        platform: [linux/amd64, linux/arm64]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          context: .
          platforms: ${{ matrix.platform }}
          push: false
          tags: myapp:${{ matrix.platform }}
```

### ビルド引数の活用

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine
# ...
```

```yaml
- uses: docker/build-push-action@v5
  with:
    context: .
    build-args: |
      NODE_VERSION=20
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
      VCS_REF=${{ github.sha }}
```

## ビルドの品質保証

### ビルド後のテスト

```yaml
- name: ビルド
  uses: docker/build-push-action@v5
  with:
    context: .
    load: true
    tags: myapp:test

- name: コンテナ構造テスト
  run: |
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
      -v $(pwd)/container-structure-test.yaml:/test.yaml \
      gcr.io/gcp-runtimes/container-structure-test:latest \
      test --image myapp:test --config /test.yaml
```

### コンテナ構造テストの設定

```yaml
# container-structure-test.yaml
schemaVersion: 2.0.0

fileExistenceTests:
  - name: "package.jsonが存在する"
    path: "/app/package.json"
    shouldExist: true

commandTests:
  - name: "Node.jsが動作する"
    command: "node"
    args: ["--version"]
    expectedOutput: ["v20"]

metadataTest:
  exposedPorts: ["3000"]
  user: "node"
```

## まとめ

- 自動ビルドは様々なトリガーで実行可能
- セマンティックバージョニングで一貫したタグ管理
- マルチステージビルドで効率的なイメージ作成
- キャッシュ戦略でビルド時間を大幅に短縮
- 定期ビルドでベースイメージの脆弱性に対応
- ビルド後のテストで品質を保証

次のセクションでは、自動デプロイメントについて詳しく学びます。
