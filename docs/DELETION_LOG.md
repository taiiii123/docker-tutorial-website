# Code Deletion Log

## [2026-02-03] 不要コードクリーンアップ

### 依存関係の変更

#### 追加された依存関係
| パッケージ | バージョン | 理由 |
|------------|-----------|------|
| `@eslint/js` | ^9.39.2 | eslint.config.js で使用されていたが未インストール |
| `globals` | ^17.3.0 | eslint.config.js で使用されていたが未インストール |

#### 削除された依存関係（一時分析ツール）
| パッケージ | 理由 |
|------------|------|
| `knip` | 分析完了後不要 |
| `depcheck` | 分析完了後不要 |
| `ts-prune` | 分析完了後不要 |

### 削除された型定義

ファイル: `src/types/index.ts`

| 型名 | 削除理由 |
|------|----------|
| `CodeExample` | 未使用（どこからも参照されていない） |
| `TocItem` | `TableOfContents.tsx` でローカル定義が使用されており重複 |
| `UserProgress` | `progressStore.ts` で独自の `ProgressState` が使用されており未使用 |
| `SearchResult` | 未使用（将来の機能拡張用だったが実装予定なし） |
| `NavLink` | 未使用（将来の機能拡張用だったが実装予定なし） |

### 保持された項目

以下は分析で検出されたが、保持することを決定:

| 項目 | 保持理由 |
|------|----------|
| `chapter01Quizzes` 〜 `chapter04Quizzes` | `getQuizzesByChapterId()` 内で使用 |
| `allQuizzes` | 将来の全クイズ一覧機能で使用可能 |
| `@typescript-eslint/eslint-plugin` | `typescript-eslint` パッケージから間接使用 |
| `@typescript-eslint/parser` | `typescript-eslint` パッケージから間接使用 |
| `autoprefixer` | PostCSS プラグインとして使用 |
| `postcss` | Tailwind CSS のビルドに必要 |
| `@vitest/coverage-v8` | カバレッジレポートで使用 |

### 影響

- 削除されたファイル: 0
- 削除された型定義: 5
- 削除された依存関係: 3 パッケージ（一時分析ツール）
- 追加された依存関係: 2 パッケージ（未リスト解消）
- 削除されたコード行数: 約 55 行

### 検証結果

- ビルド成功: Yes
- 全テスト通過: Yes (165 tests)
- 手動テスト: 未実施（ビルド・テストの自動検証のみ）

### 分析ツールの出力

詳細な分析結果は `.reports/dead-code-analysis.md` を参照。
