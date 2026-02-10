# シークレット管理

## 概要

このセクションでは、Dockerにおけるシークレット（機密情報）の安全な管理方法を学びます。環境変数の危険性、Docker Secrets、BuildKitのシークレットマウント、外部シークレット管理ツールとの連携について理解を深めます。

## 環境変数の危険性

環境変数は手軽ですが、シークレット管理には多くの問題があります。

### 環境変数が漏洩する経路

![環境変数のリークパス](/images/diagrams/env-variable-leak.png)

### 漏洩の具体例

```bash
# docker inspect で環境変数が見える
docker inspect mycontainer --format='{{json .Config.Env}}'
# 出力: ["DATABASE_PASSWORD=secretpassword123","API_KEY=sk-xxxxx"]

# docker history でビルド引数が見える
docker history myimage --no-trunc
# ARG で渡した値がコマンドに記録されている
```

### やってはいけない例

```dockerfile
# 悪い例 1: Dockerfileにシークレットをハードコード
ENV DATABASE_PASSWORD=secretpassword123

# 悪い例 2: ARGでシークレットを渡す
ARG API_KEY
ENV API_KEY=$API_KEY

# 悪い例 3: COPYでシークレットファイルを含める
COPY credentials.json /app/
```

## Docker Secrets（Swarm Mode）

Docker Swarmモードでは、Docker Secretsを使用してシークレットを安全に管理できます。

### シークレットの作成

```bash
# ファイルからシークレットを作成
echo "mysecretpassword" | docker secret create db_password -

# ファイルを指定して作成
docker secret create ssl_cert ./certificate.pem

# シークレットの一覧
docker secret ls

# シークレットの詳細（値は表示されない）
docker secret inspect db_password
```

### サービスでの使用

```bash
# シークレットを使用するサービスを作成
docker service create \
  --name myapp \
  --secret db_password \
  myapp:latest
```

シークレットはコンテナ内の `/run/secrets/` にマウントされます。

```bash
# コンテナ内でシークレットを読み取る
cat /run/secrets/db_password
```

### Docker Compose での使用

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

  app:
    build: .
    secrets:
      - db_password
      - api_key
    depends_on:
      - db

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true  # docker secret create で事前に作成
```

### アプリケーションでの読み取り

```javascript
// Node.js でシークレットを読み取る例
const fs = require('fs');

function getSecret(secretName) {
  const secretPath = `/run/secrets/${secretName}`;
  try {
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    // フォールバック: 環境変数から読み取り（開発環境用）
    console.warn(`Secret file not found, falling back to env: ${secretName}`);
    return process.env[secretName.toUpperCase()];
  }
}

const dbPassword = getSecret('db_password');
```

## BuildKit シークレットマウント

Docker BuildKitを使用すると、ビルド時のみシークレットにアクセスでき、イメージレイヤーに残りません。

### 基本的な使い方

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

# package.jsonをコピー
COPY package*.json ./

# シークレットを使用してプライベートレジストリからインストール
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci

COPY . .

CMD ["node", "server.js"]
```

### ビルド時にシークレットを渡す

```bash
# シークレットファイルを指定してビルド
docker build --secret id=npm_token,src=./.npm_token .

# 環境変数から渡す
docker build --secret id=npm_token,env=NPM_TOKEN .
```

### SSH鍵の使用

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.21-alpine

RUN apk add --no-cache git openssh-client

# SSHを使用してプライベートリポジトリをクローン
RUN --mount=type=ssh \
    mkdir -p -m 0700 ~/.ssh && \
    ssh-keyscan github.com >> ~/.ssh/known_hosts && \
    git clone git@github.com:myorg/private-repo.git /app

WORKDIR /app
RUN go build -o main .

CMD ["./main"]
```

```bash
# SSH agent を使用してビルド
eval $(ssh-agent)
ssh-add ~/.ssh/id_rsa
docker build --ssh default .
```

## 外部シークレット管理ツール

### HashiCorp Vault

```yaml
# docker-compose.yml
version: '3.8'

services:
  vault:
    image: hashicorp/vault:latest
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK

  app:
    build: .
    environment:
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: myroot  # 本番では使用しない
    depends_on:
      - vault
```

```javascript
// Node.js から Vault にアクセス
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  const result = await vault.read(`secret/data/${path}`);
  return result.data.data;
}

// 使用例
const dbCredentials = await getSecret('database/credentials');
```

### AWS Secrets Manager

```yaml
# docker-compose.yml
services:
  app:
    build: .
    environment:
      AWS_REGION: ap-northeast-1
    # AWS認証情報は環境変数またはIAMロールで提供
```

```javascript
// Node.js から AWS Secrets Manager にアクセス
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

async function getSecret(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

// 使用例
const dbCredentials = await getSecret('myapp/database');
```

## ベストプラクティス

### シークレット管理のチェックリスト

![シークレット管理チェックリスト](/images/diagrams/secret-management-checklist.png)

### .dockerignore の設定

```
# .dockerignore
.env
.env.*
*.pem
*.key
credentials.json
secrets/
.aws/
.ssh/
```

### .gitignore の設定

```
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
credentials.json
```

### 開発環境と本番環境の分離

```yaml
# docker-compose.yml（開発環境）
version: '3.8'

services:
  app:
    build: .
    env_file:
      - .env.development  # 開発用のダミーシークレット
```

```yaml
# docker-compose.prod.yml（本番環境）
version: '3.8'

services:
  app:
    image: myapp:latest
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    external: true
  api_key:
    external: true
```

## まとめ

- 環境変数でのシークレット管理は漏洩リスクが高い
- Docker Secretsは Swarm モードでシークレットを安全に管理
- BuildKitのシークレットマウントはビルド時のみシークレットにアクセス
- 本番環境では外部シークレット管理ツール（Vault, AWS Secrets Manager）を検討
- .dockerignore と .gitignore でシークレットファイルを確実に除外
- シークレットがイメージやログに含まれていないことを確認

次のセクションでは、ネットワークセキュリティについて学びます。
