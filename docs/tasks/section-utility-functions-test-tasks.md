# Section.tsx / TableOfContents.tsx ユーティリティ関数テスト タスクリスト

仕様: [section-utility-functions-test-spec.md](../spec/section-utility-functions-test-spec.md)

## タスク一覧

### Phase 1: エクスポート追加（準備）

- [x] T1: Section.tsx から `extractTextFromNode` をエクスポートする
- [x] T2: Section.tsx から `VALID_ID_PATTERN` をエクスポートする
- [x] T3: TableOfContents.tsx から `extractHeadings` をエクスポートする

### Phase 2: Section.tsx テスト作成（TDD）

- [x] T4: `extractTextFromNode` のテストを作成（22テスト）
  - [x] T4.1: null / undefined 入力で空文字列を返す
  - [x] T4.2: 文字列入力でそのまま返す（空文字列、日本語含む）
  - [x] T4.3: 数値入力で文字列に変換して返す（0, 負数, 小数含む）
  - [x] T4.4: 配列入力で結合して返す（混合型、null含む、ネスト含む）
  - [x] T4.5: ネストされた React 要素から再帰的にテキスト抽出
  - [x] T4.6: props を持たないオブジェクトで空文字列を返す
  - [x] T4.7: children が undefined のオブジェクトで空文字列を返す
  - [x] T4.8: boolean 入力で空文字列を返す

- [x] T5: `VALID_ID_PATTERN` のテストを作成（18テスト）
  - [x] T5.1: 有効なID（英小文字のみ）
  - [x] T5.2: 有効なID（数字のみ）
  - [x] T5.3: 有効なID（英小文字 + 数字 + ハイフン）
  - [x] T5.4: 無効なID（英大文字を含む）
  - [x] T5.5: 無効なID（スペースを含む）
  - [x] T5.6: 無効なID（スラッシュを含む：パストラバーサル対策）
  - [x] T5.7: 無効なID（ドットを含む：パストラバーサル対策）
  - [x] T5.8: 無効なID（空文字列）
  - [x] T5.9: 無効なID（日本語を含む）

### Phase 3: TableOfContents.tsx テスト作成（TDD）

- [x] T6: `generateHeadingId` のテストを作成（16テスト）
  - [x] T6.1: 英語テキストを小文字のハイフン区切りに変換
  - [x] T6.2: 日本語テキストをそのまま保持（ひらがな、カタカナ、漢字）
  - [x] T6.3: 英語と日本語の混合テキスト
  - [x] T6.4: 空文字列で空文字列を返す
  - [x] T6.5: 特殊文字が除去される（記号、括弧、コロン、バッククォート）
  - [x] T6.6: 連続スペースがハイフン1つに変換される

- [x] T7: `extractHeadings` のテストを作成（14テスト）
  - [x] T7.1: h2 見出しを抽出できる（単一、複数）
  - [x] T7.2: h3 見出しを抽出できる
  - [x] T7.3: h2 と h3 の混合を正しく抽出（順序確認）
  - [x] T7.4: h1 見出しは除外される
  - [x] T7.5: h4 以下の見出しは除外される（h4, h5, h6）
  - [x] T7.6: 空の Markdown で空配列を返す
  - [x] T7.7: 見出しがない Markdown で空配列を返す
  - [x] T7.8: ID 生成の正確性確認（英語、日本語、トリム）
  - [x] T7.9: 実際の Docker チュートリアルに近い Markdown の処理

### Phase 4: 検証

- [x] T8: 全テスト実行して全合格を確認（既存 215 + 新規 71 = 286 テスト合格）
