# Composeコマンド詳解

## 概要

このセクションでは、Docker Composeの主要なコマンドを詳しく学びます。`docker compose up`から`docker compose down`まで、日常的に使用するコマンドとそのオプションを理解しましょう。

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `up` | サービスの作成・起動 |
| `down` | サービスの停止・削除 |
| `ps` | サービスの状態確認 |
| `logs` | ログの表示 |
| `exec` | 実行中コンテナでコマンド実行 |
| `run` | 一時的なコンテナでコマンド実行 |
| `build` | イメージのビルド |
| `pull` | イメージの取得 |
| `start/stop/restart` | サービスの起動/停止/再起動 |
| `config` | 設定ファイルの検証 |

## docker compose up

サービスを作成し、起動します。

### 基本的な使い方

```bash
# フォアグラウンドで起動（ログが表示される）
docker compose up

# バックグラウンドで起動（デタッチモード）
docker compose up -d

# 特定のサービスのみ起動
docker compose up -d web app

# イメージを再ビルドして起動
docker compose up -d --build

# 古いコンテナを削除して再作成
docker compose up -d --force-recreate

# 変更があったサービスのみ再作成
docker compose up -d --force-recreate --no-deps app
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `-d, --detach` | バックグラウンドで起動 |
| `--build` | 起動前にイメージをビルド |
| `--force-recreate` | コンテナを強制的に再作成 |
| `--no-deps` | 依存サービスを起動しない |
| `--remove-orphans` | 定義されていないサービスを削除 |
| `--scale SERVICE=NUM` | サービスのインスタンス数を指定 |
| `--wait` | サービスがhealthyになるまで待機 |
| `-V, --renew-anon-volumes` | 匿名ボリュームを再作成 |

### 実践例

```bash
# 開発時: 変更を反映して起動
docker compose up -d --build

# 本番時: 安定した起動を確認
docker compose up -d --wait

# クリーンな状態で起動
docker compose up -d --force-recreate --remove-orphans -V

# スケールアウト
docker compose up -d --scale app=3
```

## docker compose down

サービスを停止し、リソースを削除します。

### 基本的な使い方

```bash
# コンテナとネットワークを停止・削除
docker compose down

# ボリュームも削除
docker compose down -v

# イメージも削除
docker compose down --rmi all

# 孤立したコンテナも削除
docker compose down --remove-orphans
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `-v, --volumes` | 名前付きボリュームも削除 |
| `--rmi all` | すべてのイメージを削除 |
| `--rmi local` | カスタムタグのないイメージのみ削除 |
| `--remove-orphans` | 孤立したコンテナを削除 |
| `-t, --timeout` | シャットダウンタイムアウト（秒） |

### 削除されるリソースの違い

```bash
# docker compose down
# 削除: コンテナ, ネットワーク
# 残る: ボリューム, イメージ

# docker compose down -v
# 削除: コンテナ, ネットワーク, ボリューム
# 残る: イメージ

# docker compose down -v --rmi all
# 削除: コンテナ, ネットワーク, ボリューム, イメージ
# 残る: なし（クリーンな状態）
```

## docker compose ps

サービスの状態を確認します。

### 基本的な使い方

```bash
# すべてのサービスの状態を表示
docker compose ps

# 特定のサービスのみ表示
docker compose ps app

# 詳細な情報を表示
docker compose ps -a

# フォーマットを指定
docker compose ps --format json
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### 出力例

```
NAME                STATUS              PORTS
myapp-web-1        running             0.0.0.0:80->80/tcp
myapp-app-1        running             3000/tcp
myapp-db-1         running (healthy)   5432/tcp
```

### 状態の意味

| 状態 | 説明 |
|------|------|
| `running` | 実行中 |
| `running (healthy)` | 実行中・健全 |
| `running (unhealthy)` | 実行中・異常 |
| `exited (0)` | 正常終了 |
| `exited (1)` | エラー終了 |
| `restarting` | 再起動中 |

## docker compose logs

サービスのログを表示します。

### 基本的な使い方

```bash
# すべてのサービスのログを表示
docker compose logs

# 特定のサービスのログを表示
docker compose logs app

# 複数のサービスのログを表示
docker compose logs app db

# リアルタイムでログを追跡
docker compose logs -f

# 最新N行のみ表示
docker compose logs --tail 100

# タイムスタンプを表示
docker compose logs -t

# 特定期間のログを表示
docker compose logs --since "2024-01-01T00:00:00"
docker compose logs --since 30m    # 過去30分
docker compose logs --until "2024-01-01T12:00:00"
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `-f, --follow` | リアルタイムで追跡 |
| `--tail N` | 最新N行のみ表示 |
| `-t, --timestamps` | タイムスタンプを表示 |
| `--since` | 指定時刻以降のログ |
| `--until` | 指定時刻までのログ |
| `--no-color` | 色付けを無効化 |

### 実践例

```bash
# 開発時: リアルタイムでログを監視
docker compose logs -f app

# 障害調査: 最近のログを確認
docker compose logs --tail 200 --since 10m app

# ログをファイルに保存
docker compose logs --no-color app > app.log
```

## docker compose exec

実行中のコンテナ内でコマンドを実行します。

### 基本的な使い方

```bash
# シェルに入る
docker compose exec app sh
docker compose exec app bash

# コマンドを実行
docker compose exec app npm run test
docker compose exec db psql -U postgres -d mydb

# 環境変数を設定して実行
docker compose exec -e DEBUG=true app npm run debug

# 作業ディレクトリを指定
docker compose exec -w /app/src app ls -la

# 特定のユーザーで実行
docker compose exec -u root app apt update
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `-d, --detach` | バックグラウンドで実行 |
| `-e, --env` | 環境変数を設定 |
| `-w, --workdir` | 作業ディレクトリを指定 |
| `-u, --user` | 実行ユーザーを指定 |
| `-T` | TTYを無効化（スクリプト用） |
| `--index N` | スケール時に特定のインスタンスを指定 |

### 実践例

```bash
# データベースのバックアップ
docker compose exec db pg_dump -U postgres mydb > backup.sql

# Railsコンソール
docker compose exec app rails console

# Node.js REPL
docker compose exec app node

# スケール時に特定のインスタンスを指定
docker compose exec --index 2 app sh
```

## docker compose run

一時的なコンテナでコマンドを実行します。

### execとrunの違い

| 項目 | exec | run |
|------|------|-----|
| 対象 | 実行中のコンテナ | 新規コンテナ |
| 用途 | デバッグ・管理 | 一時的なタスク |
| コンテナ | 既存を使用 | 新規作成 |
| 終了後 | コンテナ継続 | コンテナ削除可能 |

### 基本的な使い方

```bash
# ワンショットコマンド
docker compose run --rm app npm test
docker compose run --rm app npm run migrate

# シェルを起動
docker compose run --rm app sh

# ポートを公開
docker compose run --rm -p 8080:3000 app npm run debug

# サービスポートを公開
docker compose run --rm --service-ports app npm start

# 依存サービスを起動せずに実行
docker compose run --rm --no-deps app npm run lint
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `--rm` | 終了後にコンテナを削除 |
| `-d, --detach` | バックグラウンドで実行 |
| `-e, --env` | 環境変数を設定 |
| `-p, --publish` | ポートを公開 |
| `--service-ports` | サービス定義のポートを公開 |
| `--no-deps` | 依存サービスを起動しない |
| `-v, --volume` | ボリュームをマウント |

### 実践例

```bash
# テストを実行
docker compose run --rm app npm test

# データベースマイグレーション
docker compose run --rm app npm run db:migrate

# シードデータ投入
docker compose run --rm app npm run db:seed

# 一時的なデバッグ環境
docker compose run --rm -p 9229:9229 app npm run debug
```

## docker compose build

サービスのイメージをビルドします。

### 基本的な使い方

```bash
# すべてのサービスをビルド
docker compose build

# 特定のサービスをビルド
docker compose build app

# キャッシュを使用せずにビルド
docker compose build --no-cache

# ビルド引数を指定
docker compose build --build-arg NODE_ENV=production app

# 並列ビルド数を指定
docker compose build --parallel 4
```

### 主要なオプション

| オプション | 説明 |
|------------|------|
| `--no-cache` | キャッシュを使用しない |
| `--pull` | 常に最新のベースイメージを取得 |
| `--build-arg` | ビルド引数を指定 |
| `--parallel N` | 並列ビルド数 |
| `--progress` | 進捗表示形式（auto/plain/tty） |

## docker compose config

Compose設定ファイルを検証・表示します。

```bash
# 設定を検証して表示
docker compose config

# サービス名のみ表示
docker compose config --services

# ボリューム名のみ表示
docker compose config --volumes

# 環境変数を解決した結果を表示
docker compose config --resolve-image-digests
```

## その他の便利なコマンド

### start/stop/restart

```bash
# 停止中のサービスを起動
docker compose start

# サービスを停止（コンテナは残る）
docker compose stop

# サービスを再起動
docker compose restart

# 特定のサービスのみ
docker compose restart app
```

### pull/push

```bash
# イメージを取得
docker compose pull

# イメージをプッシュ
docker compose push
```

### top

```bash
# プロセス一覧を表示
docker compose top
```

### port

```bash
# ポートマッピングを表示
docker compose port app 3000
```

## コマンドフロー図

```
┌──────────────────────────────────────────────────────────────────────┐
│                        開発ワークフロー                               │
└──────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │   build     │ ← イメージを作成
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │    up -d    │ ← サービスを起動
  └──────┬──────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │    ps    │   │   logs   │   │   exec   │   │   run    │
  │(状態確認) │   │(ログ確認) │   │(デバッグ) │   │(タスク)   │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘
         │
         ├──── restart (再起動)
         │
         ▼
  ┌─────────────┐
  │    down     │ ← サービスを停止・削除
  └─────────────┘
```

## まとめ

- `docker compose up -d`: サービスをバックグラウンドで起動
- `docker compose down -v`: サービスとボリュームを削除
- `docker compose ps`: サービスの状態を確認
- `docker compose logs -f`: リアルタイムでログを追跡
- `docker compose exec`: 実行中コンテナでコマンド実行
- `docker compose run --rm`: 一時的なタスクを実行
- `docker compose build --no-cache`: キャッシュなしでビルド
- `docker compose config`: 設定を検証

次のセクションでは、これらのコマンドを活用した実際の開発環境の構築例を見ていきます。
