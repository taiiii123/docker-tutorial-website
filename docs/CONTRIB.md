# コントリビューションガイド

**最終更新日:** 2026-02-03
**ソースオブトゥルース:** package.json

## 1. 開発環境セットアップ

### 前提条件

- Node.js 20.x 以上
- npm (Node.js に付属)
- Git

### インストール手順

```bash
# リポジトリのクローン
git clone <repository-url>
cd docker-tutorial-website

# 依存関係のインストール
npm install
```

### 環境変数

このプロジェクトでは環境変数ファイル (.env) は使用していません。
静的サイトとしてビルドされ、外部APIへの接続は行いません。

## 2. 利用可能なスクリプト

package.json から自動生成されたスクリプト一覧:

| スクリプト | コマンド | 説明 |
|-----------|----------|------|
| `dev` | `npm run dev` | Vite 開発サーバーを起動（ホットリロード対応） |
| `build` | `npm run build` | TypeScript コンパイル後、本番用ビルドを生成 |
| `lint` | `npm run lint` | ESLint による静的解析を実行 |
| `preview` | `npm run preview` | ビルド済みアプリケーションをプレビュー |
| `test` | `npm run test` | Vitest でテストを実行（ウォッチモード） |
| `test:ui` | `npm run test:ui` | Vitest UI でテストを実行 |
| `test:coverage` | `npm run test:coverage` | カバレッジレポート付きでテストを実行 |

### スクリプト詳細

#### 開発サーバー起動

```bash
npm run dev
```

- デフォルトで http://localhost:5173 で起動
- ファイル変更時に自動リロード
- React Fast Refresh 対応

#### ビルド

```bash
npm run build
```

- TypeScript のコンパイル (`tsc -b`)
- Vite による最適化ビルド
- 出力先: `dist/` ディレクトリ

#### テスト実行

```bash
# ウォッチモードでテスト
npm run test

# UIモードでテスト
npm run test:ui

# カバレッジ付きでテスト（CI向け）
npm run test:coverage
```

## 3. 技術スタック

### 本番依存関係

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| react | ^18.3.1 | UI ライブラリ |
| react-dom | ^18.3.1 | React DOM レンダリング |
| react-router-dom | ^6.22.0 | クライアントサイドルーティング |
| react-markdown | ^9.0.1 | Markdown のレンダリング |
| rehype-highlight | ^7.0.0 | シンタックスハイライト |
| rehype-raw | ^7.0.0 | HTML の生レンダリング |
| rehype-sanitize | ^6.0.0 | HTML サニタイズ |
| remark-gfm | ^4.0.0 | GitHub Flavored Markdown |
| zustand | ^4.5.0 | 状態管理 |
| clsx | ^2.1.0 | 条件付きクラス名結合 |
| fuse.js | ^7.1.0 | ファジー検索 |

### 開発依存関係

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| typescript | ^5.4.0 | TypeScript コンパイラ |
| vite | ^7.3.1 | ビルドツール |
| vitest | ^4.0.18 | テストフレームワーク |
| @vitest/coverage-v8 | ^4.0.18 | カバレッジレポート |
| @testing-library/react | ^14.2.1 | React テストユーティリティ |
| @testing-library/jest-dom | ^6.4.2 | DOM マッチャー |
| eslint | ^9.39.2 | 静的解析 |
| tailwindcss | ^3.4.1 | ユーティリティファースト CSS |
| @tailwindcss/typography | ^0.5.10 | 文章スタイリング |

## 4. 開発ワークフロー

### ブランチ戦略

```
master (本番)
└── feature/<feature-name>  (機能開発)
└── fix/<issue-description> (バグ修正)
└── docs/<doc-name>         (ドキュメント)
```

### コミットメッセージ規約

```
<type>: <description>

[optional body]
```

**Type 一覧:**
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更
- `perf`: パフォーマンス改善
- `ci`: CI/CD 設定

### プルリクエスト手順

1. feature ブランチを作成
2. 変更を実装
3. テストを追加・実行
4. lint を実行
5. プルリクエストを作成
6. レビューを受ける
7. マージ

## 5. テスト方針

### テストカバレッジ目標

- 全体: 80% 以上
- 新規コード: 必須

### テストの種類

| 種類 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest | コンポーネント、フック、ユーティリティ |
| 統合テスト | Vitest + RTL | ストア連携、ルーティング |
| E2E テスト | Playwright (今後導入) | ユーザーフロー |

### テストファイル配置

```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── ComponentName.test.tsx
├── hooks/
│   ├── useHookName.ts
│   └── useHookName.test.ts
└── utils/
    ├── utilName.ts
    └── utilName.test.ts
```

## 6. コーディング規約

### TypeScript

- `strict` モードを使用
- 明示的な型定義を推奨
- `any` の使用は最小限に

### React

- 関数コンポーネントを使用
- カスタムフックで状態ロジックを抽出
- Props の型定義は interface で

### スタイリング

- Tailwind CSS を使用
- カスタム CSS は最小限に
- clsx でクラス名を結合

## 7. ディレクトリ構造

```
docker-tutorial-website/
├── docs/              # ドキュメント
│   ├── spec/         # 仕様書
│   ├── tasks/        # タスク管理
│   └── requirements/ # 要件定義
├── src/               # ソースコード
│   ├── components/   # React コンポーネント
│   ├── pages/        # ページコンポーネント
│   ├── hooks/        # カスタムフック
│   ├── stores/       # Zustand ストア
│   ├── types/        # 型定義
│   ├── utils/        # ユーティリティ
│   ├── content/      # Markdown コンテンツ
│   └── styles/       # グローバルスタイル
├── public/            # 静的ファイル
└── dist/              # ビルド出力 (gitignore)
```

## 8. トラブルシューティング

### よくある問題

#### `npm install` が失敗する

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript エラーが出る

```bash
# 型チェックを実行
npx tsc --noEmit
```

#### テストが失敗する

```bash
# キャッシュをクリアしてテスト
npm run test -- --clearCache
```

## 9. 参照ドキュメント

- [プロジェクト概要仕様](./spec/overview-spec.md)
- [アーキテクチャ設計仕様](./spec/architecture-spec.md)
- [コンテンツ構造仕様](./spec/content-structure-spec.md)
