# GitHub ActionsでのDocker利用

## 概要

このセクションでは、GitHub Actionsを使用してDockerイメージのビルド、テスト、プッシュを自動化する方法を学びます。

## GitHub Actionsとは

**GitHub Actions**は、GitHubに組み込まれたCI/CDプラットフォームです。リポジトリ内のイベント（push、pull requestなど）をトリガーにワークフローを自動実行できます。

### 基本概念

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Workflow (.github/workflows/*.yml)                             │
│  └── Job (並列実行可能な処理単位)                                 │
│      └── Step (順次実行されるタスク)                              │
│          └── Action (再利用可能な処理)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 基本的なDockerビルドワークフロー

### 最小構成

```yaml
# .github/workflows/docker-build.yml
name: Docker Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: Dockerイメージをビルド
        run: docker build -t myapp:${{ github.sha }} .

      - name: テストを実行
        run: docker run --rm myapp:${{ github.sha }} npm test
```

## Docker Hubへの自動プッシュ

### シークレットの設定

リポジトリの Settings > Secrets and variables > Actions で以下を設定：

| シークレット名 | 説明 |
|--------------|------|
| `DOCKERHUB_USERNAME` | Docker Hubのユーザー名 |
| `DOCKERHUB_TOKEN` | Docker Hubのアクセストークン |

### ワークフロー定義

```yaml
# .github/workflows/docker-publish.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: Docker Buildxをセットアップ
        uses: docker/setup-buildx-action@v3

      - name: Docker Hubにログイン
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: メタデータを抽出
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=

      - name: ビルドしてプッシュ
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## GitHub Container Registry (GHCR) への公開

### GHCRを使用するメリット

- GitHubアカウントで認証可能
- プライベートリポジトリと連携
- GitHub Packagesと統合

### ワークフロー定義

```yaml
# .github/workflows/ghcr-publish.yml
name: Publish to GHCR

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: Docker Buildxをセットアップ
        uses: docker/setup-buildx-action@v3

      - name: GHCRにログイン
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: メタデータを抽出
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: ビルドしてプッシュ
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

## マルチプラットフォームビルド

### ARM64とAMD64の両方に対応

```yaml
# .github/workflows/multi-platform.yml
name: Multi-Platform Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: リポジトリをチェックアウト
        uses: actions/checkout@v4

      - name: QEMUをセットアップ
        uses: docker/setup-qemu-action@v3

      - name: Docker Buildxをセットアップ
        uses: docker/setup-buildx-action@v3

      - name: Docker Hubにログイン
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: マルチプラットフォームビルド
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            myuser/myapp:${{ github.ref_name }}
            myuser/myapp:latest
```

## テストとセキュリティスキャンの統合

### 完全なCI/CDワークフロー

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # 静的解析
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lintチェック
        run: |
          docker build --target lint -t myapp:lint .
          docker run --rm myapp:lint

  # ユニットテスト
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: テスト実行
        run: |
          docker compose -f docker-compose.test.yml up -d
          docker compose -f docker-compose.test.yml run --rm app npm test
          docker compose -f docker-compose.test.yml down -v

  # ビルド
  build:
    runs-on: ubuntu-latest
    needs: test
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Docker Buildxをセットアップ
        uses: docker/setup-buildx-action@v3

      - name: メタデータを抽出
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}

      - name: ビルド
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: イメージを保存
        run: docker save ${{ steps.meta.outputs.tags }} > image.tar

      - name: アーティファクトをアップロード
        uses: actions/upload-artifact@v4
        with:
          name: docker-image
          path: image.tar

  # セキュリティスキャン
  security-scan:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: アーティファクトをダウンロード
        uses: actions/download-artifact@v4
        with:
          name: docker-image

      - name: イメージを読み込み
        run: docker load < image.tar

      - name: Trivyでスキャン
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/${{ github.repository }}:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: 結果をアップロード
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # プッシュ（mainブランチのみ）
  push:
    runs-on: ubuntu-latest
    needs: [build, security-scan]
    if: github.ref == 'refs/heads/main'
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: GHCRにログイン
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: アーティファクトをダウンロード
        uses: actions/download-artifact@v4
        with:
          name: docker-image

      - name: イメージを読み込み
        run: docker load < image.tar

      - name: イメージをプッシュ
        run: docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
```

## 便利なActionsの紹介

### よく使用されるDocker関連Actions

| Action | 用途 |
|--------|------|
| `docker/setup-buildx-action` | BuildKitを有効化 |
| `docker/login-action` | レジストリにログイン |
| `docker/metadata-action` | タグ・ラベルを自動生成 |
| `docker/build-push-action` | ビルドとプッシュ |
| `docker/setup-qemu-action` | マルチプラットフォーム対応 |
| `aquasecurity/trivy-action` | 脆弱性スキャン |

## ワークフローのデバッグ

### デバッグログの有効化

```yaml
# リポジトリのSecrets/Variablesで設定
# ACTIONS_STEP_DEBUG: true
# ACTIONS_RUNNER_DEBUG: true
```

### ローカルでのワークフロー実行

```bash
# actを使用してローカルでテスト
# https://github.com/nektos/act
act -j build
```

## まとめ

- GitHub Actionsは強力なCI/CDプラットフォーム
- `docker/build-push-action`で簡単にビルドとプッシュを自動化
- GHCRを使えばGitHubエコシステム内で完結
- マルチプラットフォームビルドでARM対応も容易
- セキュリティスキャンをパイプラインに組み込むことが重要

次のセクションでは、プライベートレジストリの構築と運用について学びます。
