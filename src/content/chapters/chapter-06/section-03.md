# ベースイメージの選択

## 概要

このセクションでは、Dockerイメージのベースとなるイメージの選択方法を学びます。適切なベースイメージを選ぶことで、イメージサイズ、セキュリティ、パフォーマンスを最適化できます。

## ベースイメージの種類

### 主要なベースイメージの比較

| イメージ | サイズ | 特徴 | 用途 |
|---------|--------|------|------|
| ubuntu | ~77MB | フル機能、広い互換性 | 開発、学習 |
| debian | ~124MB | 安定性重視 | 汎用 |
| debian:slim | ~80MB | 軽量版Debian | 本番環境 |
| alpine | ~7MB | musl libc、超軽量 | 軽量化重視 |
| distroless | ~2-20MB | シェルなし | セキュリティ重視 |
| scratch | 0B | 完全に空 | 静的バイナリ |

## Alpine Linux

### 特徴

Alpine Linuxは軽量なLinuxディストリビューションです。

```dockerfile
FROM alpine:3.19
RUN apk add --no-cache nodejs npm
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
```

### メリット

- **超軽量**: 基本イメージが約7MB
- **セキュリティ**: 最小限のパッケージで攻撃面が小さい
- **高速**: ダウンロード・起動が高速

### デメリット

- **musl libc**: glibc互換性の問題が発生する場合がある
- **パッケージ**: 一部のパッケージが利用できない
- **デバッグ**: ツールが少なく、トラブルシューティングが難しい

### musl libc の互換性問題

```bash
# glibc向けにビルドされたバイナリはAlpineで動作しない場合がある
# 例: 一部のPythonパッケージ、Node.jsネイティブモジュール

# 解決策1: glibc互換パッケージをインストール
FROM alpine:3.19
RUN apk add --no-cache gcompat

# 解決策2: alpine用にコンパイルされたパッケージを使用
FROM python:3.12-alpine
RUN apk add --no-cache gcc musl-dev
```

## Debian Slim

glibcを使用しながら軽量化されたイメージです。

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*
```

### メリット

- **glibc互換**: 広い互換性
- **安定性**: Debianの安定性を継承
- **ツール**: 必要なツールを簡単に追加可能

### デメリット

- **サイズ**: Alpineより大きい（約80MB）

## Distroless

Googleが提供する、シェルやパッケージマネージャーを含まないイメージです。

```dockerfile
# ビルドステージ
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

# 実行ステージ（distroless）
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

### 利用可能なDistrolessイメージ

| イメージ | 用途 |
|---------|------|
| `gcr.io/distroless/static` | 静的バイナリ（Go, Rustなど） |
| `gcr.io/distroless/base` | 動的リンクバイナリ |
| `gcr.io/distroless/java` | Javaアプリケーション |
| `gcr.io/distroless/nodejs` | Node.jsアプリケーション |
| `gcr.io/distroless/python3` | Pythonアプリケーション |

### メリット

- **セキュリティ**: シェルがないため、コンテナ侵入後の攻撃が困難
- **軽量**: 必要最小限のランタイムのみ
- **CVE削減**: 不要なパッケージがないため脆弱性が少ない

### デメリット

- **デバッグ困難**: シェルがないため`docker exec`でのデバッグができない
- **柔軟性**: 追加パッケージのインストールができない

### デバッグ用タグ

```dockerfile
# 開発時はdebugタグを使用（busyboxシェルが含まれる）
FROM gcr.io/distroless/static-debian12:debug
```

## Scratch

完全に空のイメージです。静的にリンクされたバイナリ専用です。

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
# 静的リンクでビルド
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags='-s -w -extldflags "-static"' -o main .

FROM scratch
# CA証明書をコピー（HTTPS通信が必要な場合）
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
# タイムゾーンデータをコピー（時間処理が必要な場合）
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
# バイナリをコピー
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
```

### メリット

- **最小サイズ**: バイナリのサイズのみ
- **最高のセキュリティ**: 攻撃面がほぼゼロ

### デメリット

- **静的リンク必須**: 動的ライブラリが使用できない
- **機能制限**: シェル、CA証明書、タイムゾーンなどがない

## 言語別推奨ベースイメージ

### Node.js

```dockerfile
# 開発・テスト
FROM node:20

# 本番（バランス重視）
FROM node:20-slim

# 本番（軽量重視）
FROM node:20-alpine

# 本番（セキュリティ重視）
FROM gcr.io/distroless/nodejs20-debian12
```

### Python

```dockerfile
# 開発・テスト
FROM python:3.12

# 本番（バランス重視）
FROM python:3.12-slim

# 本番（軽量重視）- ネイティブ拡張に注意
FROM python:3.12-alpine

# 本番（セキュリティ重視）
FROM gcr.io/distroless/python3-debian12
```

### Go

```dockerfile
# ビルド
FROM golang:1.22-alpine AS builder

# 本番（推奨）
FROM scratch
# または
FROM gcr.io/distroless/static-debian12
```

### Java

```dockerfile
# 開発
FROM eclipse-temurin:21-jdk

# 本番（JREのみ）
FROM eclipse-temurin:21-jre-alpine

# 本番（セキュリティ重視）
FROM gcr.io/distroless/java21-debian12
```

### Rust

```dockerfile
# ビルド
FROM rust:1.75-alpine AS builder

# 本番（推奨）
FROM scratch
# または
FROM gcr.io/distroless/static-debian12
```

## 選択の判断基準

### フローチャート

```
開始
  │
  ├─ 静的バイナリ？（Go, Rust）
  │    ├─ Yes → scratch または distroless/static
  │    └─ No ↓
  │
  ├─ セキュリティ最優先？
  │    ├─ Yes → distroless
  │    └─ No ↓
  │
  ├─ glibc互換性が必要？
  │    ├─ Yes → debian-slim
  │    └─ No ↓
  │
  ├─ サイズ最小化優先？
  │    ├─ Yes → alpine
  │    └─ No → debian-slim または公式言語イメージ-slim
```

### 環境別の推奨

| 環境 | 推奨 | 理由 |
|------|------|------|
| 開発 | 公式イメージ（フル版） | デバッグツールが豊富 |
| CI/CD | alpine または slim | ビルド時間短縮 |
| ステージング | 本番と同じ | 本番環境の検証 |
| 本番 | distroless または alpine | セキュリティとサイズ |

## バージョン指定のベストプラクティス

```dockerfile
# 悪い例：latestは不安定
FROM node:latest

# 悪い例：メジャーバージョンのみは変更が大きい
FROM node:20

# 良い例：マイナーバージョンまで指定
FROM node:20.11-alpine

# より良い例：パッチバージョンまで指定
FROM node:20.11.1-alpine

# 最も確実：ダイジェスト指定
FROM node:20.11.1-alpine@sha256:abc123...
```

## まとめ

- ベースイメージの選択はサイズ、セキュリティ、互換性のトレードオフ
- Alpine: 軽量重視だがmusl libc互換性に注意
- Debian Slim: 互換性とサイズのバランス
- Distroless: セキュリティ最優先の本番環境向け
- Scratch: 静的バイナリ専用で最小サイズ
- バージョンは具体的に指定し、再現性を確保

次のセクションでは、レイヤー最適化について詳しく学びます。
