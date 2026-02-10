# ネットワークセキュリティ

## 概要

このセクションでは、Dockerのネットワークセキュリティについて学びます。ネットワーク分離の重要性、カスタムネットワークの活用、ポート公開の最小化、ファイアウォール設定について理解を深めます。

## ネットワーク分離の重要性

### デフォルトのbridgeネットワークの問題

![デフォルトbridgeの問題](/images/diagrams/default-bridge-problem.png)

### 理想的なネットワーク分離

![理想的なネットワーク分離](/images/diagrams/ideal-network-isolation.png)

## カスタムネットワークの活用

### ネットワークの作成

```bash
# フロントエンド用ネットワーク
docker network create frontend-network

# バックエンド用ネットワーク
docker network create backend-network

# 内部ネットワーク（外部アクセス不可）
docker network create --internal db-network

# ネットワーク一覧を確認
docker network ls
```

### コンテナをネットワークに接続

```bash
# コンテナ起動時にネットワークを指定
docker run -d --name web --network frontend-network nginx

# APIを複数のネットワークに接続
docker run -d --name api --network frontend-network myapi
docker network connect backend-network api

# DBはバックエンドネットワークのみ
docker run -d --name db --network backend-network postgres
```

### Docker Composeでのネットワーク定義

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend
    depends_on:
      - api

  api:
    build: ./api
    networks:
      - frontend
      - backend
    environment:
      DATABASE_URL: postgres://db:5432/myapp

  db:
    image: postgres:15
    networks:
      - backend
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

  redis:
    image: redis:alpine
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 外部からアクセス不可

volumes:
  db-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## ポート公開の最小化

### 不要なポート公開を避ける

```yaml
# 悪い例: すべてのサービスでポートを公開
services:
  web:
    ports:
      - "80:80"
  api:
    ports:
      - "3000:3000"  # 不要な公開
  db:
    ports:
      - "5432:5432"  # 危険！

# 良い例: 必要なサービスのみポート公開
services:
  web:
    ports:
      - "80:80"  # 外部公開が必要
  api:
    # ポート公開なし（Webからのみアクセス）
    expose:
      - "3000"  # 内部ネットワークでのみ公開
  db:
    # ポート公開なし（APIからのみアクセス）
```

### localhostへのバインド

```yaml
# 開発環境でのデバッグ用
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"  # localhostのみからアクセス可能
```

```bash
# コマンドラインでも同様
docker run -d -p 127.0.0.1:5432:5432 postgres
```

### ホストネットワークの使用を避ける

```yaml
# 悪い例: ホストネットワークを使用
services:
  app:
    network_mode: host  # コンテナの分離が無効化される

# 良い例: bridgeネットワークを使用
services:
  app:
    networks:
      - app-network
    ports:
      - "8080:8080"
```

## ネットワークポリシーの設定

### ICC（Inter-Container Communication）の無効化

デフォルトでは、同じネットワーク上のコンテナは相互に通信できます。これを制限できます。

```bash
# ICC を無効化したネットワークを作成
docker network create --driver bridge \
  --opt com.docker.network.bridge.enable_icc=false \
  secure-network
```

### 暗号化通信の有効化（Swarm Mode）

```bash
# 暗号化されたオーバーレイネットワークを作成
docker network create --driver overlay \
  --opt encrypted \
  secure-overlay
```

## ファイアウォール設定

### iptablesとの連携

DockerはLinuxのiptablesを使用してネットワークルールを管理します。

```bash
# Dockerが作成したiptablesルールを確認
sudo iptables -L -n
sudo iptables -t nat -L -n

# Dockerのiptables管理を無効化（上級者向け）
# /etc/docker/daemon.json
{
  "iptables": false
}
```

### UFWとの連携（Ubuntu）

```bash
# UFWでDockerポートを許可
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 特定のIPからのみ許可
sudo ufw allow from 10.0.0.0/8 to any port 80

# Dockerネットワークからのトラフィックを許可
sudo ufw allow from 172.17.0.0/16
```

### Docker用のファイアウォールルール

```bash
# 特定のIPアドレスのみからDockerポートへのアクセスを許可
iptables -I DOCKER-USER -i eth0 ! -s 10.0.0.0/8 -j DROP

# 特定のポートへのアクセスを制限
iptables -I DOCKER-USER -p tcp --dport 5432 ! -s 10.0.0.0/8 -j DROP
```

## TLS/SSL通信の設定

### リバースプロキシでのTLS終端

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    networks:
      - frontend

  app:
    build: .
    networks:
      - frontend
    # HTTPSは不要（内部通信）
```

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### コンテナ間のTLS通信

```yaml
# mTLS（相互TLS認証）を使用する例
services:
  api:
    build: .
    environment:
      TLS_CERT: /certs/server.crt
      TLS_KEY: /certs/server.key
      TLS_CA: /certs/ca.crt
    volumes:
      - ./certs:/certs:ro
```

## ネットワーク監視

### トラフィックの監視

```bash
# ネットワークの統計情報を確認
docker network inspect frontend-network

# コンテナのネットワーク使用状況
docker stats --format "table {{.Name}}\t{{.NetIO}}"

# tcpdumpでパケットキャプチャ
docker run --rm --net=container:myapp nicolaka/netshoot tcpdump -i eth0
```

### ネットワーク接続の確認

```bash
# コンテナからの接続テスト
docker exec myapp ping db
docker exec myapp nc -zv db 5432

# DNSの解決確認
docker exec myapp nslookup db
```

## まとめ

- デフォルトのbridgeネットワークではなく、カスタムネットワークを使用
- サービスごとにネットワークを分離し、必要な通信のみを許可
- 外部に公開するポートは最小限に抑える
- 内部サービスは`internal: true`または`expose`を使用
- ファイアウォールでDockerのポートを適切に制限
- コンテナ間通信もTLSで暗号化を検討

次のセクションでは、リソース制限について学びます。
