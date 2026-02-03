# Docker Hubの使い方

## 概要

このセクションでは、Docker Hubを使ってイメージを検索、取得、公開する方法を学びます。

## Docker Hub とは

**Docker Hub** は、Dockerイメージの公式レジストリ（リポジトリ）です。世界中の開発者がイメージを公開・共有しています。

### 主な機能

| 機能 | 説明 |
|------|------|
| イメージのホスティング | 公開/プライベートリポジトリ |
| 自動ビルド | GitHubと連携した自動イメージビルド |
| 脆弱性スキャン | セキュリティ脆弱性の検出 |
| チーム管理 | 組織でのアクセス管理 |

### イメージの種類

```
┌────────────────────────────────────────────────────┐
│                   Docker Hub                        │
├────────────────────┬───────────────────────────────┤
│   Official Images  │    Verified Publisher         │
│   (公式イメージ)    │    (認証済み公開者)            │
│                    │                               │
│   ✓ nginx          │    ✓ bitnami/nginx            │
│   ✓ mysql          │    ✓ microsoft/dotnet         │
│   ✓ redis          │    ✓ amazon/aws-cli           │
│   ✓ node           │                               │
├────────────────────┴───────────────────────────────┤
│              Community Images                       │
│              (コミュニティイメージ)                   │
│                                                     │
│              user/myapp                             │
│              developer/tool                         │
└────────────────────────────────────────────────────┘
```

## イメージの検索

### Web での検索

1. [hub.docker.com](https://hub.docker.com) にアクセス
2. 検索バーにキーワードを入力
3. フィルターで絞り込み（Official, Verified など）

### CLI での検索

```bash
# イメージを検索
docker search nginx

# 出力例:
NAME                     DESCRIPTION                     STARS   OFFICIAL
nginx                    Official build of Nginx.        19000   [OK]
bitnami/nginx            Bitnami nginx Docker Image      180
nginx/nginx-ingress      NGINX and NGINX Plus Ingress    85

# スター数でフィルタリング
docker search --filter=stars=100 mysql

# 公式イメージのみ
docker search --filter=is-official=true python
```

## イメージの取得（Pull）

### 基本的な取得

```bash
# 最新版を取得
docker pull nginx

# 特定のタグを取得
docker pull nginx:1.25

# 特定のダイジェストを取得（不変）
docker pull nginx@sha256:abc123...
```

### Pull の動作

```bash
docker pull node:20-alpine

# 出力例:
20-alpine: Pulling from library/node
c158987b0551: Pull complete     # レイヤー1
1d2f1c8edf31: Pull complete     # レイヤー2
5f0b8c5a7c3a: Pull complete     # レイヤー3
Digest: sha256:abc123...
Status: Downloaded newer image for node:20-alpine
```

すでにローカルにあるレイヤーは再ダウンロードされません。

## アカウントの作成とログイン

### アカウント作成

1. [hub.docker.com](https://hub.docker.com) にアクセス
2. 「Sign Up」をクリック
3. メールアドレス、ユーザー名、パスワードを入力
4. メール認証を完了

### CLI でログイン

```bash
# ログイン
docker login

# プロンプトが表示される:
Username: myusername
Password: ********
Login Succeeded

# ログイン状態の確認
docker info | grep Username

# ログアウト
docker logout
```

### 認証情報の保存場所

```bash
# 認証情報は以下に保存される
# Linux/Mac: ~/.docker/config.json
# Windows: %USERPROFILE%\.docker\config.json
```

## イメージの公開（Push）

### Step 1: イメージにタグを付ける

```bash
# 形式: ユーザー名/リポジトリ名:タグ
docker tag myapp:latest myusername/myapp:v1.0

# 確認
docker images myusername/myapp
```

### Step 2: Push する

```bash
# Docker Hub にプッシュ
docker push myusername/myapp:v1.0

# 出力例:
The push refers to repository [docker.io/myusername/myapp]
5f70bf18a086: Pushed
v1.0: digest: sha256:abc123... size: 1234
```

### Step 3: 公開を確認

```bash
# 別のマシンで取得できることを確認
docker pull myusername/myapp:v1.0
```

## リポジトリの管理

### プライベートリポジトリ

無料プランでは1つのプライベートリポジトリを作成できます。

```
┌─────────────────────────────────────┐
│  Repository Settings                │
├─────────────────────────────────────┤
│  Visibility:                        │
│    ○ Public  - 誰でもアクセス可能   │
│    ● Private - 招待されたユーザーのみ │
└─────────────────────────────────────┘
```

### タグの管理

```bash
# 複数のタグを付ける
docker tag myapp:latest myusername/myapp:v1.0
docker tag myapp:latest myusername/myapp:latest

# すべてのタグをプッシュ
docker push myusername/myapp:v1.0
docker push myusername/myapp:latest
```

## ベストプラクティス

### 1. 公式イメージを優先する

```bash
# ✓ 公式イメージ
docker pull nginx

# △ サードパーティイメージ（信頼性を確認）
docker pull someuser/nginx-custom
```

### 2. タグを明示的に指定する

```bash
# × latest は変更される可能性あり
docker pull nginx

# ✓ 特定のバージョンを指定
docker pull nginx:1.25.3
```

### 3. ダイジェストで固定する（本番環境）

```bash
# 最も確実（イメージの内容が変わらない）
docker pull nginx@sha256:abc123...
```

## レート制限について

Docker Hub には Pull のレート制限があります：

| 認証状態 | 制限 |
|---------|------|
| 未認証 | 100 pulls / 6時間 |
| 無料アカウント | 200 pulls / 6時間 |
| Pro/Team | 無制限 |

```bash
# 残りのレート制限を確認
docker manifest inspect nginx 2>&1 | grep -i ratelimit
```

## まとめ

- Docker Hub は公式のイメージレジストリ
- 公式イメージ（Official）を優先して使用
- `docker search` でイメージを検索
- `docker pull` でイメージを取得
- `docker push` でイメージを公開
- タグを明示的に指定することを推奨

次のセクションでは、イメージの取得・一覧・削除の操作を学びます。
