# イメージの脆弱性スキャン

## 概要

このセクションでは、Dockerイメージの脆弱性スキャンについて学びます。スキャンの重要性、主要なスキャンツールの使い方、CI/CDパイプラインへの統合方法を習得します。

## 脆弱性スキャンの重要性

### なぜスキャンが必要か

![イメージの脆弱性ツリー](/images/diagrams/image-vulnerability-tree.png)

### 脆弱性の深刻度レベル

| レベル | CVSSスコア | 対応 |
|--------|-----------|------|
| CRITICAL | 9.0-10.0 | 即座に対応必須 |
| HIGH | 7.0-8.9 | 早急に対応 |
| MEDIUM | 4.0-6.9 | 計画的に対応 |
| LOW | 0.1-3.9 | 必要に応じて対応 |

## Trivy

Trivyは、Aqua Security社が開発するオープンソースの脆弱性スキャナーです。

### インストール

```bash
# macOS (Homebrew)
brew install trivy

# Ubuntu/Debian
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# Docker経由で使用
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image nginx
```

### 基本的な使い方

```bash
# イメージをスキャン
trivy image nginx:latest

# 出力例:
# nginx:latest (debian 11.6)
# Total: 142 (UNKNOWN: 0, LOW: 98, MEDIUM: 29, HIGH: 13, CRITICAL: 2)

# 特定の深刻度のみ表示
trivy image --severity HIGH,CRITICAL nginx:latest

# JSON形式で出力
trivy image --format json -o results.json nginx:latest

# 修正可能な脆弱性のみ表示
trivy image --ignore-unfixed nginx:latest
```

### 詳細なスキャン結果

```bash
# テーブル形式で詳細表示
trivy image --format table nginx:latest

# 出力例:
┌──────────────┬────────────────┬──────────┬────────────────────┬───────────────┬──────────────────────────────────────────┐
│   Library    │ Vulnerability  │ Severity │ Installed Version  │ Fixed Version │                  Title                   │
├──────────────┼────────────────┼──────────┼────────────────────┼───────────────┼──────────────────────────────────────────┤
│ openssl      │ CVE-2023-XXXX  │ CRITICAL │ 1.1.1n-0+deb11u3   │ 1.1.1n-0+deb11u4 │ OpenSSL: Buffer overflow in...        │
│ curl         │ CVE-2023-YYYY  │ HIGH     │ 7.74.0-1.3+deb11u5 │ 7.74.0-1.3+deb11u6 │ curl: Heap buffer overflow...        │
└──────────────┴────────────────┴──────────┴────────────────────┴───────────────┴──────────────────────────────────────────┘
```

### Dockerfileのスキャン

```bash
# Dockerfileの設定ミスをスキャン
trivy config ./Dockerfile

# Kubernetesマニフェストもスキャン可能
trivy config ./kubernetes/
```

## Docker Scout

Docker Scoutは、Docker公式の脆弱性スキャンツールです。Docker Desktop に統合されています。

### CLIでの使用

```bash
# Docker Hubにログイン
docker login

# イメージをスキャン
docker scout cves nginx:latest

# 詳細なレポート
docker scout cves --format markdown nginx:latest > report.md

# 推奨事項を表示
docker scout recommendations nginx:latest
```

### Docker Desktopでの使用

Docker Desktopでは、GUIから脆弱性スキャン結果を確認できます。

1. Docker Desktopを開く
2. 「Images」タブを選択
3. スキャンしたいイメージを選択
4. 「Vulnerabilities」タブで結果を確認

### クイックビュー

```bash
# 概要を素早く確認
docker scout quickview nginx:latest

# 出力例:
  Target     │  nginx:latest  │    0C     2H    12M    35L
    digest   │  a6bd71f48f68  │
  Base image │  debian:11     │    0C     1H     8M    28L

# ベースイメージの更新を推奨
docker scout compare nginx:latest --to nginx:alpine
```

## CI/CDでの自動スキャン

### GitHub Actions

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  docker-scout:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Docker Scout scan
        uses: docker/scout-action@v1
        with:
          command: cves
          image: myapp:${{ github.sha }}
          only-severities: critical,high
          exit-code: true
```

### ビルド失敗条件の設定

```yaml
# 重大な脆弱性があればビルドを失敗させる
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp:${{ github.sha }}'
    exit-code: '1'  # 脆弱性が見つかると終了コード1
    severity: 'CRITICAL'
```

## スキャン結果への対応

### 脆弱性への対処フロー

![脆弱性対応フロー](/images/diagrams/vulnerability-handling-flow.png)

### 対処の具体例

```dockerfile
# Before: 脆弱性のあるベースイメージ
FROM node:18.15.0

# After: 修正版に更新
FROM node:18.19.0

# または最新のLTSを使用
FROM node:20-alpine
```

```bash
# 特定のパッケージを更新
RUN apt-get update && apt-get upgrade -y openssl curl
```

### 脆弱性の除外設定

誤検知や受容可能なリスクを除外する設定です。

```yaml
# .trivyignore
# コメント: 誤検知のため除外
CVE-2023-XXXXX

# 受容済み（期限付き）
CVE-2023-YYYYY  # exp:2024-06-01
```

```bash
# 除外ファイルを指定してスキャン
trivy image --ignorefile .trivyignore myapp:latest
```

## ベストプラクティス

### 定期的なスキャン

```yaml
# 定期スキャンのCron設定（GitHub Actions）
on:
  schedule:
    - cron: '0 0 * * *'  # 毎日0時に実行
```

### イメージの更新戦略

1. **ベースイメージを定期的に更新**: 最新のセキュリティパッチを適用
2. **依存関係を最新に保つ**: `npm update`, `pip install --upgrade`
3. **不要なパッケージを削除**: 攻撃対象を減らす
4. **軽量イメージを使用**: Alpine, Distroless

```dockerfile
# 軽量で脆弱性の少ないベースイメージ
FROM gcr.io/distroless/nodejs20-debian12

# または Alpine
FROM node:20-alpine
```

## まとめ

- 脆弱性スキャンはコンテナセキュリティの必須プロセス
- Trivyは使いやすく包括的なオープンソーススキャナー
- Docker ScoutはDocker公式で統合されている
- CI/CDパイプラインに組み込んで自動化する
- 深刻度に応じた対処ポリシーを定義する
- 定期的なスキャンとイメージ更新で脆弱性を最小化

次のセクションでは、シークレット管理について学びます。
