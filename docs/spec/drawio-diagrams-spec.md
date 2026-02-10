# draw.io ダイアグラム導入仕様

## 1. 背景・目的（Why）

現在、チュートリアルコンテンツ内の図（アーキテクチャ図、フロー図、比較図等）は ASCII アートで表現されている。
ASCII アートはモバイル表示で崩れやすく、視覚的な訴求力が低い。

draw.io で作成した高品質な PNG 画像に置き換えることで、以下を実現する：

- 視覚的に分かりやすいチュートリアルコンテンツ
- モバイルでの表示崩れの解消
- 編集可能な `.drawio` ソースファイルの保持

## 2. 機能要件（What）

### 対象範囲（Phase 1）

chapter-01 の主要ダイアグラムを対象とする：

| # | ダイアグラム名 | 元ファイル | 内容 |
|---|--------------|-----------|------|
| 1 | VM vs コンテナ | section-02.md | VM・コンテナのアーキテクチャ比較（並列） |
| 2 | イメージとコンテナ | section-01.md | イメージからコンテナへのフロー |
| 3 | マイクロサービス | section-01.md | 3コンテナのマイクロサービス構成 |
| 4 | Union File System | section-02.md | レイヤー構造 |
| 5 | ハイブリッド構成 | section-02.md | VM上でコンテナを実行する構成 |

### ファイル配置

```
docker-tutorial-website/
├── docs/
│   └── diagrams/           # .drawio ソースファイル
│       ├── vm-vs-container.drawio
│       ├── docker-image-container.drawio
│       ├── docker-microservices.drawio
│       ├── docker-union-fs.drawio
│       └── docker-hybrid.drawio
└── public/
    └── images/
        └── diagrams/       # エクスポートされた PNG
            ├── vm-vs-container.png
            ├── docker-image-container.png
            ├── docker-microservices.png
            ├── docker-union-fs.png
            └── docker-hybrid.png
```

## 3. 非機能要件

- PNG 画像は白背景とする（ダークモードでも視認性を確保）
- 画像幅は 800px 程度（Retinaディスプレイ対応不要）
- `.drawio` ソースファイルも Git 管理対象とする
- Markdown 内で `![alt](/images/diagrams/xxx.png)` 形式で参照する

## 4. 想定ユースケース

- ユーザーがチュートリアルを閲覧時、ASCII図の代わりに見やすいPNG画像が表示される
- 開発者が図を更新する場合、`.drawio` ファイルを編集し PNG を再エクスポートする

## 5. 入出力仕様

### 入力
- `.drawio` XML ファイル（draw.io 形式）

### 出力
- `.png` ファイル（draw.io CLI でエクスポート）

### 変換コマンド
```bash
"C:\Program Files\draw.io\draw.io.exe" --export --format png --output <output.png> <input.drawio>
```

## 6. Markdown 内での使用方法

ASCII図を以下の形式で置き換える：

```markdown
![VM vs コンテナのアーキテクチャ比較](/images/diagrams/vm-vs-container.png)
```

## 7. 受け入れ条件

- [ ] 5つの `.drawio` ファイルが `docs/diagrams/` に作成されている
- [ ] 5つの `.png` ファイルが `public/images/diagrams/` に生成されている
- [ ] section-01.md, section-02.md の対象 ASCII 図が PNG 参照に置換されている
- [ ] ビルドが成功する
- [ ] ブラウザで画像が正しく表示される
