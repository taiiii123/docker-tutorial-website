# 運用マニュアル (RUNBOOK)

**最終更新日:** 2026-02-03
**ソースオブトゥルース:** package.json

## 1. プロジェクト概要

Docker学習教材ウェブサイトは、静的サイトとしてビルド・デプロイされる
React + TypeScript アプリケーションです。

### 技術スタック

- **フレームワーク:** React 18.3.1
- **ビルドツール:** Vite 7.3.1
- **言語:** TypeScript 5.4.0
- **スタイリング:** Tailwind CSS 3.4.1

## 2. デプロイ手順

### 2.1 ビルド

```bash
# 依存関係のインストール
npm ci

# 本番ビルド
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### 2.2 ビルド検証

```bash
# ローカルでプレビュー
npm run preview
```

http://localhost:4173 でビルド結果を確認できます。

### 2.3 デプロイ先オプション

| プラットフォーム | 設定 |
|-----------------|------|
| Vercel | `vercel.json` で設定（SPA ルーティング対応） |
| Netlify | `netlify.toml` または `_redirects` |
| GitHub Pages | GitHub Actions でビルド＆デプロイ |
| AWS S3 + CloudFront | 静的ホスティング |

### 2.4 デプロイチェックリスト

- [ ] `npm run build` が成功すること
- [ ] `npm run test:coverage` が 80% 以上であること
- [ ] `npm run lint` でエラーがないこと
- [ ] プレビューで主要機能が動作すること

## 3. モニタリングとアラート

### 3.1 フロントエンドモニタリング

静的サイトのため、以下のツールを推奨:

| ツール | 用途 |
|--------|------|
| Google Analytics | アクセス解析 |
| Sentry | エラートラッキング |
| Lighthouse CI | パフォーマンス監視 |

### 3.2 パフォーマンス指標

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| Lighthouse Performance | 90+ | Lighthouse |
| Lighthouse Accessibility | 90+ | Lighthouse |

### 3.3 アラート設定例

```yaml
# Sentry アラート設定例
rules:
  - name: "JavaScript Error Rate"
    conditions:
      - type: event_frequency
        value: 10
        interval: 1h
    actions:
      - type: notify_email
```

## 4. 一般的な問題と解決方法

### 4.1 ビルドエラー

#### TypeScript コンパイルエラー

**症状:** `npm run build` で型エラー

**対処法:**
```bash
# 型チェックのみ実行して詳細を確認
npx tsc --noEmit

# エラーの場所を特定して修正
```

#### 依存関係の競合

**症状:** `npm install` でバージョン競合

**対処法:**
```bash
# package-lock.json を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 4.2 ランタイムエラー

#### 白い画面（White Screen of Death）

**原因:** JavaScript 実行エラー

**対処法:**
1. ブラウザのコンソールでエラーを確認
2. Sentry でエラー詳細を確認
3. 該当コードを修正してデプロイ

#### ルーティングエラー (404)

**原因:** SPA ルーティング設定の不備

**対処法:**
- Vercel: `vercel.json` で rewrites 設定
- Netlify: `_redirects` ファイルを追加
- nginx: `try_files $uri /index.html` を設定

```json
// vercel.json 例
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4.3 パフォーマンス問題

#### 初回読み込みが遅い

**対処法:**
1. `npm run build` でバンドルサイズを確認
2. 不要な依存関係を削除
3. コード分割を検討

```bash
# バンドル解析
npx vite-bundle-visualizer
```

#### Lighthouse スコアが低い

**対処法:**
1. 画像の最適化（WebP 形式）
2. 不要な JavaScript の遅延読み込み
3. CSS のクリティカルパス最適化

## 5. ロールバック手順

### 5.1 Git ベースのロールバック

```bash
# 直前のコミットに戻す
git revert HEAD

# 特定のコミットに戻す
git revert <commit-hash>

# 変更をプッシュ
git push origin master
```

### 5.2 Vercel でのロールバック

1. Vercel ダッシュボードにアクセス
2. Deployments タブを開く
3. 戻したいデプロイの "..." メニューをクリック
4. "Promote to Production" を選択

### 5.3 ロールバック判断基準

| 状況 | 対応 |
|------|------|
| 重大なバグ（全機能停止） | 即時ロールバック |
| 部分的なバグ | 修正デプロイ or ロールバック |
| パフォーマンス劣化 | 原因調査後に判断 |

## 6. セキュリティ考慮事項

### 6.1 静的サイトのセキュリティ

- XSS 対策: `rehype-sanitize` で HTML をサニタイズ
- CSP ヘッダー: ホスティング側で設定
- HTTPS: 必須

### 6.2 依存関係の脆弱性チェック

```bash
# 脆弱性チェック
npm audit

# 自動修正
npm audit fix
```

### 6.3 定期的なメンテナンス

| 作業 | 頻度 |
|------|------|
| 依存関係の更新 | 月次 |
| 脆弱性チェック | 週次 |
| Lighthouse チェック | デプロイ毎 |

## 7. バックアップと復旧

### 7.1 バックアップ対象

静的サイトのため、以下をバックアップ:

- **ソースコード:** Git リポジトリ
- **ビルド成果物:** CI/CD で自動保存

### 7.2 復旧手順

```bash
# リポジトリからクローン
git clone <repository-url>
cd docker-tutorial-website

# 依存関係インストール
npm ci

# ビルド
npm run build

# デプロイ
# (プラットフォーム固有のコマンド)
```

## 8. 連絡先とエスカレーション

### 8.1 緊急連絡先

| 役割 | 担当 | 連絡方法 |
|------|------|----------|
| 開発リード | TBD | TBD |
| インフラ担当 | TBD | TBD |

### 8.2 エスカレーションフロー

```
Level 1: 開発者による調査・対応 (30分以内)
    ↓ 解決しない場合
Level 2: チームリードへ報告 (1時間以内)
    ↓ 解決しない場合
Level 3: マネージャーへエスカレーション
```

## 9. ログとデバッグ

### 9.1 ブラウザコンソール

```javascript
// 開発モードでのみログ出力
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### 9.2 Sentry によるエラー追跡

```typescript
// エラーを Sentry に送信（設定済みの場合）
import * as Sentry from '@sentry/react';

Sentry.captureException(error);
```

## 10. 定期メンテナンス

### 10.1 月次タスク

- [ ] 依存関係の更新
- [ ] セキュリティ脆弱性の確認
- [ ] Lighthouse パフォーマンスチェック
- [ ] 不要ファイルの削除

### 10.2 四半期タスク

- [ ] Node.js バージョンの確認
- [ ] ビルドツールのメジャーアップデート検討
- [ ] ドキュメントの見直し

## 11. 参照ドキュメント

- [コントリビューションガイド](./CONTRIB.md)
- [プロジェクト概要仕様](./spec/overview-spec.md)
- [アーキテクチャ設計仕様](./spec/architecture-spec.md)
