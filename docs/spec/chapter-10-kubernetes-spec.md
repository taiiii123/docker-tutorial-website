# Chapter 10「Kubernetes連携」仕様

## 1. 背景・目的（Why）

Docker学習サイトの実践編として、DockerからKubernetesへの移行を理解するためのコンテンツを提供する。
Dockerの知識を活かしながら、コンテナオーケストレーションの基礎を学べるようにする。

## 2. 機能要件（What）

### 2.1 対象読者

- Dockerの基礎を習得済みの学習者
- Docker Composeを使った複数コンテナの管理経験がある
- Kubernetesに興味があるが、まだ触れていない

### 2.2 到達目標

- Kubernetesの基本概念を理解する
- DockerとKubernetesの関係性を把握する
- Docker Desktop上でKubernetesを動かせるようになる

## 3. コンテンツ構成

### Section 10-1: Kubernetesの概要

| 項目 | 内容 |
|------|------|
| タイトル | Kubernetesの概要 |
| 目的 | K8sの必要性とアーキテクチャを理解する |
| 主な内容 | - Kubernetesとは何か<br>- なぜKubernetesが必要か<br>- アーキテクチャ概要<br>- 主要コンポーネント |

### Section 10-2: DockerからKubernetesへ

| 項目 | 内容 |
|------|------|
| タイトル | DockerからKubernetesへ |
| 目的 | 移行の考え方と対応関係を理解する |
| 主な内容 | - Docker ComposeとKubernetesの比較<br>- 概念の対応関係<br>- 移行のメリット・デメリット |

### Section 10-3: Podとコンテナ

| 項目 | 内容 |
|------|------|
| タイトル | Podとコンテナ |
| 目的 | Kubernetesの最小単位であるPodを理解する |
| 主な内容 | - Podの概念<br>- コンテナとPodの関係<br>- マルチコンテナPod<br>- Pod定義の書き方 |

### Section 10-4: Deploymentの基礎

| 項目 | 内容 |
|------|------|
| タイトル | Deploymentの基礎 |
| 目的 | 宣言的なアプリケーション管理を理解する |
| 主な内容 | - Deploymentとは<br>- ReplicaSet<br>- ローリングアップデート<br>- スケーリング |

### Section 10-5: Docker Desktop + Kubernetes

| 項目 | 内容 |
|------|------|
| タイトル | Docker Desktop + Kubernetes |
| 目的 | ローカル環境でK8sを動かす |
| 主な内容 | - Docker DesktopでのK8s有効化<br>- kubectlの基本操作<br>- サンプルアプリのデプロイ |

## 4. コンテンツ形式

各セクションは以下の構成で作成する：

```markdown
# セクションタイトル

## 概要
（このセクションで学ぶこと）

## 本文
（解説コンテンツ）

## コード例
（実行可能なコード例）

## まとめ
（ポイントの整理）
```

## 5. 非機能要件

- 日本語で記述する
- コードブロックには言語指定を付ける（yaml, bash等）
- 図解を適宜使用して視覚的に理解しやすくする
- 既存のChapter 1-2のコンテンツスタイルに準拠する

## 6. 受け入れ条件

- [ ] 全5セクションのMarkdownファイルが作成されている
- [ ] 各セクションに概要・本文・まとめが含まれる
- [ ] コード例は実行可能な形式である
- [ ] 日本語として自然で読みやすい文章
- [ ] 技術的に正確な情報
- [ ] 既存コンテンツとスタイルが統一されている
