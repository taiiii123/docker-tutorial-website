# Kubernetesの概要

## 概要

このセクションでは、Kubernetes（K8s）とは何か、なぜ必要とされているのか、そしてその基本的なアーキテクチャについて学びます。

## Kubernetesとは

**Kubernetes**（クバネティス、K8s）は、コンテナ化されたアプリケーションのデプロイ、スケーリング、管理を自動化するための**コンテナオーケストレーション**プラットフォームです。

2014年にGoogleが社内で使用していたコンテナ管理システム「Borg」の経験をもとに開発し、オープンソースとして公開しました。現在はCloud Native Computing Foundation（CNCF）によって管理されています。

```
K8s = K + 8文字(ubernete) + s
    = Kubernetes
```

## なぜKubernetesが必要なのか

### Dockerだけでは解決できない課題

Dockerは単一のホスト上でコンテナを実行するには優れていますが、本番環境では以下のような課題が発生します。

| 課題 | 説明 |
|------|------|
| スケーリング | トラフィック増加時に手動でコンテナを追加する必要がある |
| 障害対応 | コンテナがクラッシュした際の自動復旧ができない |
| 負荷分散 | 複数コンテナへのトラフィック分散を手動で設定する必要がある |
| ローリングアップデート | ダウンタイムなしでの更新が難しい |
| サービスディスカバリ | コンテナ間の通信設定を手動で管理する必要がある |

### Kubernetesによる解決

![Kubernetes クラスター概要](/images/diagrams/k8s-cluster-overview.png)

Kubernetesは、これらの課題を**宣言的な設定**と**自動化**によって解決します。

## Kubernetesのアーキテクチャ

Kubernetesクラスターは、**コントロールプレーン**と**ワーカーノード**で構成されます。

![Kubernetes アーキテクチャ](/images/diagrams/kubernetes-architecture.png)

### コントロールプレーンのコンポーネント

| コンポーネント | 役割 |
|---------------|------|
| API Server | クラスターへのすべての操作を受け付けるエントリーポイント |
| Scheduler | 新しいPodをどのノードに配置するか決定する |
| Controller Manager | クラスターの状態を監視し、望ましい状態を維持する |
| etcd | クラスターのすべての設定情報を保存する分散データストア |

### ワーカーノードのコンポーネント

| コンポーネント | 役割 |
|---------------|------|
| kubelet | ノード上でPodを管理するエージェント |
| kube-proxy | ネットワークルールを管理し、Podへの通信を可能にする |
| Container Runtime | コンテナを実行するランタイム（containerd, CRI-Oなど） |

## Kubernetesの主要リソース

Kubernetesでは、アプリケーションやその設定を「リソース」として定義します。

```yaml
# リソースの基本構造
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
    - name: my-container
      image: nginx:latest
```

### 主要リソース一覧

| リソース | 説明 |
|---------|------|
| Pod | コンテナの最小実行単位 |
| Deployment | Podのレプリカ数を管理し、更新を制御 |
| Service | Podへのネットワークアクセスを提供 |
| ConfigMap | 設定情報を管理 |
| Secret | 機密情報を管理 |
| Namespace | リソースを論理的に分離 |
| PersistentVolume | 永続的なストレージを提供 |

## Kubernetesの特徴

### 宣言的な設定

「何をしたいか」を記述するだけで、Kubernetesが「どうやるか」を自動的に実行します。

```yaml
# 「nginx を3つ動かしたい」と宣言
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3  # 3つのPodを維持
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

### 自己修復（Self-Healing）

- コンテナが異常終了したら自動的に再起動
- ノードが故障したら別のノードでPodを再作成
- ヘルスチェックに失敗したコンテナを自動的に置き換え

### 水平スケーリング

```bash
# コマンド一つでスケールアウト
kubectl scale deployment nginx-deployment --replicas=10
```

## Docker と Kubernetes の関係

![Docker と Kubernetes の関係](/images/diagrams/docker-k8s-workflow.png)

- **Docker**: コンテナイメージの作成とローカルでの実行
- **Kubernetes**: 本番環境でのコンテナのオーケストレーション

Dockerで作成したイメージは、Kubernetesでそのまま使用できます。

## まとめ

- Kubernetesはコンテナオーケストレーションプラットフォーム
- 自動スケーリング、自己修復、ローリングアップデートなどを提供
- コントロールプレーンとワーカーノードで構成される
- 宣言的な設定により、望ましい状態を定義するだけで自動的に管理
- DockerとKubernetesは補完関係にあり、Dockerで作成したイメージをKubernetesで運用する

次のセクションでは、DockerからKubernetesへの移行の考え方について詳しく学びます。
