# DockerからKubernetesへ

## 概要

このセクションでは、Docker ComposeとKubernetesの違いを理解し、Dockerで培った知識をKubernetesにどう活かせるかを学びます。

## Docker Compose と Kubernetes の比較

### 用途の違い

| 項目 | Docker Compose | Kubernetes |
|------|----------------|------------|
| 主な用途 | ローカル開発、小規模環境 | 本番環境、大規模運用 |
| 実行環境 | 単一ホスト | 複数ノードのクラスター |
| スケーリング | 手動（replicas指定） | 自動スケーリング対応 |
| 障害対応 | 限定的 | 自己修復機能 |
| 学習コスト | 低い | 高い |

### 設定ファイルの比較

**Docker Compose の場合：**

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:1.25
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    environment:
      - NGINX_HOST=localhost
    depends_on:
      - api

  api:
    image: myapi:latest
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db

  db:
    image: postgres:15
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  db-data:
```

**Kubernetes の場合：**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          env:
            - name: NGINX_HOST
              value: "localhost"
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: LoadBalancer
```

## 概念の対応関係

Docker/Docker Composeの概念は、Kubernetesでは以下のように対応します。

### コンテナとPod

![Docker コンテナ vs Kubernetes Pod](/images/diagrams/container-vs-pod.png)

### サービスとService

![Docker Compose vs Kubernetes Service](/images/diagrams/compose-vs-k8s-service.png)

### 対応表

| Docker/Compose | Kubernetes | 説明 |
|----------------|------------|------|
| Container | Pod | 実行単位（Podは1つ以上のコンテナを含む） |
| docker-compose.yml | Deployment + Service | アプリケーション定義 |
| image | container.image | コンテナイメージ |
| ports | Service + containerPort | ポート公開 |
| volumes | PersistentVolume/ConfigMap | データ永続化・設定 |
| environment | env / ConfigMap / Secret | 環境変数 |
| networks | Service / NetworkPolicy | ネットワーク設定 |
| depends_on | initContainers / readinessProbe | 依存関係 |
| replicas | spec.replicas | レプリカ数 |
| restart | restartPolicy | 再起動ポリシー |

## 設定の変換例

### 環境変数

**Docker Compose：**

```yaml
services:
  app:
    environment:
      - DB_HOST=localhost
      - DB_PORT=5432
```

**Kubernetes：**

```yaml
# 直接指定
spec:
  containers:
    - name: app
      env:
        - name: DB_HOST
          value: "localhost"
        - name: DB_PORT
          value: "5432"
```

```yaml
# ConfigMapを使用
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "localhost"
  DB_PORT: "5432"
---
spec:
  containers:
    - name: app
      envFrom:
        - configMapRef:
            name: app-config
```

### ボリューム

**Docker Compose：**

```yaml
services:
  db:
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

**Kubernetes：**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: db
          volumeMounts:
            - name: db-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: db-storage
          persistentVolumeClaim:
            claimName: db-data
```

### ネットワーク

**Docker Compose：**

```yaml
services:
  web:
    ports:
      - "80:80"
  api:
    # 内部通信のみ（ポート公開なし）
```

**Kubernetes：**

```yaml
# 外部公開用Service
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: LoadBalancer  # 外部公開
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
---
# 内部通信用Service
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP  # クラスター内部のみ
  selector:
    app: api
  ports:
    - port: 3000
```

## 移行のメリット・デメリット

### メリット

| メリット | 説明 |
|---------|------|
| スケーラビリティ | 負荷に応じた自動スケーリング |
| 高可用性 | 複数ノードでの冗長構成 |
| 自己修復 | 障害時の自動復旧 |
| ローリングアップデート | ダウンタイムなしの更新 |
| 豊富なエコシステム | Helm, Istio, Prometheusなど |

### デメリット

| デメリット | 説明 |
|-----------|------|
| 学習コスト | 概念と設定が複雑 |
| 運用コスト | クラスターの管理が必要 |
| オーバーヘッド | 小規模なら過剰な場合も |
| 設定ファイル | YAMLが冗長になりがち |

## 移行パターン

### パターン1: 段階的移行

![Docker から Kubernetes への移行フロー](/images/diagrams/migration-flow.png)

### パターン2: Kompose を使った変換

`kompose` は Docker Compose ファイルを Kubernetes マニフェストに変換するツールです。

```bash
# komposeのインストール
# macOS
brew install kompose

# Windows (Chocolatey)
choco install kubernetes-kompose

# 変換の実行
kompose convert -f docker-compose.yml

# 出力例:
# INFO Kubernetes file "web-deployment.yaml" created
# INFO Kubernetes file "web-service.yaml" created
# INFO Kubernetes file "api-deployment.yaml" created
```

```bash
# 変換したファイルをKubernetesに適用
kubectl apply -f .
```

## いつKubernetesに移行すべきか

### Kubernetesが適している場合

- 複数のサービスで構成されるマイクロサービス
- 高可用性が求められるシステム
- 負荷変動が大きいアプリケーション
- チームが複数のサービスを管理している

### Docker Composeで十分な場合

- 開発・テスト環境
- 小規模な単一サーバー運用
- 学習目的
- シンプルなアプリケーション

## まとめ

- Docker ComposeとKubernetesは用途が異なる
- Dockerの概念はKubernetesでも活かせる
- Container → Pod、Service → Service + Deploymentと対応
- Komposeを使うと変換が容易
- 移行はメリット・デメリットを考慮して判断する
- 小規模ならDocker Compose、本番運用ならKubernetesが適切

次のセクションでは、Kubernetesの最小実行単位であるPodについて詳しく学びます。
