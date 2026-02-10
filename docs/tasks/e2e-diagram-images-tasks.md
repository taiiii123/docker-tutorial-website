# タスクリスト: E2E ダイアグラム画像テスト

## 対応仕様

- [docs/spec/e2e-diagram-images-spec.md](../spec/e2e-diagram-images-spec.md)

## タスク

- [x] 1. 既存 E2E テスト全件パス確認（46件）
- [x] 2. テスト対象セクション（chapter-01/section-01）の Markdown 内容を確認
- [x] 3. Section.tsx のカスタム img コンポーネント実装を確認
- [x] 4. CSS のダイアグラム画像スタイルを確認
- [x] 5. `tests/e2e/diagram-images.spec.ts` テストファイルを作成
  - [x] 5-1. ダイアグラム画像が表示されるテスト
  - [x] 5-2. loading="lazy" 属性テスト
  - [x] 5-3. alt 属性テスト
  - [x] 5-4. src パステスト
  - [x] 5-5. ダークモード対応テスト
- [x] 6. 全 E2E テスト実行して全件パス確認（51件: 既存46 + 新規5）
