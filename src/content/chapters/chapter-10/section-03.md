# Podとコンテナ

## 概要

このセクションでは、Kubernetesの最小実行単位である**Pod**について学びます。Podの概念、コンテナとの関係、そしてPodの定義方法を理解します。

## Podとは

**Pod**（ポッド）は、Kubernetesにおける最小のデプロイ単位です。1つ以上のコンテナをグループ化し、ストレージやネットワークを共有する論理的なホストとして機能します。

![Pod の構造](/images/diagrams/pod-structure.png)

### Podの特徴

| 特徴 | 説明 |
|------|------|
| 一時的（Ephemeral） | Podは削除・再作成される可能性がある |
| IPアドレス共有 | Pod内のコンテナは同じIPを持つ |
| ストレージ共有 | ボリュームをコンテナ間で共有できる |
| ライフサイクル共有 | コンテナは同時に起動・停止される |

## コンテナとPodの関係

### Dockerのコンテナ

```bash
# Dockerでは1コンテナずつ起動
docker run -d nginx
docker run -d myapp
```

### KubernetesのPod

```yaml
# Kubernetesではコンテナをまとめたい場合Podでグループ化
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
    - name: nginx
      image: nginx:1.25
    - name: myapp
      image: myapp:latest
```

### なぜPodという単位が必要か

![Docker vs Kubernetes コンテナ管理](/images/diagrams/docker-vs-k8s-container.png)

密接に連携するコンテナ（例：アプリとサイドカー）は、同じPodにまとめることで：

- 同じノードで実行されることが保証される
- localhost で高速に通信できる
- ストレージを簡単に共有できる

## Pod定義の書き方

### 最小構成のPod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
    - name: nginx
      image: nginx:1.25
```

### 各フィールドの説明

| フィールド | 説明 |
|-----------|------|
| apiVersion | 使用するAPIバージョン |
| kind | リソースの種類 |
| metadata.name | Podの名前（クラスター内で一意） |
| spec.containers | コンテナの定義（配列） |
| containers[].name | コンテナ名 |
| containers[].image | 使用するコンテナイメージ |

### ポートを公開するPod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
          protocol: TCP
```

### 環境変数を設定するPod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DATABASE_URL
          value: "postgres://db:5432/mydb"
        - name: LOG_LEVEL
          value: "info"
```

### リソース制限を設定するPod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: limited-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      resources:
        requests:
          memory: "128Mi"
          cpu: "250m"
        limits:
          memory: "256Mi"
          cpu: "500m"
```

| 設定 | 説明 |
|------|------|
| requests | 最低限必要なリソース量 |
| limits | 使用可能な最大リソース量 |
| memory | メモリ（Mi=メビバイト） |
| cpu | CPU（1000m=1コア） |

## マルチコンテナPod

1つのPodに複数のコンテナを含める場合、以下のパターンがよく使われます。

### サイドカーパターン

メインコンテナを補助するコンテナを追加します。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-with-logging
spec:
  containers:
    # メインのWebサーバー
    - name: web
      image: nginx:1.25
      ports:
        - containerPort: 80
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx

    # ログ収集のサイドカー
    - name: log-collector
      image: fluentd:latest
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
          readOnly: true

  volumes:
    - name: logs
      emptyDir: {}
```

![サイドカーパターン](/images/diagrams/sidecar-pattern.png)

### アンバサダーパターン

外部サービスへの接続をプロキシします。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-ambassador
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DB_HOST
          value: "localhost"
        - name: DB_PORT
          value: "5432"

    # データベース接続プロキシ
    - name: db-proxy
      image: cloud-sql-proxy:latest
      args:
        - "--instances=project:region:instance=tcp:5432"
```

### 初期化コンテナ（initContainers）

メインコンテナの起動前に実行される特別なコンテナです。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-init
spec:
  # 初期化コンテナ（メインより先に実行）
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until nc -z db-service 5432; do
            echo "Waiting for database..."
            sleep 2
          done

    - name: download-config
      image: curlimages/curl:latest
      command:
        - sh
        - -c
        - curl -o /config/app.conf http://config-server/app.conf
      volumeMounts:
        - name: config
          mountPath: /config

  # メインコンテナ
  containers:
    - name: app
      image: myapp:latest
      volumeMounts:
        - name: config
          mountPath: /app/config

  volumes:
    - name: config
      emptyDir: {}
```

## Podのライフサイクル

![Pod のライフサイクル](/images/diagrams/pod-lifecycle.png)

### Podのステータス

| ステータス | 説明 |
|-----------|------|
| Pending | ノードへの割り当て待ち、イメージのダウンロード中 |
| Running | コンテナが実行中 |
| Succeeded | すべてのコンテナが正常終了 |
| Failed | 1つ以上のコンテナが異常終了 |
| Unknown | Podの状態を取得できない |

## Podの操作コマンド

```bash
# Podの作成
kubectl apply -f pod.yaml

# Podの一覧表示
kubectl get pods

# Podの詳細表示
kubectl describe pod nginx-pod

# Podのログ表示
kubectl logs nginx-pod

# マルチコンテナPodの特定コンテナのログ
kubectl logs nginx-pod -c log-collector

# Pod内でコマンド実行
kubectl exec -it nginx-pod -- /bin/bash

# マルチコンテナPodの特定コンテナで実行
kubectl exec -it nginx-pod -c nginx -- /bin/bash

# Podの削除
kubectl delete pod nginx-pod
```

## まとめ

- PodはKubernetesの最小デプロイ単位
- 1つ以上のコンテナをグループ化して管理
- Pod内のコンテナはIPアドレス、ストレージを共有
- マルチコンテナPodはサイドカー、アンバサダーなどのパターンで活用
- initContainersでメインコンテナの前処理を実行
- 通常はPodを直接作成せず、Deploymentを使用する

次のセクションでは、Podを管理するためのDeploymentについて学びます。
