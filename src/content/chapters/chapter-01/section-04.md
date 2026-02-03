# Dockerのインストール

## 概要

このセクションでは、Windows、Mac、Linuxそれぞれの環境にDockerをインストールする方法を学びます。

## システム要件

### Windows

| 要件 | 詳細 |
|------|------|
| OS | Windows 10/11 64-bit (Pro, Enterprise, Education) |
| WSL 2 | Windows Subsystem for Linux 2 が必要 |
| メモリ | 4GB 以上 |
| 仮想化 | BIOS で仮想化が有効 |

### Mac

| 要件 | 詳細 |
|------|------|
| OS | macOS 12 (Monterey) 以降 |
| チップ | Intel または Apple Silicon (M1/M2/M3) |
| メモリ | 4GB 以上 |

### Linux

| 要件 | 詳細 |
|------|------|
| OS | Ubuntu 20.04+, Debian 10+, Fedora 36+ など |
| アーキテクチャ | 64-bit (x86_64, arm64) |
| カーネル | 3.10 以上 |

## Windows へのインストール

### Step 1: WSL 2 を有効化

PowerShell を管理者として開き、以下を実行：

```powershell
# WSL と仮想マシンプラットフォームを有効化
wsl --install

# PCを再起動
Restart-Computer
```

### Step 2: Docker Desktop をダウンロード

1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) にアクセス
2. 「Download for Windows」をクリック
3. インストーラーをダウンロード

### Step 3: インストールと設定

```
1. Docker Desktop Installer.exe を実行
2. 「Use WSL 2 instead of Hyper-V」にチェック
3. インストール完了後、PCを再起動
4. Docker Desktop を起動
5. 利用規約に同意
```

### Step 4: インストール確認

```powershell
# バージョン確認
docker --version
# Docker version 24.0.7, build afdd53b

# 動作確認
docker run hello-world
```

## Mac へのインストール

### Step 1: Docker Desktop をダウンロード

1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) にアクセス
2. チップに応じたバージョンを選択：
   - Intel チップ: 「Mac with Intel chip」
   - Apple Silicon: 「Mac with Apple chip」

### Step 2: インストール

```bash
# ダウンロードした .dmg ファイルを開く
# Docker.app を Applications フォルダにドラッグ

# または Homebrew を使用
brew install --cask docker
```

### Step 3: 初期設定

```
1. Applications から Docker を起動
2. 権限の許可を求められたら許可
3. 利用規約に同意
4. メニューバーに Docker アイコンが表示されれば成功
```

### Step 4: インストール確認

```bash
# バージョン確認
docker --version
# Docker version 24.0.7, build afdd53b

# 動作確認
docker run hello-world
```

## Linux へのインストール

### Ubuntu/Debian

#### Step 1: 古いバージョンを削除

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

#### Step 2: 必要なパッケージをインストール

```bash
sudo apt-get update
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

#### Step 3: Docker の公式 GPG キーを追加

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

#### Step 4: リポジトリを設定

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### Step 5: Docker Engine をインストール

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Step 6: sudo なしで実行できるように設定

```bash
# docker グループを作成（存在しない場合）
sudo groupadd docker

# 現在のユーザーを docker グループに追加
sudo usermod -aG docker $USER

# 変更を反映（ログアウト・ログインが必要）
newgrp docker
```

#### Step 7: インストール確認

```bash
# バージョン確認
docker --version

# 動作確認（sudo なしで実行）
docker run hello-world
```

### CentOS/RHEL/Fedora

```bash
# 古いバージョンを削除
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# リポジトリを設定
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Docker Engine をインストール
sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker を起動
sudo systemctl start docker
sudo systemctl enable docker

# sudo なしで実行
sudo usermod -aG docker $USER
```

## インストール後の確認

### 基本的な動作確認

```bash
# Docker のバージョン
docker version

# 出力例:
Client:
 Version:           24.0.7
 API version:       1.43
 Go version:        go1.20.10
 ...

Server:
 Engine:
  Version:          24.0.7
  API version:      1.43
  ...
```

### システム情報の確認

```bash
# Docker システム情報
docker info

# 出力例:
Containers: 0
 Running: 0
 Paused: 0
 Stopped: 0
Images: 0
Server Version: 24.0.7
Storage Driver: overlay2
...
```

### Hello World の実行

```bash
docker run hello-world

# 出力例:
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

## トラブルシューティング

### よくある問題と解決策

#### Docker Daemon に接続できない

```bash
# エラー例
Cannot connect to the Docker daemon at unix:///var/run/docker.sock

# 解決策（Linux）
sudo systemctl start docker
sudo systemctl enable docker
```

#### Permission denied エラー

```bash
# エラー例
permission denied while trying to connect to the Docker daemon socket

# 解決策
sudo usermod -aG docker $USER
# その後、ログアウト・ログイン
```

#### WSL 2 関連のエラー（Windows）

```powershell
# WSL 2 のカーネルを更新
wsl --update

# WSL をシャットダウンして再起動
wsl --shutdown
```

## まとめ

- **Windows**: Docker Desktop + WSL 2 を使用
- **Mac**: Docker Desktop を使用
- **Linux**: Docker Engine を直接インストール
- インストール後は `docker run hello-world` で動作確認
- Linux では `docker` グループへの追加で sudo 不要に

次のセクションでは、初めてのDockerコマンドを実行します。
