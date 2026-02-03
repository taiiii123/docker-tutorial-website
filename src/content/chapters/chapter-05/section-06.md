# ボリュームの種類

## 概要

このセクションでは、Dockerで使用できる3種類のデータマウント方法（名前付きボリューム、バインドマウント、tmpfs マウント）について、それぞれの特徴と使い分けを学びます。

## マウントタイプの比較

Dockerには3つの主要なマウントタイプがあります。

```
┌─────────────────────────────────────────────────────────────────┐
│                         コンテナ                                  │
│                                                                   │
│      Volume Mount      Bind Mount        tmpfs Mount             │
│          │                 │                  │                  │
└──────────┼─────────────────┼──────────────────┼──────────────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Docker Volume   │ │  Host Directory  │ │    Memory        │
│  /var/lib/docker │ │  /home/user/app  │ │   (RAM)          │
│  /volumes/...    │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
     永続化               永続化              一時的
   Docker管理          ユーザー管理         メモリ上
```

### 比較表

| 特徴 | Volume | Bind Mount | tmpfs |
|------|--------|------------|-------|
| 格納場所 | Docker管理領域 | ホストの任意の場所 | メモリ（RAM） |
| 永続性 | あり | あり | なし（コンテナ停止で消失） |
| ホストからのアクセス | 困難 | 容易 | 不可 |
| 複数コンテナで共有 | 可能 | 可能 | 不可 |
| パフォーマンス | 良好 | OS依存 | 最高速 |
| 推奨用途 | 本番データ | 開発環境 | 機密情報、一時キャッシュ |

## 名前付きボリューム（Volume）

### 概要

**名前付きボリューム**は、Dockerが管理する領域にデータを保存します。本番環境での使用に最適です。

### 特徴

| 特徴 | 説明 |
|------|------|
| Docker管理 | Dockerがボリュームのライフサイクルを管理 |
| 移植性 | ホストのディレクトリ構造に依存しない |
| バックアップ | Docker CLIでバックアップ可能 |
| ドライバー | 様々なストレージドライバーに対応 |

### 使用方法

```bash
# ボリュームを作成
docker volume create app-data

# コンテナにマウント
docker run -d \
  --name app \
  --mount type=volume,source=app-data,target=/app/data \
  nginx

# または短い形式
docker run -d --name app2 -v app-data:/app/data nginx

# ボリュームの場所を確認
docker volume inspect app-data --format '{{.Mountpoint}}'
# /var/lib/docker/volumes/app-data/_data
```

### 読み取り専用マウント

```bash
# 読み取り専用でマウント
docker run -d \
  --name app-readonly \
  --mount type=volume,source=app-data,target=/app/data,readonly \
  nginx

# 短い形式
docker run -d --name app-readonly2 -v app-data:/app/data:ro nginx
```

### ボリュームドライバー

```bash
# ローカルドライバー（デフォルト）
docker volume create --driver local my-local-volume

# NFSボリュームの例
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/nfs/share \
  nfs-volume
```

## バインドマウント（Bind Mount）

### 概要

**バインドマウント**は、ホストマシンの特定のディレクトリをコンテナ内にマウントします。開発環境でのコード共有に最適です。

### 特徴

| 特徴 | 説明 |
|------|------|
| ホストパス指定 | ホストの任意のパスをマウント可能 |
| 即時反映 | ホストでの変更がコンテナに即時反映 |
| 双方向 | コンテナからの変更もホストに反映 |
| 既存ディレクトリ | ホストの既存ファイルにアクセス可能 |

### 使用方法

```bash
# 現在のディレクトリをマウント（絶対パス必須）
docker run -d \
  --name dev-app \
  --mount type=bind,source="$(pwd)",target=/app \
  node:20-alpine sh -c "cd /app && npm start"

# 短い形式（Windowsの場合はパスを調整）
docker run -d --name dev-app2 -v "$(pwd)":/app node:20-alpine

# 読み取り専用でマウント
docker run -d \
  --name readonly-app \
  --mount type=bind,source="$(pwd)",target=/app,readonly \
  node:20-alpine
```

### 開発環境での活用例

```bash
# プロジェクトディレクトリ構造
# /home/user/myapp/
# ├── src/
# ├── package.json
# └── Dockerfile

# ソースコードをバインドマウントして開発
docker run -d \
  --name dev-server \
  -p 3000:3000 \
  -v /home/user/myapp/src:/app/src \
  -v /home/user/myapp/package.json:/app/package.json \
  node:20-alpine sh -c "npm install && npm run dev"

# ホストでファイルを編集すると、コンテナ内に即時反映される
```

### バインドマウントの注意点

```bash
# 存在しないパスを指定すると、ディレクトリとして作成される
docker run -v /nonexistent/path:/data alpine ls /data
# 空のディレクトリが作成される

# --mount の場合はエラーになる（安全）
docker run --mount type=bind,source=/nonexistent/path,target=/data alpine
# エラー: bind source path does not exist
```

### SELinuxラベル（Linuxの場合）

```bash
# SELinux有効環境での設定
docker run -v /host/data:/container/data:z alpine  # 共有ラベル
docker run -v /host/data:/container/data:Z alpine  # プライベートラベル
```

## tmpfs マウント

### 概要

**tmpfs マウント**は、データをメモリ（RAM）上に保存します。コンテナ停止時にデータは消失しますが、高速なアクセスとセキュリティ上の利点があります。

### 特徴

| 特徴 | 説明 |
|------|------|
| メモリ上 | データはRAMに保存される |
| 高速 | ディスクI/Oがないため最高速 |
| 一時的 | コンテナ停止時にデータ消失 |
| セキュア | ディスクに書き込まれない |

### 使用方法

```bash
# tmpfsマウントを使用
docker run -d \
  --name secure-app \
  --mount type=tmpfs,target=/run/secrets \
  alpine sleep 3600

# 短い形式
docker run -d --name temp-app --tmpfs /tmp alpine sleep 3600

# サイズ制限を指定
docker run -d \
  --name limited-tmpfs \
  --mount type=tmpfs,target=/cache,tmpfs-size=100m,tmpfs-mode=1777 \
  alpine sleep 3600
```

### tmpfsのオプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `tmpfs-size` | サイズ制限 | `tmpfs-size=100m` |
| `tmpfs-mode` | パーミッション | `tmpfs-mode=1777` |

### ユースケース

```bash
# 1. 一時ファイルの高速処理
docker run -d \
  --name cache-server \
  --mount type=tmpfs,target=/tmp/cache \
  redis:alpine

# 2. 機密情報の一時保存
docker run -d \
  --name secure-process \
  --mount type=tmpfs,target=/run/secrets,tmpfs-size=64m \
  -e SECRET_KEY=xxx \
  myapp

# 3. ビルドキャッシュ
docker run --rm \
  --mount type=tmpfs,target=/tmp \
  golang:1.21 go build -o /output/app ./...
```

## 複合的な使用例

### 開発環境の構成

```bash
# 複数のマウントタイプを組み合わせる
docker run -d \
  --name full-dev-env \
  -p 3000:3000 \
  --mount type=bind,source="$(pwd)/src",target=/app/src \
  --mount type=volume,source=node_modules,target=/app/node_modules \
  --mount type=tmpfs,target=/app/.cache \
  node:20-alpine sh -c "npm install && npm run dev"
```

### 構成図

```
┌─────────────────────────────────────────────────────────────┐
│                     コンテナ (full-dev-env)                   │
│                                                               │
│   /app/src          /app/node_modules       /app/.cache      │
│       │                    │                     │           │
└───────┼────────────────────┼─────────────────────┼───────────┘
        │                    │                     │
        ▼                    ▼                     ▼
   Bind Mount           Volume               tmpfs
   ホストの               Docker管理            メモリ
   ソースコード           依存関係               キャッシュ
   (即時反映)            (永続化)              (高速)
```

## Docker Composeでの定義

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: node:20-alpine
    working_dir: /app
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      # バインドマウント（ソースコード）
      - ./src:/app/src:cached
      - ./package.json:/app/package.json:ro

      # 名前付きボリューム（node_modules）
      - node_modules:/app/node_modules

    # tmpfsマウント
    tmpfs:
      - /tmp
      - /app/.cache:size=100M

  db:
    image: postgres:16
    volumes:
      # 名前付きボリューム（データ永続化）
      - postgres_data:/var/lib/postgresql/data

      # バインドマウント（初期化スクリプト）
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro

volumes:
  node_modules:
  postgres_data:
```

## パフォーマンスの最適化（macOS/Windows）

macOSとWindowsでは、バインドマウントのパフォーマンスが低下することがあります。

### 一貫性オプション

```bash
# macOS/Windowsでのパフォーマンス最適化
docker run -v "$(pwd):/app:cached" myimage      # ホスト→コンテナの反映を遅延
docker run -v "$(pwd):/app:delegated" myimage   # コンテナ→ホストの反映を遅延
docker run -v "$(pwd):/app:consistent" myimage  # 即時一貫性（デフォルト、最も遅い）
```

### 推奨構成

```yaml
# docker-compose.yml（macOS/Windows向け最適化）
version: '3.8'

services:
  app:
    build: .
    volumes:
      # ソースコードは cached で高速化
      - ./src:/app/src:cached

      # node_modules は名前付きボリュームで分離（超重要）
      - node_modules:/app/node_modules

      # ビルド成果物も名前付きボリュームで
      - build_output:/app/dist

volumes:
  node_modules:
  build_output:
```

## まとめ

- **名前付きボリューム**: Docker管理、本番環境向け、移植性が高い
- **バインドマウント**: ホストディレクトリをマウント、開発環境向け、即時反映
- **tmpfs**: メモリ上、一時データ・機密情報向け、最高速
- 用途に応じて適切なマウントタイプを選択することが重要
- `--mount` オプションは明示的で推奨される
- macOS/Windowsではバインドマウントのパフォーマンスに注意が必要

次のセクションでは、データの永続化戦略（バックアップ、マイグレーション）について学びます。
