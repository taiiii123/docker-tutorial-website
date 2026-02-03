# ヘルスチェックの実装

## 概要

このセクションでは、Dockerコンテナのヘルスチェック機能について学びます。ヘルスチェックを実装することで、コンテナの健全性を自動的に監視し、問題のあるコンテナを早期に検出できます。

## ヘルスチェックとは

**ヘルスチェック**は、コンテナ内のアプリケーションが正常に動作しているかを定期的に確認する仕組みです。

### なぜヘルスチェックが必要か

| 問題 | 説明 |
|------|------|
| プロセス生存 ≠ 正常動作 | プロセスが動いていても、アプリがハングしている可能性がある |
| 依存サービスの障害 | データベース接続が切れても、プロセス自体は生きている |
| リソース枯渇 | メモリリークでアプリが応答しなくなる |

## コンテナのヘルスステータス

```
┌─────────────────────────────────────────────────────────┐
│                     コンテナ起動                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  starting   │ 起動中（ヘルスチェック開始前）              │
└─────────────────────────────────────────────────────────┘
                          │ start-period 経過
                          ▼
┌─────────────────────────────────────────────────────────┐
│  healthy    │ ヘルスチェック成功                         │
└─────────────────────────────────────────────────────────┘
                          │ ヘルスチェック連続失敗
                          ▼
┌─────────────────────────────────────────────────────────┐
│  unhealthy  │ ヘルスチェック失敗（retries回連続）        │
└─────────────────────────────────────────────────────────┘
```

## Dockerfile での設定

### 基本構文

```dockerfile
HEALTHCHECK [オプション] CMD コマンド
```

### オプション

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--interval` | 30s | チェック間隔 |
| `--timeout` | 30s | タイムアウト時間 |
| `--start-period` | 0s | 起動猶予期間 |
| `--retries` | 3 | 失敗許容回数 |

### 終了コード

| コード | 意味 |
|--------|------|
| 0 | healthy - 正常 |
| 1 | unhealthy - 異常 |

## ヘルスチェックの実装例

### HTTP エンドポイントのチェック

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm ci --only=production

# curlでHTTPエンドポイントをチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "index.js"]
```

### curl を使わない方法

Alpine イメージには curl が含まれていないため、wget や Node.js を使用します。

```dockerfile
# wget を使用
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Node.js を使用
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Python アプリケーション

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### データベースの接続チェック

```dockerfile
FROM postgres:16-alpine

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U postgres || exit 1
```

### Redis のヘルスチェック

```dockerfile
FROM redis:7-alpine

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD redis-cli ping | grep PONG || exit 1
```

## アプリケーション側のヘルスエンドポイント

### Node.js (Express)

```javascript
// ヘルスチェックエンドポイント
app.get('/health', async (req, res) => {
  try {
    // データベース接続チェック
    await db.query('SELECT 1');

    // 外部サービスチェック
    const cacheOk = await redis.ping();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: cacheOk ? 'ok' : 'degraded'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 軽量なライブネスチェック
app.get('/health/live', (req, res) => {
  res.status(200).send('OK');
});

// 詳細なレディネスチェック
app.get('/health/ready', async (req, res) => {
  // 依存サービスのチェック
  const ready = await checkDependencies();
  res.status(ready ? 200 : 503).json({ ready });
});
```

### Python (FastAPI)

```python
from fastapi import FastAPI, Response
from datetime import datetime
import asyncpg

app = FastAPI()

@app.get("/health")
async def health_check():
    try:
        # データベース接続チェック
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute("SELECT 1")
        await conn.close()

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "ok"
            }
        }
    except Exception as e:
        return Response(
            content={"status": "unhealthy", "error": str(e)},
            status_code=503
        )
```

## Docker Compose でのヘルスチェック

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### 依存関係の条件指定

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy  # DBがhealthyになるまで待機
      redis:
        condition: service_started  # 起動するだけでOK
```

## ヘルスチェックの確認

### ステータス確認

```bash
# コンテナ一覧でヘルスステータスを確認
docker ps
# CONTAINER ID   IMAGE   STATUS                   PORTS
# abc123         myapp   Up 5 minutes (healthy)   3000/tcp

# 詳細情報
docker inspect --format='{{json .State.Health}}' mycontainer | jq
```

### 出力例

```json
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2024-01-15T10:00:00.000000000Z",
      "End": "2024-01-15T10:00:00.123456789Z",
      "ExitCode": 0,
      "Output": "OK"
    }
  ]
}
```

### ヘルスイベントの監視

```bash
# ヘルスステータスの変化を監視
docker events --filter event=health_status
```

## ヘルスチェック無効化

### Dockerfile での無効化

```dockerfile
# ベースイメージのヘルスチェックを無効化
HEALTHCHECK NONE
```

### 実行時の無効化

```bash
docker run --no-healthcheck myimage
```

## ベストプラクティス

### 1. 適切な間隔設定

```dockerfile
# 頻繁すぎる: システムに負荷
HEALTHCHECK --interval=1s ...  # 悪い例

# 適切: 30秒間隔
HEALTHCHECK --interval=30s ...  # 良い例
```

### 2. 起動猶予期間の設定

```dockerfile
# アプリの起動時間を考慮
HEALTHCHECK --start-period=30s ...
```

### 3. 軽量なチェック

```dockerfile
# 重い処理は避ける
HEALTHCHECK CMD curl http://localhost/complex-check  # 悪い例

# シンプルなエンドポイント
HEALTHCHECK CMD curl http://localhost/health  # 良い例
```

### 4. 依存サービスのチェック

```javascript
// アプリケーションの責任範囲のみチェック
app.get('/health', async (req, res) => {
  // 自身の状態のみ確認
  res.status(200).send('OK');
});

// 依存サービスは別エンドポイントで
app.get('/health/ready', async (req, res) => {
  // DB、キャッシュなどをチェック
});
```

## トラブルシューティング

### ヘルスチェック失敗時の調査

```bash
# ヘルスチェックログの確認
docker inspect --format='{{json .State.Health.Log}}' mycontainer | jq

# コンテナ内で手動実行
docker exec mycontainer curl http://localhost:3000/health

# ログの確認
docker logs mycontainer
```

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 常にunhealthy | コマンドが見つからない | curl/wgetをインストール |
| タイムアウト | start-periodが短い | start-periodを延長 |
| 間欠的な失敗 | アプリの一時的な高負荷 | retriesを増やす |

## まとめ

- ヘルスチェックでコンテナの健全性を自動監視
- Dockerfileの`HEALTHCHECK`命令で設定
- 適切な間隔、タイムアウト、起動猶予期間を設定
- アプリケーション側にヘルスエンドポイントを実装
- Docker Composeで依存関係の起動順序を制御
- `docker inspect`でヘルスステータスを確認

次のセクションでは、コンテナのログ管理戦略について学びます。
