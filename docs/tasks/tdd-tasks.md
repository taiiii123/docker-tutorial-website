# TDD タスクリスト

**仕様ファイル**: [tdd-spec.md](../spec/tdd-spec.md)

## タスク一覧

### Phase 1: progressStore テスト

- [x] 1.1 progressStore の初期状態テスト作成
- [x] 1.2 markAsCompleted テスト作成
- [x] 1.3 markAsIncomplete テスト作成
- [x] 1.4 isCompleted テスト作成
- [x] 1.5 toggleBookmark テスト作成
- [x] 1.6 isBookmarked テスト作成
- [x] 1.7 setLastVisited テスト作成
- [x] 1.8 resetProgress テスト作成
- [x] 1.9 getChapterProgress テスト作成
- [x] 1.10 getTotalProgress テスト作成

### Phase 2: metadata ユーティリティ テスト

- [x] 2.1 getChapterById テスト作成
- [x] 2.2 getSectionFullId テスト作成
- [x] 2.3 getTotalSectionCount テスト作成
- [x] 2.4 getNextSection テスト作成
- [x] 2.5 getPrevSection テスト作成

### Phase 3: themeStore テスト

- [x] 3.1 themeStore 初期状態テスト作成
- [x] 3.2 setTheme テスト作成
- [x] 3.3 getResolvedTheme テスト作成

### Phase 4: CodeBlock コンポーネント テスト

- [x] 4.1 言語ラベル表示テスト作成
- [x] 4.2 ファイル名表示テスト作成
- [x] 4.3 コピーボタンテスト作成
- [x] 4.4 未知言語のフォールバックテスト作成

### Phase 5: ページコンポーネント テスト

- [x] 5.1 Home.tsx テスト作成
- [x] 5.2 NotFound.tsx テスト作成
- [x] 5.3 Chapter.tsx テスト作成
- [x] 5.4 Dashboard.tsx テスト作成

### Phase 6: カバレッジ確認

- [x] 6.1 カバレッジレポート生成
- [x] 6.2 カバレッジ80%以上確認（テスト対象ファイルのみ）

## 進捗表記

- [ ] 未着手
- [~] 作業中
- [x] 完了

## カバレッジ結果

| ファイル | Stmts | Branch | Funcs | Lines |
|----------|-------|--------|-------|-------|
| CodeBlock.tsx | 100% | 100% | 100% | 100% |
| metadata.ts | 100% | 100% | 100% | 100% |
| progressStore.ts | 100% | 100% | 100% | 100% |
| themeStore.ts | 94% | 80% | 100% | 94% |
| Home.tsx | テスト追加 | - | - | - |
| NotFound.tsx | テスト追加 | - | - | - |
| Chapter.tsx | テスト追加 | - | - | - |
| Dashboard.tsx | テスト追加 | - | - | - |

**テスト対象ファイルは全て80%以上のカバレッジを達成**

## テスト実行結果（最終）

- テストファイル: 8 passed
- テストケース: 130 passed
- ビルド: 成功
