# コンテナのライフサイクル

## 概要

このセクションでは、コンテナの状態遷移と各状態の意味について詳しく学びます。

## コンテナの状態

コンテナは以下の状態を持ちます：

| 状態 | 説明 |
|------|------|
| created | 作成済み（未起動） |
| running | 実行中 |
| paused | 一時停止中 |
| restarting | 再起動中 |
| exited | 終了 |
| dead | 異常終了 |

## 状態遷移図

```
                    docker create
                         │
                         ▼
                    ┌─────────┐
                    │ created │
                    └────┬────┘
                         │ docker start
                         ▼
    docker restart  ┌─────────┐  docker pause
         ┌─────────▶│ running │◀─────────┐
         │          └────┬────┘          │
         │               │               │
         │     docker stop/kill     docker unpause
         │               │               │
         │               ▼               │
         │          ┌─────────┐     ┌────────┐
         └──────────│ exited  │     │ paused │
                    └─────────┘     └────────┘
                         │
                    docker rm
                         │
                         ▼
                    [削除済み]
```

## 各状態の詳細

### created（作成済み）

`docker create` で作成されたが、まだ起動されていない状態。

```bash
# コンテナを作成のみ（起動しない）
docker create --name mycontainer nginx

# 状態を確認
docker ps -a --filter name=mycontainer
# STATUS: Created
```

### running（実行中）

コンテナのメインプロセスが実行中の状態。

```bash
# 実行中のコンテナを確認
docker ps

# 特定のコンテナの状態を確認
docker inspect --format='{{.State.Status}}' mycontainer
# 出力: running
```

### paused（一時停止中）

コンテナ内のすべてのプロセスが一時停止された状態。

```bash
# 一時停止
docker pause mycontainer

# 状態を確認
docker ps
# STATUS: Up X minutes (Paused)

# 再開
docker unpause mycontainer
```

### exited（終了）

コンテナのメインプロセスが終了した状態。終了コードが保存されます。

```bash
# 正常終了（終了コード 0）
docker run alpine echo "Hello"
docker ps -a
# STATUS: Exited (0) X seconds ago

# 異常終了（終了コード 1）
docker run alpine sh -c "exit 1"
docker ps -a
# STATUS: Exited (1) X seconds ago
```

### 終了コードの意味

| コード | 意味 |
|--------|------|
| 0 | 正常終了 |
| 1 | 一般的なエラー |
| 126 | コマンド実行不可 |
| 127 | コマンドが見つからない |
| 128+N | シグナルNで終了 |
| 137 | SIGKILL (128+9) |
| 143 | SIGTERM (128+15) |

```bash
# 終了コードを確認
docker inspect --format='{{.State.ExitCode}}' mycontainer
```

## コンテナのライフサイクル操作

### 作成から削除までの流れ

```bash
# 1. 作成
docker create --name lifecycle-demo nginx

# 2. 起動
docker start lifecycle-demo

# 3. 一時停止
docker pause lifecycle-demo

# 4. 再開
docker unpause lifecycle-demo

# 5. 停止
docker stop lifecycle-demo

# 6. 再起動
docker start lifecycle-demo

# 7. 強制停止
docker kill lifecycle-demo

# 8. 削除
docker rm lifecycle-demo
```

### ワンライナーでの作成と実行

```bash
# docker run = docker create + docker start
docker run -d --name mycontainer nginx
```

## イベントの監視

コンテナのライフサイクルイベントをリアルタイムで監視できます。

```bash
# イベントを監視
docker events

# 特定のコンテナのイベントのみ
docker events --filter container=mycontainer

# 出力例:
2024-01-15T10:30:00.000000000Z container create abc123... (name=mycontainer)
2024-01-15T10:30:01.000000000Z container start abc123... (name=mycontainer)
2024-01-15T10:31:00.000000000Z container stop abc123... (name=mycontainer)
2024-01-15T10:31:01.000000000Z container die abc123... (exitCode=0, name=mycontainer)
```

## 状態の詳細情報

### docker inspect での確認

```bash
docker inspect --format='{{json .State}}' mycontainer | jq .

# 出力例:
{
  "Status": "running",
  "Running": true,
  "Paused": false,
  "Restarting": false,
  "OOMKilled": false,
  "Dead": false,
  "Pid": 12345,
  "ExitCode": 0,
  "Error": "",
  "StartedAt": "2024-01-15T10:30:00.000000000Z",
  "FinishedAt": "0001-01-01T00:00:00Z"
}
```

### 重要なフィールド

| フィールド | 説明 |
|-----------|------|
| Status | 現在の状態 |
| Running | 実行中かどうか |
| Paused | 一時停止中かどうか |
| OOMKilled | メモリ不足で強制終了されたか |
| Pid | メインプロセスのPID |
| ExitCode | 終了コード |
| StartedAt | 開始時刻 |
| FinishedAt | 終了時刻 |

## 実践シナリオ

### 長時間実行サービス

```bash
# 常に再起動するWebサーバー
docker run -d \
  --name webserver \
  --restart=unless-stopped \
  -p 80:80 \
  nginx

# 状態を監視
docker stats webserver
```

### 一時的なタスク実行

```bash
# 実行後に自動削除
docker run --rm \
  -v $(pwd):/data \
  alpine \
  tar czf /data/backup.tar.gz /data/important

# コンテナは終了後に自動的に削除される
```

### ヘルスチェック付きコンテナ

```bash
docker run -d \
  --name healthy-nginx \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  nginx

# ヘルス状態を確認
docker ps
# STATUS: Up X minutes (healthy)
```

## まとめ

- コンテナは created, running, paused, exited, dead などの状態を持つ
- `docker inspect` で詳細な状態情報を確認できる
- `docker events` でリアルタイムにライフサイクルを監視できる
- 終了コードでコンテナの終了理由を判断できる
- 再起動ポリシーで自動回復を設定できる

次のセクションでは、コンテナ内での操作について学びます。
