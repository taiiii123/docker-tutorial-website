# Docker Desktop + Kubernetes

## 概要

このセクションでは、Docker Desktop に組み込まれている Kubernetes を有効化し、ローカル環境で Kubernetes を使ってアプリケーションをデプロイする方法を学びます。

## Docker Desktop の Kubernetes

Docker Desktop には、シングルノードの Kubernetes クラスターが組み込まれています。本番環境と同じ Kubernetes の機能をローカルで試すことができます。

![Docker Desktop Kubernetes クラスター構成](/images/diagrams/docker-desktop-k8s.png)

### メリット

| メリット | 説明 |
|---------|------|
| 簡単セットアップ | チェックボックス1つで有効化 |
| ローカル開発 | インターネット接続なしで開発可能 |
| Docker統合 | Docker で作成したイメージをそのまま使用 |
| 学習に最適 | 本番と同じコマンドで操作可能 |

## Kubernetes の有効化

### Windows / macOS での手順

1. **Docker Desktop を開く**

2. **Settings（設定）を開く**
   - 歯車アイコンをクリック

3. **Kubernetes タブを選択**

4. **「Enable Kubernetes」にチェック**

5. **「Apply & Restart」をクリック**

![Docker Desktop Kubernetes 設定画面](/images/diagrams/docker-desktop-k8s-setup.png)

6. **起動を待つ（数分かかる場合があります）**
   - ステータスバーに「Kubernetes is running」と表示されれば完了

## kubectl のセットアップ確認

Docker Desktop をインストールすると、`kubectl` コマンドも一緒にインストールされます。

```bash
# kubectl のバージョン確認
kubectl version --client

# 出力例:
Client Version: v1.28.2
Kustomize Version: v5.0.4
```

### コンテキストの確認

```bash
# 現在のコンテキストを確認
kubectl config current-context

# 出力例:
docker-desktop

# 利用可能なコンテキスト一覧
kubectl config get-contexts

# 出力例:
CURRENT   NAME             CLUSTER          AUTHINFO         NAMESPACE
*         docker-desktop   docker-desktop   docker-desktop
```

### クラスターの状態確認

```bash
# クラスター情報の確認
kubectl cluster-info

# 出力例:
Kubernetes control plane is running at https://127.0.0.1:6443
CoreDNS is running at https://127.0.0.1:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

# ノードの確認
kubectl get nodes

# 出力例:
NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   5m    v1.28.2
```

## サンプルアプリケーションのデプロイ

### Step 1: Deployment の作成

nginx をデプロイしてみましょう。

```yaml
# nginx-deployment.yaml
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

```bash
# Deploymentを作成
kubectl apply -f nginx-deployment.yaml

# 出力:
deployment.apps/nginx-deployment created

# Podの確認
kubectl get pods

# 出力例:
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-6d9d8f4f7b-2xkm4   1/1     Running   0          30s
nginx-deployment-6d9d8f4f7b-8jklp   1/1     Running   0          30s
nginx-deployment-6d9d8f4f7b-n9xyz   1/1     Running   0          30s
```

### Step 2: Service の作成

外部からアクセスできるようにServiceを作成します。

```yaml
# nginx-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
```

```bash
# Serviceを作成
kubectl apply -f nginx-service.yaml

# 出力:
service/nginx-service created

# Serviceの確認
kubectl get services

# 出力例:
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes      ClusterIP      10.96.0.1       <none>        443/TCP        10m
nginx-service   LoadBalancer   10.96.100.50    localhost     80:31234/TCP   30s
```

### Step 3: アクセスの確認

```bash
# ブラウザで確認
# http://localhost にアクセス
```

または、コマンドラインで確認：

```bash
curl http://localhost

# 出力例:
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
```

## 実践的なサンプル：Webアプリケーション

Node.js アプリケーションをデプロイしてみましょう。

### Step 1: アプリケーションの準備

```javascript
// app.js
const http = require('http');
const os = require('os');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from Kubernetes!',
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  }));
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY app.js .
EXPOSE 3000
CMD ["node", "app.js"]
```

### Step 2: イメージのビルド

```bash
# イメージをビルド
docker build -t myapp:1.0 .

# 確認
docker images myapp
```

### Step 3: Kubernetes マニフェストの作成

```yaml
# myapp.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:1.0
          imagePullPolicy: Never  # ローカルイメージを使用
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - port: 8080
      targetPort: 3000
```

### Step 4: デプロイと確認

```bash
# デプロイ
kubectl apply -f myapp.yaml

# Podの確認
kubectl get pods -l app=myapp

# Serviceの確認
kubectl get service myapp-service

# アクセスの確認
curl http://localhost:8080

# 出力例:
{
  "message": "Hello from Kubernetes!",
  "hostname": "myapp-7f8d6b5c4-abc12",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

複数回アクセスすると、異なるPod（hostname）からレスポンスが返ってくることを確認できます。これが負荷分散です。

## kubectl の基本操作

### リソースの確認

```bash
# すべてのリソースを確認
kubectl get all

# 特定の名前空間のリソース
kubectl get all -n kube-system

# 詳細な出力
kubectl get pods -o wide

# YAML形式で出力
kubectl get deployment nginx-deployment -o yaml
```

### ログの確認

```bash
# Podのログを確認
kubectl logs nginx-deployment-6d9d8f4f7b-2xkm4

# リアルタイムでログを追跡
kubectl logs -f nginx-deployment-6d9d8f4f7b-2xkm4

# 直近の100行を表示
kubectl logs --tail=100 nginx-deployment-6d9d8f4f7b-2xkm4
```

### Pod内でのコマンド実行

```bash
# シェルに接続
kubectl exec -it nginx-deployment-6d9d8f4f7b-2xkm4 -- /bin/bash

# 単一コマンドを実行
kubectl exec nginx-deployment-6d9d8f4f7b-2xkm4 -- cat /etc/nginx/nginx.conf
```

### ポートフォワード

Serviceを作成せずに一時的にアクセスする方法：

```bash
# Podに直接ポートフォワード
kubectl port-forward pod/nginx-deployment-6d9d8f4f7b-2xkm4 8080:80

# Serviceにポートフォワード
kubectl port-forward service/nginx-service 8080:80

# バックグラウンドで実行
kubectl port-forward service/nginx-service 8080:80 &
```

### リソースの削除

```bash
# 個別に削除
kubectl delete deployment nginx-deployment
kubectl delete service nginx-service

# ファイルで指定したリソースを削除
kubectl delete -f nginx-deployment.yaml

# ラベルで一括削除
kubectl delete all -l app=nginx
```

## トラブルシューティング

### Pod が起動しない場合

```bash
# Podの状態を確認
kubectl describe pod <pod-name>

# イベントを確認
kubectl get events --sort-by=.lastTimestamp
```

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| ImagePullBackOff | イメージが見つからない | imagePullPolicy: Never を設定、またはイメージ名を確認 |
| CrashLoopBackOff | コンテナが異常終了 | kubectl logs でログを確認 |
| Pending | リソース不足 | リソース要求を減らす、またはノードを確認 |

### Kubernetes のリセット

問題が解決しない場合、Kubernetes をリセットできます：

```
Docker Desktop Settings
  → Kubernetes
    → [Reset Kubernetes Cluster]
```

## まとめ

- Docker Desktop で Kubernetes を簡単に有効化できる
- kubectl でクラスターを操作
- Deployment と Service でアプリケーションをデプロイ
- ローカルで作成した Docker イメージをそのまま使用可能
- ポートフォワードで一時的なアクセスが可能
- トラブルシューティングは kubectl describe と logs で確認

これで Chapter 10「Kubernetes連携」は完了です。Docker の知識を活かして、Kubernetes でのコンテナオーケストレーションの基礎を学びました。
