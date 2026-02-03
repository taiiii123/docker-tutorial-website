# TDD 仕様書 - Docker学習サイト

## 背景・目的（Why）

Docker学習サイトのコードベースに対してTDD（テスト駆動開発）を実施し、コードの品質と保守性を向上させる。

## 機能要件（What）

### テスト対象

1. **progressStore** - 学習進捗管理ストア
   - セクション完了管理
   - ブックマーク管理
   - 最終訪問記録
   - 進捗リセット
   - チャプター進捗率計算
   - 全体進捗率計算

2. **themeStore** - テーマ管理ストア
   - テーマ設定（light/dark/system）
   - システムテーマの取得
   - DOMへのテーマ適用

3. **metadata.ts ユーティリティ関数**
   - getChapterById - チャプターID検索
   - getSectionFullId - セクション完全ID生成
   - getTotalSectionCount - 全セクション数取得
   - getNextSection - 次セクション取得
   - getPrevSection - 前セクション取得

4. **CodeBlock コンポーネント**
   - 言語ラベル表示
   - ファイル名表示
   - コピーボタン機能
   - コピー済み状態表示

## 非機能要件

- テストカバレッジ: 80%以上
- テスト実行時間: 10秒以内
- テストの独立性: 各テストが他のテストに依存しない

## テストケース

### progressStore

| ケース | 入力 | 期待出力 |
|--------|------|----------|
| 初期状態 | - | completedSections: [], lastVisited: null, bookmarks: [] |
| セクション完了 | markAsCompleted('chapter-01/section-01') | completedSections に追加 |
| 重複完了マーク | 同じIDで2回呼び出し | 1回だけ追加 |
| 完了解除 | markAsIncomplete('chapter-01/section-01') | completedSections から削除 |
| ブックマーク追加 | toggleBookmark('chapter-01/section-01') | bookmarks に追加 |
| ブックマーク削除 | toggleBookmark（2回） | bookmarks から削除 |
| 進捗リセット | resetProgress() | 全て初期状態に |
| チャプター進捗率 | 3/6完了 | 50% |
| 全体進捗率 | 10/50完了 | 20% |

### metadata ユーティリティ

| 関数 | ケース | 入力 | 期待出力 |
|------|--------|------|----------|
| getChapterById | 存在するID | 'chapter-01' | Chapter オブジェクト |
| getChapterById | 存在しないID | 'chapter-99' | undefined |
| getSectionFullId | 正常 | 'chapter-01', 'section-01' | 'chapter-01/section-01' |
| getTotalSectionCount | 正常 | - | 全セクション数 |
| getNextSection | 同一チャプター内 | 'chapter-01', 'section-01' | section-02 |
| getNextSection | チャプター末尾 | 'chapter-01', 'section-06' | chapter-02/section-01 |
| getNextSection | 最後のセクション | 最終チャプター/最終セクション | null |
| getPrevSection | 同一チャプター内 | 'chapter-01', 'section-02' | section-01 |
| getPrevSection | チャプター先頭 | 'chapter-02', 'section-01' | chapter-01/section-06 |
| getPrevSection | 最初のセクション | 'chapter-01', 'section-01' | null |

### CodeBlock コンポーネント

| ケース | 入力 | 期待出力 |
|--------|------|----------|
| 言語ラベル表示 | language: 'dockerfile' | 'Dockerfile' 表示 |
| ファイル名優先 | filename: 'docker-compose.yml' | ファイル名が表示 |
| コピーボタン | クリック | 'コピー済み' 表示 |
| 未知の言語 | language: 'unknown' | 'UNKNOWN' 表示 |

## 受け入れ条件

- [ ] 全テストがパスする
- [ ] カバレッジ80%以上
- [ ] エッジケースがテストされている
- [ ] テストが独立して実行できる
