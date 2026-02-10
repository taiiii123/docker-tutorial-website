# draw.io ダイアグラム導入タスクリスト

**仕様**: [drawio-diagrams-spec.md](../spec/drawio-diagrams-spec.md)

## タスク一覧

### Phase 1: 準備

- [x] 仕様ファイル作成
- [x] タスクリスト作成
- [x] ディレクトリ作成（`docs/diagrams/`, `public/images/diagrams/`）

### Phase 2: draw.io ファイル作成（Phase 1 - 基礎）

- [x] vm-vs-container.drawio（VM vs コンテナアーキテクチャ比較）
- [x] docker-image-container.drawio（イメージとコンテナの関係）
- [x] docker-microservices.drawio（マイクロサービスアーキテクチャ）
- [x] docker-union-fs.drawio（Union File System レイヤー構造）
- [x] docker-hybrid.drawio（VM + コンテナハイブリッド構成）

### Phase 2b: draw.io ファイル作成（Phase 2 - アーキテクチャ）

- [x] docker-architecture.drawio（Docker 全体構成）
- [x] docker-engine-internal.drawio（Docker Engine 内部構造）
- [x] docker-compose-web.drawio（典型的な Web 構成）
- [x] docker-network-bridge.drawio（bridge ネットワーク構造）
- [x] container-lifecycle.drawio（コンテナライフサイクル状態遷移）
- [x] cicd-pipeline.drawio（CI/CD パイプライン）
- [x] kubernetes-architecture.drawio（Kubernetes アーキテクチャ）
- [x] security-defense-layers.drawio（多層防御構成）

### Phase 2c: draw.io ファイル作成（Phase 3 - 追加ダイアグラム）

- [x] isolation-level.drawio（VM vs コンテナ隔離レベル比較）
- [x] image-layers.drawio（イメージのレイヤー構造）
- [x] docker-desktop-arch.drawio（Docker Desktop アーキテクチャ 3プラットフォーム）
- [x] hello-world-flow.drawio（docker run hello-world 実行フロー）
- [x] dockerfile-image-container.drawio（Dockerfile・Image・Container の関係）
- [x] dockerhub-classification.drawio（Docker Hub イメージ分類）
- [x] compose-operation.drawio（Docker Compose 動作イメージ）
- [x] compose-network-config.drawio（Docker Compose ネットワーク構成）
- [x] port-mapping.drawio（ポートマッピングの仕組み）
- [x] cgroups-resource.drawio（cgroups によるリソース制限）
- [x] user-defined-bridge.drawio（ユーザー定義 bridge ネットワーク）
- [x] host-network.drawio（host ネットワーク構造）
- [x] overlay-network.drawio（Overlay ネットワーク構造）
- [x] custom-network-subnet.drawio（カスタムネットワーク構造）
- [x] internal-network.drawio（内部ネットワーク構造）
- [x] attack-vectors.drawio（コンテナの攻撃ベクター）
- [x] cicd-pipeline-detail.drawio（CI/CD パイプライン詳細ステージ）
- [x] k8s-cluster-overview.drawio（Kubernetes クラスター概要）
- [x] docker-k8s-workflow.drawio（Docker と Kubernetes の関係）
- [x] docker-run-flow.drawio（docker run nginx 実行フロー）

### Phase 3: PNG エクスポート

- [x] 全 33 個の .drawio ファイルを PNG に変換
- [x] public/images/diagrams/ に配置

### Phase 4: Markdown 更新

- [x] chapter-01/section-01.md（イメージ→コンテナ、マイクロサービス）
- [x] chapter-01/section-02.md（VM vs コンテナ、Union FS、ハイブリッド、隔離レベル）
- [x] chapter-01/section-03.md（Docker 全体構成、Engine 内部構造、レイヤー、通信フロー、Desktop アーキテクチャ）
- [x] chapter-01/section-05.md（hello-world 実行フロー）
- [x] chapter-02/section-01.md（レイヤー構造、Image-Container 関係）
- [x] chapter-02/section-02.md（Docker Hub イメージ分類）
- [x] chapter-02/section-05.md（コンテナライフサイクル）
- [x] chapter-04/section-01.md（Docker Compose Web 構成、動作イメージ）
- [x] chapter-04/section-02.md（ネットワーク構成）
- [x] chapter-05/section-01.md（bridge ネットワーク、ポートマッピング）
- [x] chapter-05/section-02.md（ユーザー定義bridge、host、overlay ネットワーク）
- [x] chapter-05/section-03.md（カスタムネットワーク、内部ネットワーク）
- [x] chapter-07/section-01.md（多層防御、cgroups、攻撃ベクター）
- [x] chapter-09/section-01.md（CI/CD パイプライン概要、詳細ステージ）
- [x] chapter-10/section-01.md（Kubernetes アーキテクチャ、クラスター概要、Docker-K8s 関係）

### Phase 2d: draw.io ファイル作成（Phase 4 - 残りの全 ASCII ダイアグラム）

#### Chapter 04（Docker Compose 実践）
- [x] compose-web-db-app.drawio（Web+DB+App 構成フロー）
- [x] compose-microservices-gateway.drawio（マイクロサービスゲートウェイ構成）
- [x] compose-ports-vs-expose.drawio（ports vs expose 比較）
- [x] compose-dns-resolution.drawio（Docker Compose DNS 解決）
- [x] compose-startup-order.drawio（サービス起動順序）

#### Chapter 05（ネットワーク・ストレージ）
- [x] container-communication.drawio（コンテナ間通信）
- [x] multiple-networks.drawio（複数ネットワーク接続）
- [x] network-security-isolation.drawio（ネットワークセキュリティ分離）
- [x] container-layers-rw.drawio（コンテナ読み書きレイヤー）
- [x] volume-management.drawio（ボリューム管理）
- [x] mount-types-comparison.drawio（マウントタイプ比較）
- [x] dev-mount-structure.drawio（開発環境マウント構造）
- [x] backup-strategy-321.drawio（バックアップ 3-2-1 ルール）

#### Chapter 07（セキュリティ）
- [x] root-execution-risk.drawio（root 実行リスク）
- [x] image-vulnerability-tree.drawio（イメージ脆弱性ツリー）
- [x] vulnerability-handling-flow.drawio（脆弱性対応フロー）
- [x] env-variable-leak.drawio（環境変数リークパス）
- [x] default-bridge-problem.drawio（デフォルト bridge 問題）
- [x] ideal-network-isolation.drawio（理想的ネットワーク分離）
- [x] resource-limit-risk.drawio（リソース制限なしリスク）
- [x] resource-allocation.drawio（リソース割り当て）
- [x] resource-limit-design.drawio（リソース制限設計）
- [x] cis-benchmark-categories.drawio（CIS ベンチマークカテゴリ）
- [x] incident-response-flow.drawio（インシデント対応フロー）

#### Chapter 08（運用・監視）
- [x] health-status-transition.drawio（ヘルスステータス遷移）
- [x] log-architecture.drawio（ログアーキテクチャ）
- [x] prometheus-grafana-arch.drawio（Prometheus+Grafana アーキテクチャ）
- [x] docker-backup-types.drawio（Docker バックアップ種類）
- [x] swarm-cluster.drawio（Swarm クラスター構成）
- [x] swarm-service-task.drawio（サービスとタスク関係）
- [x] swarm-ingress.drawio（Ingress ネットワーク）

#### Chapter 09（CI/CD）
- [x] github-actions-structure.drawio（GitHub Actions 構造）
- [x] auto-build-triggers.drawio（自動ビルドトリガー）
- [x] deployment-strategies.drawio（デプロイ戦略比較）

#### Chapter 10（Kubernetes）
- [x] container-vs-pod.drawio（コンテナ vs Pod 比較）
- [x] compose-vs-k8s-service.drawio（Compose vs K8s Service）
- [x] migration-flow.drawio（Docker→K8s 移行フロー）
- [x] pod-structure.drawio（Pod 構造）
- [x] docker-vs-k8s-container.drawio（Docker vs K8s コンテナ管理）
- [x] sidecar-pattern.drawio（サイドカーパターン）
- [x] pod-lifecycle.drawio（Pod ライフサイクル）
- [x] deployment-replicaset-pod.drawio（Deployment/ReplicaSet/Pod 階層）
- [x] label-selector-matching.drawio（ラベルセレクターマッチング）
- [x] rolling-update-flow.drawio（ローリングアップデートフロー）
- [x] docker-desktop-k8s.drawio（Docker Desktop K8s クラスター）

### Phase 3b: PNG エクスポート（追加 45 個）

- [x] 全 45 個の新規 .drawio ファイルを PNG に変換
- [x] public/images/diagrams/ に配置（合計 78 個）

### Phase 4b: Markdown 更新（追加 24 ファイル）

- [x] chapter-04/section-03.md（Web+DB+App、マイクロサービス、ports/expose、DNS）
- [x] chapter-04/section-05.md（起動順序）
- [x] chapter-05/section-04.md（コンテナ間通信、複数ネットワーク、セキュリティ分離）
- [x] chapter-05/section-05.md（コンテナレイヤー、ボリューム管理）
- [x] chapter-05/section-06.md（マウントタイプ、開発環境マウント）
- [x] chapter-05/section-07.md（バックアップ戦略）
- [x] chapter-07/section-02.md（root 実行リスク）
- [x] chapter-07/section-03.md（脆弱性ツリー、対応フロー）
- [x] chapter-07/section-04.md（環境変数リーク）
- [x] chapter-07/section-05.md（bridge 問題、ネットワーク分離）
- [x] chapter-07/section-06.md（リソース制限リスク、割り当て、設計）
- [x] chapter-07/section-07.md（CIS ベンチマーク、インシデント対応）
- [x] chapter-08/section-02.md（ヘルスステータス遷移）
- [x] chapter-08/section-03.md（ログアーキテクチャ）
- [x] chapter-08/section-04.md（Prometheus+Grafana）
- [x] chapter-08/section-05.md（バックアップ種類）
- [x] chapter-08/section-06.md（Swarm クラスター、サービス/タスク、Ingress）
- [x] chapter-09/section-02.md（GitHub Actions 構造）
- [x] chapter-09/section-04.md（自動ビルドトリガー）
- [x] chapter-09/section-05.md（デプロイ戦略）
- [x] chapter-10/section-02.md（コンテナ vs Pod、Compose vs K8s、移行フロー）
- [x] chapter-10/section-03.md（Pod 構造、Docker vs K8s、サイドカー、ライフサイクル）
- [x] chapter-10/section-04.md（Deployment 階層、ラベルセレクター、ローリングアップデート）
- [x] chapter-10/section-05.md（Docker Desktop K8s）

### Phase 2e: draw.io ファイル作成（Phase 5 - 最終スキャンで発見した残り）

#### Chapter 01（Docker Desktop GUI）
- [x] docker-desktop-dashboard.drawio（ダッシュボード画面）
- [x] docker-desktop-container-detail.drawio（コンテナ詳細画面）
- [x] docker-desktop-images.drawio（Images 一覧画面）
- [x] docker-desktop-resources.drawio（Resources 設定画面）
- [x] docker-desktop-menu.drawio（メニューバー）

#### その他
- [x] compose-dev-workflow.drawio（開発ワークフロー）
- [x] network-driver-comparison.drawio（ネットワークドライバー比較）
- [x] grafana-dashboard-layout.drawio（Grafana ダッシュボード）
- [x] docker-desktop-k8s-setup.drawio（K8s 設定画面）

### Phase 3c: PNG エクスポート（追加 9 個）

- [x] 全 9 個の新規 .drawio ファイルを PNG に変換
- [x] public/images/diagrams/ に配置（合計 87 個）

### Phase 4c: Markdown 更新（追加 5 ファイル）

- [x] chapter-01/section-06.md（Docker Desktop GUI 5 箇所）
- [x] chapter-04/section-06.md（開発ワークフロー）
- [x] chapter-05/section-02.md（ネットワークドライバー比較）
- [x] chapter-08/section-04.md（Grafana ダッシュボード）
- [x] chapter-10/section-05.md（Docker Desktop K8s 設定）

### Phase 2f: draw.io ファイル作成（Phase 6 - 2回目スキャンで発見）

- [x] dockerhub-repository-visibility.drawio（Docker Hub リポジトリ公開設定）
- [x] dockerfile-layer-structure.drawio（Dockerfile レイヤー構造）
- [x] cache-decision-flow.drawio（キャッシュ判定フロー）
- [x] startup-timing-no-depends.drawio（depends_on 未使用時の起動タイミング）
- [x] startup-timing-healthcheck.drawio（healthcheck 使用時の起動タイミング）
- [x] multi-service-startup-sequence.drawio（複数サービス起動シーケンス）
- [x] base-image-selection-flow.drawio（ベースイメージ選択フロー）

### Phase 3d: PNG エクスポート（追加 7 個）

- [x] 全 7 個の新規 .drawio ファイルを PNG に変換
- [x] public/images/diagrams/ に配置（合計 94 個）

### Phase 4d: Markdown 更新（追加 4 ファイル）

- [x] chapter-02/section-02.md（リポジトリ公開設定）
- [x] chapter-03/section-07.md（レイヤー構造、キャッシュ判定フロー）
- [x] chapter-04/section-05.md（起動タイミング 3 箇所）
- [x] chapter-06/section-03.md（ベースイメージ選択フロー）

### Phase 5: 検証

- [x] ビルド成功確認
- [x] PNG レイアウト・テキスト確認（全 33 個 - Phase 1-3）
- [x] PNG エクスポート確認（全 45 個 - Phase 4）
- [x] ビルド成功確認（全 78 個の PNG + 39 ファイルの Markdown 更新後）
- [x] 全チャプター再スキャン 1 回目（残存 9 箇所発見・変換完了）
- [x] ビルド成功確認（全 87 個の PNG + 44 ファイルの Markdown 更新後）
- [x] 全チャプター再スキャン 2 回目（残存 7 箇所発見・変換完了）
- [x] ビルド成功確認（全 94 個の PNG + 48 ファイルの Markdown 更新後）
- [x] 全チャプター再スキャン 3 回目（残存 3 箇所発見・変換完了）
  - chapter-06/section-04.md: 2 箇所（既存画像で置換）
  - chapter-10/section-04.md: 1 箇所（既存画像で置換）
- [x] 全チャプター再スキャン 4 回目（残存 1 箇所発見・変換完了）
  - chapter-07/section-04.md: secret-management-checklist.drawio 新規作成
- [x] ビルド成功確認（全 95 個の PNG + Markdown 更新後）
- [ ] ブラウザ表示確認（手動確認が必要）
