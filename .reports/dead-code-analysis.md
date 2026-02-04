# 不要コード分析レポート

**分析日時**: 2026-02-03
**分析ツール**: knip, depcheck, ts-prune
**ステータス**: 完了

---

## 実行結果サマリー

| カテゴリ | 検出数 | 対応結果 |
|----------|--------|----------|
| 未使用 devDependencies | 3 | 削除済み（分析ツール） |
| 未リスト依存関係 | 2 | インストール済み |
| 未使用エクスポート | 5 | 保持（内部使用） |
| 未使用型定義 | 5 | 5件削除済み |

---

## 実行済みアクション

### 1. 依存関係の修正

#### インストール済み
```bash
npm install -D @eslint/js globals
```

#### 削除済み
```bash
npm uninstall -D knip depcheck ts-prune
```

### 2. 削除された型定義 (src/types/index.ts)

| 型名 | 削除理由 |
|------|----------|
| `CodeExample` | 未使用 |
| `TocItem` | TableOfContents.tsx でローカル定義が重複 |
| `UserProgress` | progressStore で独自型を使用 |
| `SearchResult` | 未使用 |
| `NavLink` | 未使用 |

### 3. 保持された項目

| 項目 | 保持理由 |
|------|----------|
| `chapter01Quizzes` 〜 `chapter04Quizzes` | `getQuizzesByChapterId()` 内で使用 |
| `allQuizzes` | 将来の全クイズ一覧機能で使用可能 |
| `@typescript-eslint/eslint-plugin` | typescript-eslint から間接使用 |
| `@typescript-eslint/parser` | typescript-eslint から間接使用 |

---

## 検証結果

- ビルド成功: Yes
- 全テスト通過: Yes (165 tests)
- コンソールエラー: なし

---

## 詳細分析結果（アーカイブ）

### knip の出力

```
Unused devDependencies (4)
@typescript-eslint/eslint-plugin  package.json:34:6
@typescript-eslint/parser         package.json:35:6
depcheck                          package.json:39:6
ts-prune                          package.json:47:6

Unlisted dependencies (2)
@eslint/js  eslint.config.js:1:17
globals     eslint.config.js:2:22

Unused exports (5)
chapter01Quizzes  src/content/quizzes/index.ts:6:14
chapter02Quizzes  src/content/quizzes/index.ts:36:14
chapter03Quizzes  src/content/quizzes/index.ts:66:14
chapter04Quizzes  src/content/quizzes/index.ts:96:14
allQuizzes        src/content/quizzes/index.ts:114:14

Unused exported types (5)
CodeExample   interface  src/types/index.ts:41:18
TocItem       interface  src/types/index.ts:81:18
UserProgress  interface  src/types/index.ts:93:18
SearchResult  interface  src/types/index.ts:112:18
NavLink       interface  src/types/index.ts:130:18
```

### depcheck の出力

```
Unused devDependencies
* @typescript-eslint/eslint-plugin
* @typescript-eslint/parser
* @vitest/coverage-v8
* autoprefixer
* depcheck
* knip
* postcss
* ts-prune

Missing dependencies
* @eslint/js: eslint.config.js
* globals: eslint.config.js
```

### ts-prune の出力

```
\src\types\index.ts:4 - Level (used in module)
\src\types\index.ts:9 - Section (used in module)
\src\types\index.ts:23 - Chapter
\src\types\index.ts:41 - CodeExample
\src\types\index.ts:55 - QuizOption (used in module)
\src\types\index.ts:65 - Quiz
\src\types\index.ts:81 - TocItem
\src\types\index.ts:93 - UserProgress
\src\types\index.ts:107 - Theme
\src\types\index.ts:112 - SearchResult
\src\types\index.ts:130 - NavLink
\src\content\quizzes\index.ts:124 - getQuizzesByChapterId
\src\content\quizzes\index.ts:6 - chapter01Quizzes (used in module)
\src\content\quizzes\index.ts:36 - chapter02Quizzes (used in module)
\src\content\quizzes\index.ts:66 - chapter03Quizzes (used in module)
\src\content\quizzes\index.ts:96 - chapter04Quizzes (used in module)
\src\content\quizzes\index.ts:114 - allQuizzes
```

---

## 削除禁止リスト

以下は設定ファイルや重要なエントリポイントのため削除禁止:

- `src/main.tsx` - アプリケーションエントリポイント
- `src/App.tsx` - ルートコンポーネント
- `vite.config.ts` - Vite設定
- `tsconfig.json` - TypeScript設定
- `eslint.config.js` - ESLint設定
- `tailwind.config.js` - Tailwind設定
- `postcss.config.js` - PostCSS設定
