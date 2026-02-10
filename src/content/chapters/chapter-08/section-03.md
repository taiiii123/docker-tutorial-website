# ログ管理戦略

## 概要

このセクションでは、Dockerコンテナのログ管理について学びます。適切なログ管理は、問題の診断、セキュリティ監査、パフォーマンス分析に不可欠です。

## Dockerのログアーキテクチャ

### ログの流れ

![ログアーキテクチャ](/images/diagrams/log-architecture.png)

### 12 Factor App のログ原則

コンテナでは、**ログはイベントストリームとして扱う**ことが推奨されます:

1. ログファイルに書き込まない
2. stdout/stderr に出力
3. 実行環境がログを収集・転送

## 基本的なログ操作

### ログの表示

```bash
# コンテナのログを表示
docker logs mycontainer

# 末尾100行を表示
docker logs --tail 100 mycontainer

# リアルタイムで追跡
docker logs -f mycontainer

# タイムスタンプ付きで表示
docker logs -t mycontainer

# 特定時間以降のログ
docker logs --since 2024-01-15T10:00:00 mycontainer
docker logs --since 1h mycontainer

# 組み合わせ
docker logs -f --tail 50 -t mycontainer
```

### Docker Compose でのログ

```bash
# 全サービスのログ
docker compose logs

# 特定サービスのログ
docker compose logs app

# リアルタイム追跡
docker compose logs -f app db

# 最新100行
docker compose logs --tail 100
```

## ログドライバーの設定

### 利用可能なログドライバー

| ドライバー | 説明 | ユースケース |
|-----------|------|-------------|
| `json-file` | JSONファイルに保存（デフォルト） | 開発、小規模運用 |
| `local` | カスタム形式でローカル保存 | 効率的なローカル保存 |
| `syslog` | Syslogサーバーに送信 | 既存のSyslog基盤 |
| `journald` | systemd journalに送信 | systemd環境 |
| `fluentd` | Fluentdに送信 | ログ集約・分析 |
| `awslogs` | Amazon CloudWatch Logsに送信 | AWS環境 |
| `gcplogs` | Google Cloud Loggingに送信 | GCP環境 |
| `none` | ログを無効化 | 機密データ、ベンチマーク |

### json-file ドライバーの設定

```bash
# 実行時に指定
docker run --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  myimage
```

### デーモン全体の設定

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5",
    "compress": "true"
  }
}
```

設定ファイルの場所:
- Linux: `/etc/docker/daemon.json`
- Windows: `C:\ProgramData\docker\config\daemon.json`

### Docker Compose での設定

```yaml
version: '3.8'

services:
  app:
    image: myapp
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  # ログを無効化
  noisy-service:
    image: noisy-app
    logging:
      driver: none
```

## 構造化ログ

### JSON形式でのログ出力

アプリケーションからJSONでログを出力すると、集約・分析が容易になります。

```javascript
// Node.js での構造化ログ
const log = {
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'User logged in',
  userId: '12345',
  ip: '192.168.1.1',
  duration: 45
};

console.log(JSON.stringify(log));
```

出力:
```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"User logged in","userId":"12345","ip":"192.168.1.1","duration":45}
```

### ログライブラリの使用

#### Node.js (pino)

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

logger.info({ userId: '12345', action: 'login' }, 'User logged in');
```

#### Python (structlog)

```python
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()
logger.info("user_login", user_id="12345", ip="192.168.1.1")
```

## ログ集約システム

### ELK Stack (Elasticsearch + Logstash + Kibana)

```yaml
version: '3.8'

services:
  app:
    image: myapp
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: app.logs

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  fluentd:
    image: fluent/fluentd:v1.16
    ports:
      - "24224:24224"
    volumes:
      - ./fluentd/conf:/fluentd/etc

volumes:
  es-data:
```

### Fluentd 設定例

```xml
# fluentd/conf/fluent.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter app.**>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match app.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name fluentd
  type_name _doc
</match>
```

### Loki + Grafana (軽量な代替)

```yaml
version: '3.8'

services:
  app:
    image: myapp
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
        loki-batch-size: "400"

  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  loki-data:
  grafana-data:
```

## ログのローテーション

### json-file ドライバーでのローテーション

```bash
# 最大10MB、最大5ファイル
docker run --log-opt max-size=10m --log-opt max-file=5 myimage
```

### logrotate の使用

```bash
# /etc/logrotate.d/docker-containers
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

## セキュリティとプライバシー

### 機密情報のマスキング

```javascript
const maskSensitiveData = (log) => {
  // パスワードをマスク
  if (log.password) {
    log.password = '***MASKED***';
  }

  // クレジットカード番号をマスク
  if (log.cardNumber) {
    log.cardNumber = log.cardNumber.replace(/\d{12}(\d{4})/, '****-****-****-$1');
  }

  return log;
};

logger.info(maskSensitiveData({
  action: 'payment',
  cardNumber: '1234567890123456',
  amount: 100
}));
```

### ログに含めてはいけない情報

| 種類 | 例 |
|------|-----|
| 認証情報 | パスワード、APIキー、トークン |
| 個人情報 | 住所、電話番号、メールアドレス |
| 金融情報 | クレジットカード番号、口座番号 |
| 健康情報 | 医療記録、診断結果 |

## ログレベルの設計

### 標準的なログレベル

| レベル | 用途 | 例 |
|--------|------|-----|
| `error` | エラー、例外 | データベース接続失敗 |
| `warn` | 警告、注意 | APIレート制限に近づいている |
| `info` | 一般的な情報 | ユーザーログイン |
| `debug` | デバッグ情報 | 関数の引数・戻り値 |
| `trace` | 詳細なトレース | HTTPリクエスト全体 |

### 環境別のログレベル

```yaml
services:
  app:
    environment:
      - LOG_LEVEL=${LOG_LEVEL:-info}
```

```bash
# 開発環境
LOG_LEVEL=debug docker compose up

# 本番環境
LOG_LEVEL=info docker compose up
```

## ログの検索とフィルタリング

### grep でのフィルタリング

```bash
# エラーのみ表示
docker logs mycontainer 2>&1 | grep -i error

# JSON ログの解析 (jq)
docker logs mycontainer | jq 'select(.level == "error")'

# 特定ユーザーのログ
docker logs mycontainer | jq 'select(.userId == "12345")'
```

### 時間範囲での絞り込み

```bash
# 過去1時間のログ
docker logs --since 1h mycontainer

# 特定時間範囲
docker logs --since 2024-01-15T10:00:00 --until 2024-01-15T11:00:00 mycontainer
```

## トラブルシューティング

### ログが表示されない場合

```bash
# ログドライバーの確認
docker inspect --format='{{.HostConfig.LogConfig.Type}}' mycontainer

# json-file以外のドライバーではdocker logsが使えないことがある
# fluentd, awslogs などは専用のツールで確認
```

### ディスク容量の問題

```bash
# Docker関連のディスク使用量
docker system df

# コンテナログのサイズ確認 (Linux)
sudo du -sh /var/lib/docker/containers/*/*-json.log

# 古いログの削除
truncate -s 0 /var/lib/docker/containers/CONTAINER_ID/*-json.log
```

## まとめ

- コンテナログはstdout/stderrに出力し、Dockerが収集
- `docker logs`で基本的なログ確認
- ログドライバーで保存先を設定（json-file, fluentd, awslogsなど）
- json-fileドライバーではmax-size, max-fileでローテーション
- 構造化ログ（JSON）で検索・分析を容易に
- ELK Stack や Loki + Grafana でログを集約
- 機密情報はログに含めない、または適切にマスク

次のセクションでは、コンテナの監視について学びます。
