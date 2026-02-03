# ログの確認と管理

## 概要

このセクションでは、コンテナのログを確認・管理する方法を学びます。

## docker logs

コンテナの標準出力（stdout）と標準エラー（stderr）を表示します。

### 基本構文

```bash
docker logs [オプション] コンテナ名
```

### よく使うオプション

| オプション | 説明 |
|-----------|------|
| `-f, --follow` | ログをリアルタイムで追跡 |
| `--tail N` | 最後のN行のみ表示 |
| `-t, --timestamps` | タイムスタンプを表示 |
| `--since` | 指定時刻以降のログを表示 |
| `--until` | 指定時刻までのログを表示 |
| `--details` | 追加の詳細情報を表示 |

### 使用例

```bash
# すべてのログを表示
docker logs mycontainer

# リアルタイムで追跡
docker logs -f mycontainer

# 最後の100行のみ
docker logs --tail 100 mycontainer

# タイムスタンプ付き
docker logs -t mycontainer

# 出力例:
2024-01-15T10:30:00.000000000Z 172.17.0.1 - - [15/Jan/2024:10:30:00 +0000] "GET / HTTP/1.1" 200 615

# 最後の100行をリアルタイム追跡
docker logs --tail 100 -f mycontainer
```

### 時間範囲の指定

```bash
# 過去1時間のログ
docker logs --since 1h mycontainer

# 過去30分のログ
docker logs --since 30m mycontainer

# 特定の日時以降
docker logs --since "2024-01-15T10:00:00" mycontainer

# 時間範囲を指定
docker logs --since "2024-01-15T10:00:00" --until "2024-01-15T11:00:00" mycontainer
```

## ログドライバー

Dockerは複数のログドライバーをサポートしています。

### 利用可能なログドライバー

| ドライバー | 説明 |
|-----------|------|
| `json-file` | JSONファイル（デフォルト） |
| `local` | ローカルファイル（最適化） |
| `syslog` | Syslog サーバー |
| `journald` | systemd journal |
| `gelf` | Graylog Extended Log Format |
| `fluentd` | Fluentd |
| `awslogs` | Amazon CloudWatch Logs |
| `gcplogs` | Google Cloud Logging |
| `none` | ログを無効化 |

### ログドライバーの指定

```bash
# コンテナ起動時に指定
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx
```

### デフォルトログドライバーの設定

`/etc/docker/daemon.json`（Linux）または Docker Desktop の設定：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## ログのローテーション

### json-file ドライバーのローテーション

```bash
# ログサイズと世代数を制限
docker run -d \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx

# max-size: 1ファイルの最大サイズ
# max-file: 保持するファイル数
```

### local ドライバー（推奨）

```bash
docker run -d \
  --log-driver local \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx
```

`local` ドライバーは `json-file` より効率的で高速です。

## ログファイルの場所

### json-file ドライバーの場合

```bash
# ログファイルの場所を確認
docker inspect --format='{{.LogPath}}' mycontainer

# Linux の場合:
/var/lib/docker/containers/<container-id>/<container-id>-json.log

# ログファイルを直接確認
sudo cat /var/lib/docker/containers/<container-id>/<container-id>-json.log
```

### ログファイルの形式（JSON）

```json
{"log":"172.17.0.1 - - [15/Jan/2024:10:30:00 +0000] \"GET / HTTP/1.1\" 200 615\n","stream":"stdout","time":"2024-01-15T10:30:00.000000000Z"}
```

## 実践例

### Web サーバーのアクセスログ

```bash
# nginx を起動
docker run -d --name webserver -p 8080:80 nginx

# アクセスを生成
curl http://localhost:8080

# アクセスログを確認
docker logs webserver

# リアルタイムで監視
docker logs -f webserver

# エラーログのみ（grep でフィルタ）
docker logs webserver 2>&1 | grep error
```

### アプリケーションログの確認

```bash
# Node.js アプリのログ
docker logs myapp

# 特定のパターンを検索
docker logs myapp 2>&1 | grep "ERROR"

# 最近のエラーのみ
docker logs --since 1h myapp 2>&1 | grep -i error
```

## ログのフィルタリングと整形

### jq を使った整形

```bash
# JSON ログを整形して表示
docker logs mycontainer 2>&1 | jq -r '.log' 2>/dev/null || cat

# 特定のフィールドのみ抽出
cat /var/lib/docker/containers/<id>/<id>-json.log | jq -r '.log'
```

### awk/grep でのフィルタリング

```bash
# IP アドレスごとのアクセス数
docker logs webserver 2>&1 | awk '{print $1}' | sort | uniq -c | sort -rn

# 特定のステータスコードを抽出
docker logs webserver 2>&1 | grep '" 404 '

# 特定の時間範囲のログ
docker logs webserver 2>&1 | grep "15/Jan/2024:1[0-2]"
```

## ログの外部転送

### Fluentd への転送

```bash
docker run -d \
  --log-driver fluentd \
  --log-opt fluentd-address=localhost:24224 \
  --log-opt tag="docker.{{.Name}}" \
  nginx
```

### AWS CloudWatch への転送

```bash
docker run -d \
  --log-driver awslogs \
  --log-opt awslogs-region=ap-northeast-1 \
  --log-opt awslogs-group=my-log-group \
  --log-opt awslogs-stream=my-container \
  nginx
```

## ベストプラクティス

### 1. ログのローテーションを設定

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 2. 構造化ログを使用

アプリケーションでJSON形式のログを出力：

```javascript
console.log(JSON.stringify({
  level: 'info',
  message: 'User logged in',
  userId: 123,
  timestamp: new Date().toISOString()
}));
```

### 3. 本番環境では集中ログ管理

- Elasticsearch + Kibana
- Grafana Loki
- Datadog
- AWS CloudWatch

## まとめ

| コマンド/設定 | 説明 |
|-------------|------|
| `docker logs` | ログを表示 |
| `docker logs -f` | リアルタイム追跡 |
| `docker logs --tail N` | 最後のN行 |
| `docker logs --since` | 時間指定 |
| `--log-driver` | ログドライバーを指定 |
| `--log-opt max-size` | ログサイズ制限 |
| `--log-opt max-file` | ログ世代数制限 |

これで Chapter 2「基礎編 - イメージとコンテナ」は完了です。
次の Chapter 3 では、Dockerfile について学びます。
