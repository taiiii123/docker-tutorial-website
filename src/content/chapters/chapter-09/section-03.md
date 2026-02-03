# プライベートレジストリ

## 概要

このセクションでは、プライベートDockerレジストリの構築方法と、様々なレジストリサービスの比較について学びます。

## プライベートレジストリが必要な理由

### Docker Hubの制限

| 制限事項 | 内容 |
|---------|------|
| プルレート制限 | 匿名: 100回/6時間、認証済み: 200回/6時間 |
| プライベートリポジトリ | 無料プラン: 1つまで |
| イメージ保持期間 | 無料プラン: 6ヶ月アクセスなしで削除 |

### プライベートレジストリのメリット

- 社内ネットワークでの高速アクセス
- 機密性の高いイメージの管理
- プルレート制限なし
- コンプライアンス要件への対応
- カスタムアクセス制御

## Docker Registryを使った構築

### 基本的なセットアップ

```yaml
# docker-compose.yml
services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
    environment:
      REGISTRY_STORAGE_DELETE_ENABLED: "true"

volumes:
  registry-data:
```

### 起動と動作確認

```bash
# レジストリを起動
docker compose up -d

# 動作確認
curl http://localhost:5000/v2/_catalog
# 出力: {"repositories":[]}

# テストイメージをプッシュ
docker pull alpine:latest
docker tag alpine:latest localhost:5000/my-alpine:latest
docker push localhost:5000/my-alpine:latest

# カタログを確認
curl http://localhost:5000/v2/_catalog
# 出力: {"repositories":["my-alpine"]}
```

## TLS/SSL対応

### 自己署名証明書の作成

```bash
# 証明書用のディレクトリを作成
mkdir -p certs

# 自己署名証明書を生成
openssl req -newkey rsa:4096 -nodes -sha256 \
  -keyout certs/domain.key \
  -x509 -days 365 \
  -out certs/domain.crt \
  -subj "/CN=registry.example.com"
```

### TLS対応のdocker-compose.yml

```yaml
# docker-compose.yml
services:
  registry:
    image: registry:2
    ports:
      - "443:443"
    volumes:
      - registry-data:/var/lib/registry
      - ./certs:/certs:ro
    environment:
      REGISTRY_HTTP_ADDR: 0.0.0.0:443
      REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
      REGISTRY_HTTP_TLS_KEY: /certs/domain.key

volumes:
  registry-data:
```

## 認証の設定

### Basic認証

```bash
# htpasswdファイルを作成
mkdir -p auth
docker run --rm --entrypoint htpasswd \
  httpd:2 -Bbn admin secretpassword > auth/htpasswd
```

```yaml
# docker-compose.yml
services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
      - ./auth:/auth:ro
    environment:
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd

volumes:
  registry-data:
```

### 認証してプッシュ

```bash
# ログイン
docker login localhost:5000
# Username: admin
# Password: secretpassword

# イメージをプッシュ
docker push localhost:5000/my-alpine:latest
```

## 本番環境向け構成

### 完全な設定例

```yaml
# docker-compose.yml
services:
  registry:
    image: registry:2
    restart: always
    ports:
      - "443:443"
    volumes:
      - registry-data:/var/lib/registry
      - ./certs:/certs:ro
      - ./auth:/auth:ro
      - ./config.yml:/etc/docker/registry/config.yml:ro
    environment:
      REGISTRY_HTTP_ADDR: 0.0.0.0:443
      REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
      REGISTRY_HTTP_TLS_KEY: /certs/domain.key

  registry-ui:
    image: joxit/docker-registry-ui:main
    restart: always
    ports:
      - "8080:80"
    environment:
      - REGISTRY_TITLE=My Private Registry
      - REGISTRY_URL=https://registry:443
      - SINGLE_REGISTRY=true
    depends_on:
      - registry

volumes:
  registry-data:
```

### レジストリ設定ファイル

```yaml
# config.yml
version: 0.1
log:
  level: info
  formatter: json

storage:
  filesystem:
    rootdirectory: /var/lib/registry
  delete:
    enabled: true
  cache:
    blobdescriptor: inmemory

http:
  addr: :443
  headers:
    X-Content-Type-Options: [nosniff]
  tls:
    certificate: /certs/domain.crt
    key: /certs/domain.key

auth:
  htpasswd:
    realm: basic-realm
    path: /auth/htpasswd

health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
```

## クラウドレジストリサービス

### 主要なサービス比較

| サービス | 提供元 | 特徴 |
|---------|-------|------|
| Amazon ECR | AWS | IAM統合、マルチリージョン |
| Google Artifact Registry | GCP | 高速プル、脆弱性スキャン |
| Azure Container Registry | Azure | AAD統合、ジオレプリケーション |
| GitHub Container Registry | GitHub | GitHubとの統合 |
| Docker Hub | Docker | 最も普及、豊富な公式イメージ |

### Amazon ECRの使用例

```bash
# AWS CLIでログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# リポジトリを作成
aws ecr create-repository --repository-name myapp

# イメージをプッシュ
docker tag myapp:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:latest
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/myapp:latest
```

### Google Artifact Registryの使用例

```bash
# gcloudでログイン
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# イメージをプッシュ
docker tag myapp:latest asia-northeast1-docker.pkg.dev/my-project/my-repo/myapp:latest
docker push asia-northeast1-docker.pkg.dev/my-project/my-repo/myapp:latest
```

## ミラーレジストリの設定

### Docker Hubのミラー

```yaml
# config.yml
proxy:
  remoteurl: https://registry-1.docker.io
  username: [docker hub username]
  password: [docker hub password/token]
```

### Dockerデーモンの設定

```json
{
  "registry-mirrors": ["https://mirror.example.com"]
}
```

## イメージの管理

### ガベージコレクション

```bash
# 未使用レイヤーを削除
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml

# ドライラン（削除されるものを確認）
docker exec registry bin/registry garbage-collect --dry-run /etc/docker/registry/config.yml
```

### イメージの削除

```bash
# タグの一覧を取得
curl -X GET https://registry.example.com/v2/myapp/tags/list

# マニフェストのダイジェストを取得
DIGEST=$(curl -I -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  https://registry.example.com/v2/myapp/manifests/v1.0 | \
  grep Docker-Content-Digest | awk '{print $2}' | tr -d '\r')

# マニフェストを削除
curl -X DELETE https://registry.example.com/v2/myapp/manifests/${DIGEST}

# ガベージコレクションを実行
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml
```

## セキュリティのベストプラクティス

### アクセス制御チェックリスト

```
セキュリティ確認項目:
□ TLS/SSL が有効化されている
□ 認証が必須になっている
□ ネットワークアクセスが制限されている
□ イメージの脆弱性スキャンが設定されている
□ アクセスログが有効化されている
□ 定期的なバックアップが設定されている
□ 古いイメージの自動削除ポリシーがある
```

### ネットワーク分離

```yaml
# docker-compose.yml
services:
  registry:
    image: registry:2
    networks:
      - internal
      - proxy
    # ...

networks:
  internal:
    internal: true
  proxy:
    external: true
```

## まとめ

- Docker Registryで簡単にプライベートレジストリを構築可能
- TLS/SSLと認証で本番環境のセキュリティを確保
- クラウドサービスを利用すると運用負荷を軽減
- ミラーレジストリでDocker Hubの制限を回避
- 定期的なガベージコレクションでストレージを管理

次のセクションでは、イメージの自動ビルドについて詳しく学びます。
