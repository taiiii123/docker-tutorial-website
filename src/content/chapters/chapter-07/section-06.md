# リソース制限

## 概要

このセクションでは、Dockerコンテナのリソース制限について学びます。CPU、メモリ、その他のリソースを適切に制限することで、システムの安定性を確保し、DoS攻撃や暴走プロセスからホストを保護します。

## リソース制限の必要性

### 制限がない場合のリスク

```
┌─────────────────────────────────────────────────────────────┐
│           リソース制限がない場合のリスク                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. リソース枯渇攻撃（DoS）                                   │
│     └─→ 悪意のあるコンテナがすべてのリソースを消費           │
│                                                             │
│  2. 暴走プロセス                                            │
│     └─→ メモリリークやCPUスパイクでホストが不安定に          │
│                                                             │
│  3. ノイジーネイバー問題                                     │
│     └─→ 1つのコンテナが他のコンテナに影響                   │
│                                                             │
│  4. OOM（Out of Memory）                                    │
│     └─→ システム全体のメモリ不足で重要なプロセスが停止       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### リソース制限の効果

```
ホストマシン（16GB RAM, 8 CPU）
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Web         │  │ API         │  │ DB          │        │
│  │ Mem: 512MB  │  │ Mem: 1GB    │  │ Mem: 2GB    │        │
│  │ CPU: 0.5    │  │ CPU: 1.0    │  │ CPU: 2.0    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  各コンテナは制限を超えてリソースを使用できない               │
│  → システム全体の安定性が保たれる                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## メモリ制限

### 基本的なメモリ制限

```bash
# メモリを512MBに制限
docker run -d --memory=512m nginx

# メモリとスワップを制限
docker run -d --memory=512m --memory-swap=1g nginx

# スワップを無効化（メモリ制限と同じ値を設定）
docker run -d --memory=512m --memory-swap=512m nginx
```

### メモリ予約（ソフトリミット）

```bash
# メモリ予約を設定（ソフトリミット）
docker run -d --memory=1g --memory-reservation=512m nginx
```

- `--memory`: ハードリミット（超過するとOOMキラーが発動）
- `--memory-reservation`: ソフトリミット（メモリ不足時に適用）

### Docker Composeでの設定

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  api:
    build: ./api
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  db:
    image: postgres:15
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### メモリ使用状況の確認

```bash
# リアルタイムでリソース使用状況を確認
docker stats

# 出力例:
CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O       BLOCK I/O
a1b2c3d4e5f6   web    0.05%   32MiB / 512MiB      6.25%   1.2kB / 648B  0B / 0B
b2c3d4e5f6g7   api    1.20%   256MiB / 1GiB       25.00%  2.5MB / 1.8MB 4.1MB / 0B

# 特定のコンテナのみ
docker stats web api
```

## CPU制限

### CPU使用率の制限

```bash
# CPUを0.5コア（50%）に制限
docker run -d --cpus=0.5 nginx

# CPU期間と割り当てで制限
docker run -d --cpu-period=100000 --cpu-quota=50000 nginx
# 100000マイクロ秒のうち50000マイクロ秒使用可能 = 50%
```

### CPU共有の重み付け

```bash
# デフォルトは1024、高い値ほど優先度が高い
docker run -d --cpu-shares=512 low-priority-app
docker run -d --cpu-shares=2048 high-priority-app
```

### CPUコアの固定（ピン留め）

```bash
# 特定のCPUコアのみを使用
docker run -d --cpuset-cpus="0,1" nginx  # CPU 0と1のみ使用
docker run -d --cpuset-cpus="0-3" nginx  # CPU 0-3を使用
```

### Docker Composeでの設定

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          cpus: '0.5'
        reservations:
          cpus: '0.25'

  worker:
    build: ./worker
    deploy:
      resources:
        limits:
          cpus: '2.0'
        reservations:
          cpus: '1.0'
```

## OOM（Out of Memory）対策

### OOM Killerの動作

メモリ制限を超えると、LinuxのOOM Killerがコンテナ内のプロセスを強制終了します。

```bash
# OOMスコア調整（-1000から1000、高いほど先に終了される）
docker run -d --oom-score-adj=-500 critical-app

# OOM Killerを無効化（非推奨：ホスト全体に影響）
docker run -d --oom-kill-disable --memory=512m nginx
```

### OOMイベントの監視

```bash
# コンテナのOOMイベントを確認
docker inspect --format='{{.State.OOMKilled}}' mycontainer

# システムログでOOMを確認（Linux）
dmesg | grep -i oom
journalctl -k | grep -i oom
```

### アプリケーション側での対策

```javascript
// Node.js でのメモリ使用量監視
const v8 = require('v8');

function checkMemory() {
  const heapStats = v8.getHeapStatistics();
  const usedHeapSize = heapStats.used_heap_size;
  const heapSizeLimit = heapStats.heap_size_limit;

  console.log(`Memory usage: ${Math.round(usedHeapSize / 1024 / 1024)}MB / ${Math.round(heapSizeLimit / 1024 / 1024)}MB`);

  // 80%を超えたら警告
  if (usedHeapSize / heapSizeLimit > 0.8) {
    console.warn('High memory usage detected!');
  }
}

setInterval(checkMemory, 30000);
```

## その他のリソース制限

### プロセス数の制限

```bash
# プロセス数を100に制限（Fork Bomb対策）
docker run -d --pids-limit=100 nginx
```

### ディスクI/Oの制限

```bash
# 書き込み速度を制限（10MB/s）
docker run -d --device-write-bps /dev/sda:10mb nginx

# 読み込み速度を制限
docker run -d --device-read-bps /dev/sda:10mb nginx

# IOPSを制限
docker run -d --device-write-iops /dev/sda:1000 nginx
docker run -d --device-read-iops /dev/sda:1000 nginx
```

### ファイルディスクリプタの制限

```bash
# ファイルディスクリプタ数を制限
docker run -d --ulimit nofile=1024:2048 nginx
# ソフトリミット:1024、ハードリミット:2048
```

### Docker Composeでの総合的な設定

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
          pids: 100
        reservations:
          cpus: '0.5'
          memory: 256M
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
      nproc:
        soft: 100
        hard: 200
```

## リソース使用量の監視

### docker statsコマンド

```bash
# JSON形式で出力
docker stats --no-stream --format json

# カスタムフォーマット
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

### cAdvisorでの監視

```yaml
# docker-compose.yml
version: '3.8'

services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    deploy:
      resources:
        limits:
          memory: 128M
```

### Prometheusとの連携

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

## ベストプラクティス

### リソース制限の設計指針

```
┌─────────────────────────────────────────────────────────────┐
│              リソース制限設計指針                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 本番環境では必ず制限を設定                               │
│     └─→ メモリとCPUの両方を設定                             │
│                                                             │
│  2. 適切な値を設定                                          │
│     ├─→ 低すぎる: パフォーマンス低下、頻繁なOOM             │
│     └─→ 高すぎる: リソース無駄遣い、保護効果なし            │
│                                                             │
│  3. 監視とアラート                                          │
│     └─→ リソース使用率80%超で警告                           │
│                                                             │
│  4. 段階的に調整                                            │
│     └─→ 実際の使用量を見ながら最適化                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 環境別の設定例

```yaml
# docker-compose.yml（共通設定）
version: '3.8'

services:
  app:
    build: .
    # 開発環境では制限なし

# docker-compose.prod.yml（本番環境用オーバーライド）
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

```bash
# 本番環境で起動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## まとめ

- リソース制限はDoS攻撃や暴走プロセスからの保護に必須
- メモリ制限でOOMによるシステム全体の停止を防止
- CPU制限で公平なリソース配分を実現
- プロセス数制限でFork Bomb攻撃を防止
- 監視ツールで継続的にリソース使用量を確認
- 本番環境では必ず適切な制限を設定

次のセクションでは、セキュリティベストプラクティスの総まとめを学びます。
