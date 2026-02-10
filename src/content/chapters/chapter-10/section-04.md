# Deploymentの基礎

## 概要

このセクションでは、Kubernetesの重要なリソースである**Deployment**について学びます。Deploymentを使ってPodのレプリカ管理、ローリングアップデート、スケーリングを行う方法を理解します。

## Deploymentとは

**Deployment**は、Podの望ましい状態を宣言的に定義し、その状態を維持するためのリソースです。Deploymentを使うことで、以下のことが自動的に行われます。

- 指定した数のPodレプリカの維持
- Podの更新（ローリングアップデート）
- 障害時のPodの自動再作成
- スケールアウト・スケールイン

![Deployment/ReplicaSet/Pod の階層構造](/images/diagrams/deployment-replicaset-pod.png)

## なぜDeploymentを使うのか

### Podを直接作成した場合の問題

```bash
# Podを直接作成
kubectl apply -f pod.yaml

# Podが障害で停止すると...
# → 自動的に再作成されない
# → 手動で対応が必要
```

### Deploymentを使った場合

```bash
# Deploymentを作成
kubectl apply -f deployment.yaml

# Podが障害で停止すると...
# → 自動的に新しいPodが作成される
# → 常に指定した数のPodが維持される
```

## Deploymentの定義

### 基本的なDeployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
```

### 各フィールドの説明

| フィールド | 説明 |
|-----------|------|
| metadata.name | Deploymentの名前 |
| spec.replicas | 維持するPodの数 |
| spec.selector | 管理対象のPodを選択するラベル |
| spec.template | 作成するPodのテンプレート |
| template.metadata.labels | Podに付けるラベル（selectorと一致必須） |
| template.spec | Podの仕様（コンテナ定義など） |

### ラベルとセレクターの関係

```yaml
spec:
  selector:
    matchLabels:
      app: nginx       # このラベルを持つPodを管理
  template:
    metadata:
      labels:
        app: nginx     # Podに付けるラベル（selectorと一致）
```

![ラベルセレクターによるマッチング](/images/diagrams/label-selector-matching.png)

## ReplicaSet

**ReplicaSet**は、Deploymentによって自動的に作成され、指定された数のPodレプリカを維持します。

![Deployment/ReplicaSet/Pod の階層構造](/images/diagrams/deployment-replicaset-pod.png)

```bash
# ReplicaSetの確認
kubectl get replicasets

# 出力例:
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-6d9d8f4f7b   3         3         3       5m
```

通常、ReplicaSetを直接操作することはありません。Deploymentを通じて管理します。

## ローリングアップデート

Deploymentは、ダウンタイムなしでアプリケーションを更新できます。

### 更新の流れ

![ローリングアップデートの流れ](/images/diagrams/rolling-update-flow.png)

### 更新戦略の設定

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 追加で作成できるPodの数
      maxUnavailable: 1  # 同時に停止できるPodの数
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
```

| パラメータ | 説明 | デフォルト |
|-----------|------|----------|
| maxSurge | 望ましいPod数を超えて作成できる数 | 25% |
| maxUnavailable | 更新中に利用不可になれるPodの数 | 25% |

### イメージの更新

```bash
# イメージを更新
kubectl set image deployment/nginx-deployment nginx=nginx:1.26

# 更新状況の確認
kubectl rollout status deployment/nginx-deployment

# 出力例:
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
deployment "nginx-deployment" successfully rolled out
```

### ロールバック

問題が発生した場合、前のバージョンに戻すことができます。

```bash
# 更新履歴の確認
kubectl rollout history deployment/nginx-deployment

# 出力例:
REVISION  CHANGE-CAUSE
1         <none>
2         <none>

# 前のバージョンにロールバック
kubectl rollout undo deployment/nginx-deployment

# 特定のリビジョンにロールバック
kubectl rollout undo deployment/nginx-deployment --to-revision=1
```

## スケーリング

### 手動スケーリング

```bash
# レプリカ数を変更
kubectl scale deployment nginx-deployment --replicas=5

# 確認
kubectl get deployment nginx-deployment

# 出力例:
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   5/5     5            5           10m
```

### YAMLファイルでのスケーリング

```yaml
spec:
  replicas: 5  # 3から5に変更
```

```bash
kubectl apply -f deployment.yaml
```

### 水平Pod自動スケーリング（HPA）

CPUやメモリ使用率に基づいて自動的にスケールします。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

```bash
# HPAの作成
kubectl apply -f hpa.yaml

# または、コマンドで作成
kubectl autoscale deployment nginx-deployment --min=2 --max=10 --cpu-percent=50

# HPAの確認
kubectl get hpa
```

## 完全なDeployment例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: myapp:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

### ヘルスチェックの説明

| プローブ | 説明 |
|---------|------|
| livenessProbe | コンテナが正常に動作しているか確認。失敗時は再起動 |
| readinessProbe | トラフィックを受け入れる準備ができているか確認。失敗時はServiceから除外 |

## Deploymentの操作コマンド

```bash
# Deploymentの作成
kubectl apply -f deployment.yaml

# Deploymentの一覧
kubectl get deployments

# 詳細表示
kubectl describe deployment nginx-deployment

# Podの確認
kubectl get pods -l app=nginx

# ログの確認（最新のPodから）
kubectl logs -l app=nginx --tail=100

# 更新履歴
kubectl rollout history deployment/nginx-deployment

# 更新状況
kubectl rollout status deployment/nginx-deployment

# 一時停止
kubectl rollout pause deployment/nginx-deployment

# 再開
kubectl rollout resume deployment/nginx-deployment

# 削除
kubectl delete deployment nginx-deployment
```

## まとめ

- DeploymentはPodの宣言的な管理を行うリソース
- ReplicaSetを通じて指定した数のPodを維持
- ローリングアップデートでダウンタイムなしの更新が可能
- ロールバックで問題発生時に前のバージョンに戻せる
- 手動スケーリングと自動スケーリング（HPA）が可能
- ヘルスチェック（livenessProbe/readinessProbe）で信頼性を向上

次のセクションでは、Docker DesktopでKubernetesを動かす方法を学びます。
