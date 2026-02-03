# レイヤー最適化

## 概要

このセクションでは、Dockerイメージのレイヤー構造を理解し、効率的なレイヤー設計によってビルド時間とイメージサイズを最適化する方法を学びます。

## レイヤーの基本

### レイヤーが作成される命令

Dockerfileの以下の命令は新しいレイヤーを作成します。

| 命令 | レイヤー作成 | 説明 |
|------|-------------|------|
| FROM | Yes | ベースレイヤー |
| RUN | Yes | コマンド実行結果 |
| COPY | Yes | ファイルコピー |
| ADD | Yes | ファイル追加（圧縮解凍含む） |
| ENV | No | メタデータのみ |
| EXPOSE | No | メタデータのみ |
| CMD | No | メタデータのみ |
| ENTRYPOINT | No | メタデータのみ |
| WORKDIR | No | メタデータのみ |
| LABEL | No | メタデータのみ |
| ARG | No | ビルド時変数 |

### レイヤーの仕組み

```
イメージ
├── Layer 4: COPY . /app (100MB) - 読み取り専用
├── Layer 3: RUN npm install (200MB) - 読み取り専用
├── Layer 2: COPY package*.json ./ (1KB) - 読み取り専用
└── Layer 1: FROM node:20-alpine (180MB) - 読み取り専用

コンテナ起動時
├── 書き込み可能レイヤー（コンテナレイヤー）
└── 上記の読み取り専用レイヤー（共有）
```

## レイヤーキャッシュの活用

### キャッシュの仕組み

Dockerはビルド時に各レイヤーをキャッシュします。レイヤーに変更がなければ、キャッシュが再利用されます。

```dockerfile
FROM node:20-alpine
WORKDIR /app

# キャッシュ有効: package.jsonが変わらなければスキップ
COPY package*.json ./
RUN npm install

# キャッシュ無効: ソースコードは頻繁に変更
COPY . .
RUN npm run build
```

### キャッシュが無効化される条件

1. **命令自体の変更**: Dockerfileの命令が変わった
2. **COPY/ADDのファイル変更**: コピー元のファイルが変更された
3. **親レイヤーの変更**: 上位レイヤーが再ビルドされた

```
Layer 1: FROM node:20-alpine  ← 変更なし（キャッシュ使用）
Layer 2: COPY package*.json   ← 変更なし（キャッシュ使用）
Layer 3: RUN npm install      ← 変更なし（キャッシュ使用）
Layer 4: COPY . .             ← ソース変更（再ビルド）
Layer 5: RUN npm run build    ← 親が変更されたため再ビルド
```

### 最適な命令順序

変更頻度の低いものから順に配置します。

```dockerfile
FROM node:20-alpine

# 1. 最も変更が少ない: システム依存関係
RUN apk add --no-cache tini

# 2. 変更が少ない: 作業ディレクトリ設定
WORKDIR /app

# 3. やや変更がある: 依存関係定義
COPY package*.json ./
RUN npm ci

# 4. 頻繁に変更: アプリケーションコード
COPY . .

# 5. ビルド
RUN npm run build

# 6. メタデータ（変更頻度関係なし）
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## RUN命令の最適化

### 命令の結合

```dockerfile
# 悪い例: 3つのレイヤーが作成される
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# 良い例: 1つのレイヤーにまとめる
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

### 適切な分割

ただし、キャッシュ効率を考慮して分割することも重要です。

```dockerfile
# 良い例: 変更頻度の異なるものは分割
# システム依存関係（ほぼ変更なし）
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# アプリケーション依存関係（時々変更）
COPY package*.json ./
RUN npm ci

# ビルド（頻繁に変更）
COPY . .
RUN npm run build
```

### ヒアドキュメントの活用

複雑なスクリプトはヒアドキュメントで可読性を向上できます。

```dockerfile
RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends \
    curl \
    ca-certificates
rm -rf /var/lib/apt/lists/*
EOF
```

## COPY命令の最適化

### 必要なファイルのみコピー

```dockerfile
# 悪い例: すべてコピー
COPY . .

# 良い例: 必要なファイルのみ
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/
```

### 依存関係ファイルを先にコピー

```dockerfile
# Node.js
COPY package*.json ./
RUN npm ci
COPY . .

# Python
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .

# Go
COPY go.mod go.sum ./
RUN go mod download
COPY . .
```

### ワイルドカードの活用

```dockerfile
# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 設定ファイルをまとめてコピー
COPY *.config.js ./

# 特定のディレクトリ構造を維持
COPY src/ ./src/
COPY public/ ./public/
```

## レイヤー数の制限

### レイヤー数が多すぎる問題

- **ストレージオーバーヘッド**: 各レイヤーにメタデータ
- **ダウンロード時間**: レイヤーごとの並列ダウンロードにも限界
- **キャッシュ効率**: 中間レイヤーのキャッシュ管理

### 推奨されるレイヤー数

一般的に10-15レイヤー程度が適切とされています。

```bash
# レイヤー数の確認
docker history myapp:latest | wc -l
```

## スクワッシュ（レイヤー統合）

### --squashオプション

BuildKitを使用して、全レイヤーを1つに統合できます。

```bash
DOCKER_BUILDKIT=1 docker build --squash -t myapp:squashed .
```

### 注意点

- **キャッシュ無効化**: スクワッシュ後はレイヤーキャッシュが効かない
- **デバッグ困難**: 履歴が失われる
- **推奨されない場合**: 開発時、CI/CDでのビルド時間重視時

## 実践的な最適化例

### Node.js アプリケーション

```dockerfile
# ベースイメージ
FROM node:20-alpine AS base
WORKDIR /app

# 依存関係インストール（キャッシュ効率重視）
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ビルド
FROM deps AS builder
COPY . .
RUN npm run build

# 本番依存関係のみ
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --production

# 本番イメージ
FROM base AS runner
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Python アプリケーション

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app

# 依存関係（キャッシュ活用）
FROM base AS deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 本番イメージ
FROM base AS runner
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY . .
CMD ["python", "main.py"]
```

## レイヤー分析

### docker history

```bash
# レイヤーの詳細を確認
docker history --no-trunc myapp:latest

# サイズでソート（大きいレイヤーを特定）
docker history myapp:latest --format "{{.Size}}\t{{.CreatedBy}}" | sort -h
```

### 最適化前後の比較

```bash
# 最適化前
docker history myapp:before --format "table {{.Size}}\t{{.CreatedBy}}"

# 最適化後
docker history myapp:after --format "table {{.Size}}\t{{.CreatedBy}}"
```

## チェックリスト

```markdown
- [ ] 変更頻度の低い命令を先に配置している
- [ ] 依存関係ファイルを先にコピーしている
- [ ] 関連するRUN命令を結合している
- [ ] 不要なファイルを削除している（同一レイヤーで）
- [ ] .dockerignoreを適切に設定している
- [ ] レイヤー数が適切（10-15程度）
- [ ] キャッシュの効果を確認している
```

## まとめ

- レイヤーはFROM、RUN、COPY、ADD命令で作成される
- 変更頻度の低いものから順に配置してキャッシュを活用
- 関連するRUN命令は結合してレイヤー数を削減
- 依存関係ファイルは先にコピーして効率的にキャッシュ
- docker historyでレイヤー構造を分析

次のセクションでは、ビルド時間の短縮について詳しく学びます。
