# Section.tsx / TableOfContents.tsx ユーティリティ関数テスト仕様

## 背景・目的（Why）

Section.tsx と TableOfContents.tsx には、Markdown コンテンツの処理やID生成に使用されるユーティリティ関数が存在する。
これらの関数はテストカバレッジが不足しており、リグレッションのリスクがある。
純粋関数として単体テストが容易なため、TDD アプローチでテストを追加する。

## 機能要件（What）

### テスト対象関数

#### 1. `extractTextFromNode` (Section.tsx)
- React ノードからテキストを再帰的に抽出する関数
- rehype-highlight によって children がオブジェクト化される問題への対応
- 入力: `ReactNode`（string, number, array, object, null, undefined）
- 出力: `string`

#### 2. `VALID_ID_PATTERN` (Section.tsx)
- URL パラメータ検証用の正規表現
- パストラバーサル対策として英小文字、数字、ハイフンのみを許可
- パターン: `/^[a-z0-9-]+$/`

#### 3. `generateHeadingId` (TableOfContents.tsx)
- テキストからスラッグ（ID）を生成する関数
- 日本語テキストに対応
- 入力: `string`
- 出力: `string`（小文字、ハイフン区切り、日本語文字保持）

#### 4. `extractHeadings` (TableOfContents.tsx)
- Markdown テキストから h2/h3 の見出しを抽出する関数
- 入力: `string`（Markdown テキスト）
- 出力: `TocItem[]`（id, text, level を持つオブジェクト配列）

## 非機能要件

- テストは Vitest で実行可能であること
- 既存の 215 テストを破壊しないこと
- テスト名は日本語で記述すること
- 既存コードのロジック変更は行わない（エクスポート追加のみ許可）

## 想定ユースケース

1. コードブロック内の React ノードからコードテキストを抽出（`extractTextFromNode`）
2. 見出しからアンカーリンク用 ID を生成（`generateHeadingId`）
3. Markdown から目次項目を自動生成（`extractHeadings`）
4. URL パラメータのセキュリティ検証（`VALID_ID_PATTERN`）

## エラーケース・例外条件

- null / undefined 入力
- 空文字列入力
- 特殊文字を含む入力
- 深くネストされた React ノード
- コードブロック内の見出し（抽出すべきでない）
- h1 見出し（抽出すべきでない）
- h4 以下の見出し（抽出すべきでない）

## 受け入れ条件（Acceptance Criteria）

- [ ] `extractTextFromNode` の全分岐パスがテストされている
- [ ] `VALID_ID_PATTERN` の正常系・異常系がテストされている
- [ ] `generateHeadingId` の日本語・英語・混合テキストがテストされている
- [ ] `extractHeadings` の h2/h3 抽出と h1/h4 除外がテストされている
- [ ] 全テストが `npx vitest run` で合格する
- [ ] 既存の 215 テストが全て合格する
