# トラブルシューティングガイド

## 概要

このセクションでは、Dockerを使用する際によく遭遇する問題とその解決方法を解説します。エラーメッセージごとに原因と対処法をまとめています。

## コンテナ起動の問題

### コンテナがすぐに終了する

**症状**: `docker run` 後すぐにコンテナが停止する

```bash
$ docker run nginx
$ docker ps
# コンテナが表示されない

$ docker ps -a
# STATUS: Exited (0)
```

**原因と解決策**

1. **フォアグラウンドプロセスがない**

```bash
# 問題: シェルが終了してコンテナも終了
docker run ubuntu

# 解決: インタラクティブモードで実行
docker run -it ubuntu bash

# または、長時間実行されるコマンドを指定
docker run -d ubuntu tail -f /dev/null
```

2. **アプリケーションがバックグラウンドで起動している**

```dockerfile
# 問題: デーモンモードで起動
CMD ["nginx"]

# 解決: フォアグラウンドで起動
CMD ["nginx", "-g", "daemon off;"]
```

3. **起動スクリプトにエラーがある**

```bash
# ログを確認
docker logs コンテナ名

# 終了コードを確認
docker inspect --format='{{.State.ExitCode}}' コンテナ名
```

### "port is already allocated" エラー

**症状**: ポートが既に使用中

```bash
$ docker run -p 80:80 nginx
Error: port is already allocated
```

**解決策**

```bash
# 使用中のポートを確認
# Linux/Mac
sudo lsof -i :80
netstat -tulpn | grep :80

# Windows
netstat -ano | findstr :80

# 別のポートを使用
docker run -p 8080:80 nginx

# 既存のコンテナを停止
docker stop $(docker ps -q --filter "publish=80")
```

### "OCI runtime create failed" エラー

**症状**: コンテナの作成に失敗

```bash
Error: OCI runtime create failed: container_linux.go: starting container process caused...
```

**原因と解決策**

1. **実行ファイルが見つからない**

```dockerfile
# 問題: パスが間違っている
CMD ["/apps/start.sh"]

# 解決: パスを確認
CMD ["/app/start.sh"]
```

2. **改行コードの問題（Windows）**

```bash
# シェルスクリプトの改行コードをLFに変換
# Git設定
git config core.autocrlf input

# または .gitattributes
*.sh text eol=lf
```

3. **実行権限がない**

```dockerfile
# 実行権限を付与
RUN chmod +x /app/start.sh
```

## イメージビルドの問題

### "no such file or directory" エラー

**症状**: COPYやADDでファイルが見つからない

```bash
COPY package.json /app/
# => ERROR: no such file or directory
```

**解決策**

```bash
# ビルドコンテキストを確認
docker build -t myapp .

# .dockerignore を確認
cat .dockerignore

# ファイルの存在を確認
ls -la package.json

# ビルドコンテキストの内容を確認（デバッグ用）
docker build -t debug . -f - <<EOF
FROM busybox
COPY . /context/
RUN find /context -type f
EOF
```

### ビルドキャッシュが効かない

**症状**: 毎回最初からビルドされる

**解決策**

```dockerfile
# 問題: 頻繁に変更されるファイルを先にコピー
COPY . /app/
RUN npm install

# 解決: 依存関係ファイルを先にコピー
COPY package*.json /app/
RUN npm install
COPY . /app/
```

### "maximum file descriptors" エラー

**症状**: ビルド中にファイルディスクリプタが不足

```bash
# ulimit を確認
ulimit -n

# 一時的に増加
ulimit -n 65536
docker build .
```

## ネットワークの問題

### コンテナ間で通信できない

**症状**: 同じネットワーク内のコンテナに接続できない

```bash
$ docker exec web curl http://api:3000
curl: (6) Could not resolve host: api
```

**解決策**

```bash
# コンテナが同じネットワークにいるか確認
docker network inspect bridge

# カスタムネットワークを作成
docker network create mynetwork

# コンテナを同じネットワークで起動
docker run -d --name api --network mynetwork myapi
docker run -d --name web --network mynetwork myweb

# 既存のコンテナをネットワークに接続
docker network connect mynetwork existing-container
```

### "connection refused" エラー

**症状**: ポートに接続できない

```bash
$ curl http://localhost:8080
curl: (7) Failed to connect to localhost port 8080: Connection refused
```

**解決策**

```bash
# ポートマッピングを確認
docker port コンテナ名

# コンテナ内でリッスンしているか確認
docker exec コンテナ名 netstat -tlnp

# アプリケーションが0.0.0.0でリッスンしているか確認
# 127.0.0.1 だとホストからアクセスできない
# 設定例（Node.js）
app.listen(3000, '0.0.0.0');
```

### DNS解決に失敗する

**症状**: コンテナから外部ドメインにアクセスできない

```bash
$ docker exec mycontainer ping google.com
ping: bad address 'google.com'
```

**解決策**

```bash
# DNSサーバーを指定して起動
docker run --dns 8.8.8.8 myimage

# daemon.json で設定
# /etc/docker/daemon.json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}

# Docker Desktop の場合は設定画面からDNSを変更
```

## ボリュームの問題

### ボリュームにデータが保存されない

**症状**: コンテナを再起動するとデータが消える

```bash
# 問題: ボリュームなしで起動
docker run -d mysql

# 解決: ボリュームをマウント
docker run -d -v mysql-data:/var/lib/mysql mysql
```

### ファイルの権限エラー

**症状**: マウントしたボリュームに書き込めない

```bash
Error: EACCES: permission denied, open '/app/data/file.txt'
```

**解決策**

```dockerfile
# コンテナ内でユーザーを作成
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ディレクトリの所有者を変更
RUN chown -R appuser:appgroup /app/data

# ユーザーを切り替え
USER appuser
```

```bash
# ホスト側のディレクトリ権限を変更
sudo chown -R 1000:1000 ./data

# または特定のユーザーIDで実行
docker run -u $(id -u):$(id -g) -v ./data:/app/data myapp
```

### Windowsでのパス問題

**症状**: Windowsでボリュームマウントが動作しない

```bash
# 問題: バックスラッシュを使用
docker run -v C:\Users\data:/app/data myapp

# 解決: スラッシュを使用
docker run -v /c/Users/data:/app/data myapp

# または MSYS_NO_PATHCONV を設定
MSYS_NO_PATHCONV=1 docker run -v "$(pwd):/app" myapp
```

## リソースの問題

### "no space left on device" エラー

**症状**: ディスク容量不足

```bash
$ docker build -t myapp .
no space left on device
```

**解決策**

```bash
# Docker のディスク使用量を確認
docker system df

# 不要なリソースを削除
docker system prune

# さらに積極的に削除（注意）
docker system prune -a --volumes

# 個別に削除
docker container prune   # 停止中のコンテナ
docker image prune -a    # 未使用イメージ
docker volume prune      # 未使用ボリューム
docker network prune     # 未使用ネットワーク

# ビルドキャッシュを削除
docker builder prune
```

### メモリ不足（OOM）

**症状**: コンテナがメモリ不足で強制終了

```bash
$ docker logs mycontainer
Killed
```

**解決策**

```bash
# メモリ使用量を確認
docker stats

# メモリ制限を増加
docker run -m 2g myapp

# docker-compose.yml で設定
services:
  myapp:
    deploy:
      resources:
        limits:
          memory: 2G
```

### CPU使用率が高い

**解決策**

```bash
# CPU使用量を確認
docker stats

# CPU制限を設定
docker run --cpus="1.5" myapp

# docker-compose.yml で設定
services:
  myapp:
    deploy:
      resources:
        limits:
          cpus: "1.5"
```

## Docker Compose の問題

### "service ... depends on ... which is unhealthy"

**症状**: 依存サービスのヘルスチェックが失敗

```yaml
# 解決: ヘルスチェックの設定を追加・調整
services:
  db:
    image: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 30s

  app:
    depends_on:
      db:
        condition: service_healthy
```

### 環境変数が展開されない

**症状**: `${VAR}` がそのまま表示される

```bash
# .env ファイルが読み込まれているか確認
docker compose config

# .env ファイルの位置を確認（docker-compose.yml と同じディレクトリ）

# 環境変数を明示的に指定
docker compose --env-file .env.production up
```

### ネットワークが見つからない

```bash
# 外部ネットワークを事前に作成
docker network create mynetwork

# docker-compose.yml
networks:
  mynetwork:
    external: true
```

## Docker Desktop の問題

### Docker Desktop が起動しない

**Windows の場合**

```bash
# WSL2 を更新
wsl --update

# WSL を再起動
wsl --shutdown

# Hyper-V が有効か確認
# 「Windowsの機能の有効化または無効化」で確認

# Docker Desktop をリセット
# Settings > Troubleshoot > Reset to factory defaults
```

**Mac の場合**

```bash
# Docker Desktop の設定をリセット
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker
rm -rf ~/.docker

# Docker Desktop を再インストール
```

### WSL2 との統合問題

```bash
# WSL2 統合を確認
wsl -l -v

# デフォルトディストリビューションを設定
wsl --set-default Ubuntu

# Docker Desktop の設定で WSL 統合を有効化
# Settings > Resources > WSL Integration
```

## デバッグ手法

### コンテナ内でデバッグ

```bash
# 実行中のコンテナに接続
docker exec -it コンテナ名 bash
docker exec -it コンテナ名 sh

# 停止したコンテナをデバッグ
docker commit コンテナ名 debug-image
docker run -it debug-image bash

# エントリポイントを上書き
docker run -it --entrypoint bash myimage
```

### ログの詳細確認

```bash
# Docker デーモンのログ
# Linux
journalctl -u docker.service

# Mac/Windows (Docker Desktop)
# ログはDockerDesktopのGUIから確認可能

# コンテナの詳細なログ
docker logs --details コンテナ名

# JSON形式で出力
docker inspect コンテナ名 | jq
```

### ネットワークのデバッグ

```bash
# ネットワークを調査するコンテナ
docker run --rm -it --network container:ターゲットコンテナ名 \
  nicolaka/netshoot

# 利用可能なツール: curl, ping, netstat, ss, ip, tcpdump など
```

## まとめ

トラブルシューティングの基本手順

| 手順 | コマンド |
|------|---------|
| 1. ログを確認 | `docker logs コンテナ名` |
| 2. 状態を確認 | `docker inspect コンテナ名` |
| 3. プロセスを確認 | `docker top コンテナ名` |
| 4. リソースを確認 | `docker stats` |
| 5. コンテナ内を調査 | `docker exec -it コンテナ名 sh` |

よく使うデバッグコマンド

```bash
# コンテナの終了コードを確認
docker inspect --format='{{.State.ExitCode}}' コンテナ名

# コンテナのIPアドレスを確認
docker inspect --format='{{.NetworkSettings.IPAddress}}' コンテナ名

# 全コンテナのリソース使用量
docker stats --no-stream

# Dockerのシステム情報
docker system info
docker system df -v
```
