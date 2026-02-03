# 用語集

## 概要

このセクションでは、Dockerおよびコンテナ技術に関連する用語を解説します。アルファベット順と日本語順で整理しています。

## A-Z

### Alpine Linux

軽量なLinuxディストリビューション。セキュリティ、シンプルさ、リソース効率を重視して設計されている。Dockerイメージのベースとして広く使用され、通常のLinuxディストリビューションと比較してイメージサイズを大幅に削減できる。

```dockerfile
FROM node:20-alpine
```

### AMD64 / ARM64

CPUアーキテクチャの種類。AMD64（x86_64）はIntel/AMD系の64ビットアーキテクチャ、ARM64（aarch64）はARM系の64ビットアーキテクチャ。Apple Silicon（M1/M2/M3）はARM64を使用する。

```bash
# マルチプラットフォームビルド
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .
```

### Bridge Network（ブリッジネットワーク）

Dockerのデフォルトネットワークドライバー。同一ホスト上のコンテナ間で通信を可能にする仮想ネットワークを作成する。

```bash
docker network create --driver bridge my-network
```

### BuildKit

Dockerの次世代ビルドツールキット。並列ビルド、キャッシュの効率化、シークレットマウントなどの機能を提供する。

```bash
DOCKER_BUILDKIT=1 docker build .
```

### CI/CD（Continuous Integration / Continuous Delivery）

継続的インテグレーション / 継続的デリバリー。コードの変更を自動的にビルド、テスト、デプロイするプラクティス。Dockerはこのパイプラインで広く活用される。

### CLI（Command Line Interface）

コマンドラインインターフェース。Dockerではdockerコマンドを指す。

```bash
docker run nginx
docker compose up
```

### Container（コンテナ）

イメージから作成された実行可能なインスタンス。アプリケーションとその依存関係を隔離された環境で実行する。

```bash
docker run -d --name my-container nginx
```

### Container Orchestration（コンテナオーケストレーション）

複数のコンテナの配置、スケーリング、ネットワーキング、可用性を自動的に管理する技術。Kubernetes、Docker Swarmなどが代表例。

### Container Runtime（コンテナランタイム）

コンテナを実際に実行するソフトウェア。containerd、runc、CRI-Oなどがある。

### Context（コンテキスト）

Dockerビルドにおいて、Dockerデーモンに送信されるファイルセット。通常はDockerfileがあるディレクトリ全体。

```bash
docker build -t myapp .  # "." がコンテキスト
```

### Daemon（デーモン）

バックグラウンドで動作するプロセス。Docker Daemon（dockerd）はDockerのコア機能を提供する。

### Dangling Image（ダングリングイメージ）

タグが付いていない中間イメージ。ビルド時に生成され、通常は不要なもの。

```bash
# ダングリングイメージの削除
docker image prune
```

### Distroless

Googleが提供する最小限のコンテナイメージ。パッケージマネージャーやシェルを含まず、セキュリティが高い。

```dockerfile
FROM gcr.io/distroless/nodejs20-debian12
```

### Docker Compose

複数のコンテナで構成されるアプリケーションを定義・実行するツール。YAMLファイルでサービスを定義する。

```yaml
services:
  web:
    image: nginx
  db:
    image: postgres
```

### Docker Desktop

Windows/macOS向けのDocker GUI アプリケーション。Docker Engine、Docker CLI、Docker Compose、Kubernetesなどを含む。

### Docker Engine

Dockerのコア技術。Docker Daemon、REST API、CLIで構成される。

### Docker Hub

Dockerの公式イメージレジストリ。公開イメージの検索、プル、プッシュが可能。

```bash
docker pull nginx
docker push myuser/myimage
```

### Docker Scout

Dockerの脆弱性スキャンおよびセキュリティ分析ツール。

```bash
docker scout cves myimage:latest
```

### Docker Swarm

Docker native のコンテナオーケストレーションツール。複数のDockerホストをクラスタ化して管理する。

### Dockerfile

Dockerイメージを構築するための命令を記述したテキストファイル。

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

### Entrypoint（エントリポイント）

コンテナ起動時に実行されるメインコマンド。CMDと組み合わせて使用される。

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

### Environment Variable（環境変数）

コンテナに渡される設定値。アプリケーションの動作を外部から制御するために使用。

```bash
docker run -e NODE_ENV=production myapp
```

### Healthcheck（ヘルスチェック）

コンテナの正常性を確認する仕組み。定期的にコマンドを実行して状態を監視する。

```dockerfile
HEALTHCHECK CMD curl -f http://localhost/health || exit 1
```

### Host Network（ホストネットワーク）

コンテナがホストマシンのネットワーク名前空間を共有するモード。ネットワーク分離がなくなる。

```bash
docker run --network host nginx
```

### Image（イメージ）

コンテナを作成するためのテンプレート。ファイルシステムと設定を含む読み取り専用のパッケージ。

```bash
docker images
docker pull nginx:latest
```

### Image Layer（イメージレイヤー）

Dockerイメージを構成する読み取り専用の層。各Dockerfile命令が新しいレイヤーを作成する。

### Kubernetes（K8s）

コンテナオーケストレーションプラットフォーム。大規模なコンテナ環境の管理、スケーリング、デプロイを自動化する。

### Layer Cache（レイヤーキャッシュ）

Dockerビルド時に再利用される過去のビルド結果。変更されていないレイヤーはキャッシュから使用される。

### Manifest

イメージのメタデータを含むJSONファイル。マルチプラットフォームイメージでは、各アーキテクチャのイメージを参照する。

### Mount（マウント）

ホストのファイルやディレクトリをコンテナ内で利用可能にする仕組み。

### Multi-stage Build（マルチステージビルド）

複数のFROM命令を使用して、ビルド環境と実行環境を分離する手法。最終イメージのサイズを削減できる。

```dockerfile
FROM node:20 AS builder
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Namespace（名前空間）

Linuxカーネルの機能で、プロセス間でリソースを分離する。Dockerはこれを使用してコンテナを隔離する。

### OCI（Open Container Initiative）

コンテナのランタイムとイメージの標準仕様を策定する組織。

### Overlay Network（オーバーレイネットワーク）

複数のDockerホストにまたがるネットワーク。Docker Swarmで使用される。

### Port Mapping（ポートマッピング）

コンテナ内のポートをホストのポートに転送する設定。

```bash
docker run -p 8080:80 nginx  # ホスト:コンテナ
```

### Pull

レジストリからイメージをダウンロードすること。

```bash
docker pull nginx:latest
```

### Push

ローカルイメージをレジストリにアップロードすること。

```bash
docker push myuser/myimage:latest
```

### Registry（レジストリ）

Dockerイメージを保存・配布するサービス。Docker Hub、Amazon ECR、Google GCR、Azure ACRなど。

### Restart Policy（再起動ポリシー）

コンテナが終了した際の再起動動作を定義する設定。

```bash
docker run --restart unless-stopped nginx
```

### Scratch

空のベースイメージ。静的リンクされたバイナリを実行する最小限のイメージを作成する際に使用。

```dockerfile
FROM scratch
COPY myapp /myapp
CMD ["/myapp"]
```

### Secret（シークレット）

パスワードやAPIキーなどの機密情報。Docker Secrets機能で安全に管理できる。

### Tag（タグ）

イメージのバージョンを識別するためのラベル。

```bash
docker tag myapp:latest myapp:1.0.0
```

### TTY

テレタイプライターの略。ターミナルエミュレーション。-tフラグで割り当てる。

```bash
docker run -it ubuntu bash  # -t: TTY, -i: インタラクティブ
```

### Union File System（ユニオンファイルシステム）

複数のファイルシステムを1つの統合ビューとして扱う技術。Dockerのレイヤーシステムの基盤。

### Volume（ボリューム）

コンテナのデータを永続化するための仕組み。コンテナのライフサイクルとは独立してデータを保持する。

```bash
docker volume create mydata
docker run -v mydata:/app/data nginx
```

## 日本語用語

### イメージ（Image）

→ Image を参照

### エントリポイント（Entrypoint）

→ Entrypoint を参照

### オーケストレーション（Orchestration）

→ Container Orchestration を参照

### コンテナ（Container）

→ Container を参照

### コンテキスト（Context）

→ Context を参照

### シークレット（Secret）

→ Secret を参照

### スウォーム（Swarm）

→ Docker Swarm を参照

### タグ（Tag）

→ Tag を参照

### ダングリング（Dangling）

→ Dangling Image を参照

### デーモン（Daemon）

→ Daemon を参照

### ネームスペース（Namespace）

→ Namespace を参照

### バインドマウント（Bind Mount）

ホストのファイルやディレクトリをコンテナにマウントする方法。ホストのパスを直接指定する。

```bash
docker run -v /host/path:/container/path nginx
```

### ビルドキット（BuildKit）

→ BuildKit を参照

### ヘルスチェック（Healthcheck）

→ Healthcheck を参照

### ボリューム（Volume）

→ Volume を参照

### マルチステージビルド（Multi-stage Build）

→ Multi-stage Build を参照

### マルチプラットフォーム（Multi-platform）

異なるCPUアーキテクチャ（AMD64、ARM64など）向けに1つのイメージを構築すること。

### マウント（Mount）

→ Mount を参照

### レイヤー（Layer）

→ Image Layer を参照

### レジストリ（Registry）

→ Registry を参照

## 関連技術

### cgroups（Control Groups）

Linuxカーネルの機能で、プロセスグループのリソース使用（CPU、メモリなど）を制限・監視する。Dockerのリソース制限に使用される。

### containerd

コンテナランタイム。Docker Engine内部で使用される高レベルランタイム。

### runc

コンテナランタイム。OCI仕様に準拠した低レベルランタイム。

### Podman

Dockerの代替となるコンテナエンジン。デーモンレスで動作し、rootless実行が可能。

### LXC（Linux Containers）

Linuxコンテナ技術。Dockerの初期バージョンで使用されていた。

### chroot

ルートディレクトリを変更するUnixコマンド。コンテナ技術の基礎概念の1つ。

## まとめ

Docker用語の理解は、効率的な開発・運用の基盤となります。

| カテゴリ | 主要用語 |
|---------|---------|
| 基本概念 | イメージ、コンテナ、レイヤー |
| 構築 | Dockerfile、マルチステージビルド、BuildKit |
| ネットワーク | ブリッジ、オーバーレイ、ホスト |
| ストレージ | ボリューム、バインドマウント |
| オーケストレーション | Kubernetes、Docker Swarm |
| セキュリティ | シークレット、Distroless |

不明な用語があれば、このリファレンスを活用してください。
