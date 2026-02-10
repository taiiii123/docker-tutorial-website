# Docker Desktopの使い方

## 概要

このセクションでは、Docker Desktop のGUI（グラフィカルユーザーインターフェース）を使って、視覚的にDockerを操作する方法を学びます。

## Docker Desktop とは

Docker Desktop は、Windows と Mac 向けに提供されている Docker の公式デスクトップアプリケーションです。CLIに加えて、直感的なGUIでDockerを管理できます。

### 主な機能

| 機能 | 説明 |
|------|------|
| コンテナ管理 | 起動、停止、削除などの操作 |
| イメージ管理 | ダウンロード、削除、検索 |
| ボリューム管理 | データの永続化管理 |
| ネットワーク管理 | コンテナ間通信の設定 |
| リソース設定 | CPU、メモリの割り当て |
| Kubernetes | ローカルK8sクラスタの管理 |

## ダッシュボード画面

Docker Desktop を起動すると、ダッシュボード画面が表示されます。

![Docker Desktop ダッシュボード](/images/diagrams/docker-desktop-dashboard.png)

## コンテナの管理

### コンテナ一覧の確認

左メニューの「Containers」をクリックすると、すべてのコンテナが表示されます。

**表示される情報:**
- コンテナ名
- 使用イメージ
- ステータス（Running/Stopped）
- ポートマッピング
- 作成日時

### コンテナの操作

各コンテナの行で以下の操作ができます：

| ボタン | 操作 |
|--------|------|
| ▶️ / ⏹️ | 起動 / 停止 |
| 🔄 | 再起動 |
| 🗑️ | 削除 |
| 📋 | ログを表示 |
| 💻 | ターミナルを開く |
| 📊 | 詳細情報を表示 |

### コンテナの詳細画面

コンテナ名をクリックすると、詳細画面が開きます：

![コンテナ詳細画面](/images/diagrams/docker-desktop-container-detail.png)

**タブの説明:**
- **Logs**: リアルタイムログ表示
- **Inspect**: コンテナの設定情報（JSON）
- **Terminal**: コンテナ内のシェルアクセス
- **Files**: コンテナ内のファイルブラウザ
- **Stats**: CPU/メモリ使用率のグラフ

## イメージの管理

### イメージ一覧

左メニューの「Images」をクリック：

![Images 一覧画面](/images/diagrams/docker-desktop-images.png)

### Docker Hub からイメージを検索

1. 「Images」画面の検索バーをクリック
2. イメージ名を入力（例: `python`）
3. 検索結果から「Pull」ボタンでダウンロード

### イメージからコンテナを作成

1. イメージの行の「Run」ボタンをクリック
2. 設定ダイアログが開く：
   - コンテナ名
   - ポートマッピング
   - ボリュームマウント
   - 環境変数
3. 「Run」ボタンで起動

## 設定画面

### General（一般設定）

```
□ Start Docker Desktop when you sign in to your computer
□ Send usage statistics
□ Show weekly tips
□ Open Docker Dashboard at startup
```

### Resources（リソース設定）

Docker に割り当てるリソースを設定できます：

![Resources 設定画面](/images/diagrams/docker-desktop-resources.png)

### Docker Engine（エンジン設定）

Docker Daemon の設定を JSON で編集できます：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "features": {
    "buildkit": true
  }
}
```

### Kubernetes

ローカル Kubernetes クラスタの有効化：

```
☑️ Enable Kubernetes
☐ Show system containers (advanced)
```

## 便利な機能

### 1. クイックアクション

メニューバーの Docker アイコンから素早くアクセス：

![メニューバー クイックアクション](/images/diagrams/docker-desktop-menu.png)

### 2. 拡張機能（Extensions）

Docker Desktop の機能を拡張できます：

| 拡張機能 | 説明 |
|---------|------|
| Disk Usage | ディスク使用量の可視化 |
| Logs Explorer | 高度なログ検索 |
| Portainer | Web UI での管理 |
| Snyk | セキュリティスキャン |

### 3. Dev Environments

開発環境を Docker で構築・共有：

1. Git リポジトリを指定
2. 自動的にコンテナ環境を構築
3. VS Code などの IDE と連携

## CLI との連携

Docker Desktop は CLI と完全に連携しています：

```bash
# GUI で作成したコンテナを CLI で確認
docker ps

# CLI で作成したコンテナを GUI で確認
docker run -d --name test nginx
# → Docker Desktop のダッシュボードに表示される
```

## トラブルシューティング

### Docker Desktop が起動しない

```
1. タスクマネージャーで Docker プロセスを終了
2. Docker Desktop を再起動
3. それでも起動しない場合は再インストール
```

### コンテナが遅い

```
Settings → Resources で以下を調整:
- CPU を増やす
- メモリを増やす
- ディスクイメージサイズを確認
```

### ディスク容量が不足

```
1. Images 画面で未使用イメージを削除
2. Volumes 画面で未使用ボリュームを削除
3. Settings → Resources → Disk image size を確認
```

## まとめ

- Docker Desktop は GUI でDockerを管理できるツール
- コンテナ、イメージ、ボリューム、ネットワークを視覚的に管理
- リソース（CPU、メモリ）の割り当てを簡単に調整可能
- CLI と GUI は完全に連携している
- 拡張機能で機能を追加可能

これで Chapter 1「入門編 - Dockerを始めよう」は完了です！
次の Chapter 2 では、イメージとコンテナについてより詳しく学びます。
