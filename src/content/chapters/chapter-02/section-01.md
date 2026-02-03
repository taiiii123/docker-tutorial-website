# Dockerイメージとは

## 概要

このセクションでは、Dockerイメージの概念とレイヤー構造について詳しく学びます。

## イメージの定義

**Dockerイメージ**は、コンテナを作成するための読み取り専用のテンプレートです。アプリケーションの実行に必要なすべての要素が含まれています。

### イメージに含まれるもの

| 要素 | 説明 |
|------|------|
| ベースOS | Alpine Linux, Ubuntu など |
| ランタイム | Node.js, Python, Java など |
| ライブラリ | アプリケーションの依存関係 |
| アプリケーション | 実際のコード |
| 設定ファイル | 環境変数、設定 |

## レイヤー構造

Dockerイメージは**レイヤー**（層）で構成されています。各レイヤーは読み取り専用で、変更は新しいレイヤーとして追加されます。

```
┌─────────────────────────────────────┐
│     アプリケーションコード          │ Layer 4 (最上位)
│     COPY . /app                     │
├─────────────────────────────────────┤
│     依存関係のインストール           │ Layer 3
│     RUN npm install                 │
├─────────────────────────────────────┤
│     Node.js ランタイム              │ Layer 2
│     FROM node:20                    │
├─────────────────────────────────────┤
│     Alpine Linux (ベースOS)         │ Layer 1 (ベース)
└─────────────────────────────────────┘
```

### レイヤーの確認

```bash
# イメージのレイヤーを確認
docker history nginx

# 出力例:
IMAGE          CREATED       CREATED BY                                      SIZE
a6bd71f48f68   2 days ago    CMD ["nginx" "-g" "daemon off;"]                0B
<missing>      2 days ago    EXPOSE 80                                       0B
<missing>      2 days ago    STOPSIGNAL SIGQUIT                              0B
<missing>      2 days ago    RUN /bin/sh -c set -x ...                       61.4MB
<missing>      2 days ago    COPY file:... in /docker-entrypoint.d           4.62kB
...
```

## イメージの命名規則

### 完全な形式

```
[レジストリ/][ユーザー名/]リポジトリ名[:タグ][@ダイジェスト]
```

### 例

```bash
# 公式イメージ
nginx                     # → docker.io/library/nginx:latest
nginx:1.25                # → docker.io/library/nginx:1.25
nginx:alpine              # → docker.io/library/nginx:alpine

# ユーザーイメージ
myuser/myapp:v1.0         # → docker.io/myuser/myapp:v1.0

# プライベートレジストリ
myregistry.com/myapp:v1.0

# ダイジェスト指定（不変）
nginx@sha256:abc123...
```

### タグの種類

| タグ | 説明 |
|------|------|
| `latest` | 最新版（デフォルト） |
| `1.25` | バージョン番号 |
| `alpine` | Alpine Linux ベース |
| `slim` | 軽量版 |
| `bullseye` | Debian バージョン |

## イメージとコンテナの関係

```
┌─────────────────┐
│   Dockerfile    │
│  (設計書)       │
└────────┬────────┘
         │ docker build
         ▼
┌─────────────────┐
│     Image       │
│  (テンプレート)  │ ← 読み取り専用
└────────┬────────┘
         │ docker run
         ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Container A   │  │   Container B   │  │   Container C   │
│  (インスタンス)  │  │  (インスタンス)  │  │  (インスタンス)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

1つのイメージから複数のコンテナを作成できます。

## イメージの共有

### コンテナからイメージを作成

```bash
# 実行中のコンテナの変更を新しいイメージとして保存
docker commit my-container my-new-image:v1.0

# 確認
docker images my-new-image
```

### イメージのエクスポート/インポート

```bash
# イメージをファイルに保存
docker save nginx:latest > nginx.tar

# ファイルからイメージを読み込み
docker load < nginx.tar
```

## イメージサイズの比較

同じNode.jsでも、ベースイメージによってサイズが異なります：

```bash
docker images node --format "{{.Tag}}\t{{.Size}}"

# 出力例:
latest     1.1GB
slim       260MB
alpine     180MB
```

### 軽量イメージを選ぶメリット

- ダウンロード時間の短縮
- ディスク使用量の削減
- 攻撃対象の削減（セキュリティ）
- デプロイ時間の短縮

## まとめ

- イメージはコンテナの読み取り専用テンプレート
- レイヤー構造で効率的にストレージを使用
- タグでバージョンを管理
- 1つのイメージから複数のコンテナを作成可能
- 用途に応じて適切なベースイメージを選択

次のセクションでは、Docker Hubの使い方を学びます。
