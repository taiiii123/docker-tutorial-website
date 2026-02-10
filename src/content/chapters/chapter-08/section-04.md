# コンテナの監視

## 概要

このセクションでは、Dockerコンテナのリソース使用状況を監視する方法について学びます。CPU、メモリ、ネットワーク、ディスクI/Oなどのメトリクスを収集し、システムの健全性を把握します。

## なぜ監視が必要か

| 目的 | 説明 |
|------|------|
| 障害検知 | 問題を早期に発見し、ダウンタイムを最小化 |
| キャパシティプランニング | リソースの使用傾向を分析し、スケーリングを計画 |
| パフォーマンス最適化 | ボトルネックを特定し、効率を改善 |
| コスト最適化 | リソースの過剰割り当てを防ぐ |

## Docker組み込みの監視コマンド

### docker stats

リアルタイムでコンテナのリソース使用状況を表示します。

```bash
# 全コンテナの統計
docker stats

# 特定のコンテナ
docker stats mycontainer

# フォーマット指定
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 1回だけ表示して終了
docker stats --no-stream
```

出力例:
```
CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O
abc123         webapp    0.50%     128MiB / 512MiB       25.00%    1.2MB / 500kB     10MB / 5MB
def456         db        2.10%     256MiB / 1GiB         25.00%    500kB / 200kB     50MB / 100MB
```

### docker top

コンテナ内で実行中のプロセスを表示します。

```bash
# プロセス一覧
docker top mycontainer

# カスタムフォーマット
docker top mycontainer -o pid,user,%cpu,%mem,cmd
```

### docker inspect

コンテナの詳細情報を取得します。

```bash
# メモリ制限の確認
docker inspect --format='{{.HostConfig.Memory}}' mycontainer

# CPU制限の確認
docker inspect --format='{{.HostConfig.CpuShares}}' mycontainer

# ネットワーク設定
docker inspect --format='{{json .NetworkSettings.Networks}}' mycontainer | jq
```

## リソース制限の設定

### メモリ制限

```bash
# メモリを512MBに制限
docker run -m 512m myimage

# メモリ + スワップ制限
docker run -m 512m --memory-swap 1g myimage

# メモリ予約（ソフトリミット）
docker run -m 1g --memory-reservation 512m myimage
```

### CPU制限

```bash
# CPUコア数を制限
docker run --cpus 2 myimage

# 相対的な重み付け（デフォルト1024）
docker run --cpu-shares 512 myimage

# 特定のCPUコアに固定
docker run --cpuset-cpus 0,1 myimage
```

### Docker Compose での設定

```yaml
version: '3.8'

services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Prometheus + Grafana による監視

### アーキテクチャ

![Prometheus + Grafana アーキテクチャ](/images/diagrams/prometheus-grafana-arch.png)

### 監視スタックの構築

```yaml
version: '3.8'

services:
  # 監視対象のアプリケーション
  app:
    image: myapp
    ports:
      - "3000:3000"

  # コンテナメトリクス収集
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.0
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    privileged: true

  # 時系列データベース
  prometheus:
    image: prom/prometheus:v2.48.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'

  # ダッシュボード
  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
```

### Prometheus 設定

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Prometheus自身のメトリクス
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # cAdvisorからコンテナメトリクス
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # アプリケーションのメトリクス
  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
```

## アプリケーションメトリクスの公開

### Node.js (prom-client)

```javascript
const express = require('express');
const client = require('prom-client');

const app = express();

// デフォルトメトリクスを収集
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// カスタムメトリクス
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// リクエストの計測
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    end({ method: req.method, route: req.path, status_code: res.statusCode });
  });

  next();
});

// メトリクスエンドポイント
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(3000);
```

### Python (prometheus_client)

```python
from flask import Flask
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

app = Flask(__name__)

# カスタムメトリクス
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    latency = time.time() - request.start_time
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.path,
        status=response.status_code
    ).inc()
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.path
    ).observe(latency)
    return response

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}
```

## アラートの設定

### Prometheus Alertmanager

```yaml
# prometheus/alert.rules.yml
groups:
  - name: container_alerts
    rules:
      # コンテナダウン
      - alert: ContainerDown
        expr: absent(container_last_seen{name=~".+"})
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container is down"
          description: "Container {{ $labels.name }} is not running"

      # 高CPU使用率
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "Container {{ $labels.name }} CPU usage is above 90%"

      # 高メモリ使用率
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Container {{ $labels.name }} memory usage is above 90%"
```

### Alertmanager 設定

```yaml
# alertmanager/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'slack-notifications'
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx/yyy/zzz'
        channel: '#alerts'
        send_resolved: true
```

## Grafanaダッシュボード

### 主要なパネル例

#### CPU使用率

```
rate(container_cpu_usage_seconds_total{name=~".+"}[5m]) * 100
```

#### メモリ使用率

```
container_memory_usage_bytes{name=~".+"} / container_spec_memory_limit_bytes{name=~".+"} * 100
```

#### ネットワークI/O

```
# 受信
rate(container_network_receive_bytes_total{name=~".+"}[5m])

# 送信
rate(container_network_transmit_bytes_total{name=~".+"}[5m])
```

#### コンテナ再起動回数

```
increase(container_restart_count{name=~".+"}[24h])
```

## Docker Desktop の監視機能

Docker Desktop には組み込みの監視機能があります。

1. Docker Desktop を開く
2. 左メニューの「Containers」を選択
3. コンテナをクリックして詳細を表示
4. 「Stats」タブでリソース使用状況を確認

## 軽量な監視ツール

### ctop

ターミナルベースのコンテナ監視ツールです。

```bash
# インストール (Linux)
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# 実行
ctop
```

### lazydocker

TUIベースのDocker管理ツールです。

```bash
# インストール
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock lazyteam/lazydocker
```

## ベストプラクティス

### 1. リソース制限を必ず設定

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1'
```

### 2. 重要なメトリクスを監視

| メトリクス | 閾値例 | アクション |
|-----------|--------|-----------|
| CPU使用率 | > 80% | スケールアウト検討 |
| メモリ使用率 | > 85% | メモリリーク調査 |
| 再起動回数 | > 3回/時 | ログ調査 |
| レスポンスタイム | > 1秒 | パフォーマンス改善 |

### 3. ダッシュボードの整理

![Grafana ダッシュボードレイアウト](/images/diagrams/grafana-dashboard-layout.png)

## まとめ

- `docker stats`でリアルタイムにリソース使用状況を確認
- メモリとCPUの制限を設定してリソース枯渇を防止
- Prometheus + Grafana で本格的な監視基盤を構築
- cAdvisor でコンテナメトリクスを収集
- アプリケーションにメトリクスエンドポイントを実装
- Alertmanager でアラートを通知
- 重要なメトリクスに対して閾値とアラートを設定

次のセクションでは、バックアップとリストアについて学びます。
