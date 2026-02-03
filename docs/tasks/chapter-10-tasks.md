# Chapter 10「Kubernetes連携」タスクリスト

## 参照仕様

- [Chapter 10 Kubernetes連携 仕様](../spec/chapter-10-kubernetes-spec.md)

## タスク一覧

### セクション作成

- [x] Section 10-1: Kubernetesの概要
  - K8sとは何か
  - 必要性とアーキテクチャ
  - 主要コンポーネント

- [x] Section 10-2: DockerからKubernetesへ
  - Docker Composeとの比較
  - 概念の対応関係
  - 移行の考え方

- [x] Section 10-3: Podとコンテナ
  - Podの概念
  - マルチコンテナPod
  - Pod定義の書き方

- [x] Section 10-4: Deploymentの基礎
  - Deploymentとは
  - ReplicaSet
  - ローリングアップデート

- [x] Section 10-5: Docker Desktop + Kubernetes
  - K8s有効化手順
  - kubectlの基本操作
  - サンプルアプリのデプロイ

### 進捗状況

| タスク | 状態 | 備考 |
|--------|------|------|
| Section 10-1 | [x] 完了 | Kubernetesの概要、アーキテクチャ、主要コンポーネント |
| Section 10-2 | [x] 完了 | Docker Composeとの比較、概念対応表、移行パターン |
| Section 10-3 | [x] 完了 | Podの概念、マルチコンテナパターン、initContainers |
| Section 10-4 | [x] 完了 | Deployment、ReplicaSet、ローリングアップデート、HPA |
| Section 10-5 | [x] 完了 | Docker Desktop設定、kubectl操作、サンプルデプロイ |
