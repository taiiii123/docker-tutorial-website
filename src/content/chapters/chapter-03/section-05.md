# .dockerignoreの活用

## 概要

このセクションでは、.dockerignoreファイルの役割と効果的な使い方を学びます。.dockerignoreを適切に設定することで、ビルドの高速化、イメージサイズの削減、セキュリティの向上を実現できます。

## .dockerignoreとは

**.dockerignore**ファイルは、`docker build`コマンド実行時にビルドコンテキストから除外するファイルやディレクトリを指定するための設定ファイルです。

### 主な役割

| 役割 | 説明 |
|------|------|
| ビルド高速化 | 不要なファイルの転送をスキップ |
| イメージサイズ削減 | 不要なファイルがイメージに含まれない |
| セキュリティ向上 | 機密情報の誤コピーを防止 |
| キャッシュ効率化 | 関係ないファイルの変更でキャッシュが無効化されない |

### 基本的な仕組み

```
ビルドコンテキスト（プロジェクトディレクトリ）
├── .dockerignore  ← 除外ルールを定義
├── .git/          ← 除外対象
├── node_modules/  ← 除外対象
├── .env           ← 除外対象
├── Dockerfile
├── package.json
└── src/
    └── index.js
```

## ファイルの配置と命名

### 配置場所

.dockerignoreファイルは、**ビルドコンテキストのルート**（Dockerfileと同じディレクトリ）に配置します。

```bash
project/
├── .dockerignore  # ここに配置
├── Dockerfile
├── package.json
└── src/
```

### ファイル名

```
.dockerignore
```

ファイル名は固定で、拡張子はありません。

## 基本構文

### パターンマッチング

```dockerignore
# コメント
# ハッシュで始まる行はコメント

# ファイル名を指定
Dockerfile
README.md

# ディレクトリを指定
node_modules
.git

# ワイルドカード（任意の文字列）
*.log
*.tmp
*.md

# 単一文字のワイルドカード
temp?

# ディレクトリ内のすべて
logs/*

# 再帰的なマッチング（任意の深さ）
**/*.log
**/node_modules
```

### 否定パターン

```dockerignore
# すべてのmarkdownを除外
*.md

# ただしREADME.mdは含める
!README.md

# すべてを除外してから必要なものだけ含める
*
!src
!package.json
!package-lock.json
!Dockerfile
```

## 実践的な.dockerignore

### Node.jsプロジェクト

```dockerignore
# 依存関係（コンテナ内でインストールする）
node_modules
npm-debug.log

# ビルド成果物
dist
build
coverage

# テスト
test
tests
*.test.js
*.spec.js
__tests__

# 開発ツール
.eslintrc*
.prettierrc*
jest.config.js
tsconfig.json

# エディタ・IDE
.vscode
.idea
*.swp
*.swo
*~

# Git
.git
.gitignore

# 環境変数（機密情報）
.env
.env.*
!.env.example

# Docker関連
Dockerfile*
docker-compose*
.dockerignore

# ドキュメント
*.md
docs
LICENSE

# OS生成ファイル
.DS_Store
Thumbs.db
```

### Pythonプロジェクト

```dockerignore
# Python
__pycache__
*.py[cod]
*$py.class
.Python
*.so

# 仮想環境
venv
.venv
env
.env

# 依存関係
pip-log.txt
pip-delete-this-directory.txt

# テスト・カバレッジ
.pytest_cache
.coverage
htmlcov
.tox
.nox

# Jupyter
.ipynb_checkpoints

# エディタ
.vscode
.idea

# Git
.git
.gitignore

# 環境変数
.env
.env.*

# Docker
Dockerfile*
docker-compose*
.dockerignore

# ドキュメント
*.md
docs
```

### Go言語プロジェクト

```dockerignore
# バイナリ
*.exe
*.exe~
*.dll
*.so
*.dylib

# テスト
*_test.go
*.test
coverage.out

# 依存関係（モジュールキャッシュ）
vendor

# エディタ
.vscode
.idea

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.dockerignore

# ドキュメント
*.md
docs
```

## 高度なパターン

### 複数のDockerfileがある場合

```dockerignore
# すべてのDockerfileを除外
Dockerfile*

# ただしメインのDockerfileは含める（必要に応じて）
# !Dockerfile
```

### 特定のディレクトリ構造

```dockerignore
# ルートのnode_modulesのみ除外
/node_modules

# すべてのnode_modulesを除外
**/node_modules

# 特定のディレクトリ配下を除外
/packages/*/node_modules
```

### ホワイトリスト方式

すべてを除外してから必要なものだけ含める方法：

```dockerignore
# まずすべてを除外
*

# 必要なファイル・ディレクトリを追加
!src
!public
!package.json
!package-lock.json

# src内の不要ファイルを除外
src/**/*.test.js
src/**/*.spec.js
```

## ビルドコンテキストの確認

### サイズの確認

```bash
# ビルドコンテキストのサイズを確認
du -sh .

# 詳細を確認
du -h --max-depth=1 .

# ビルド時に転送されるサイズ
docker build . 2>&1 | grep "Sending build context"
# 出力例: Sending build context to Docker daemon  45.2MB
```

### 実際に含まれるファイルの確認

```bash
# .dockerignoreを適用したファイル一覧（概算）
git ls-files -o --exclude-standard

# tarで確認（正確）
tar -cvf - . 2>/dev/null | tar -tvf - | head -50
```

## .gitignoreとの違い

| 項目 | .gitignore | .dockerignore |
|------|------------|---------------|
| 目的 | Gitの追跡から除外 | ビルドコンテキストから除外 |
| 否定パターン | `!pattern` | `!pattern` |
| `**`の動作 | 任意のディレクトリ | 任意のディレクトリ |
| 適用タイミング | git add時 | docker build時 |

### 共通化のテクニック

```bash
# .gitignoreをベースに.dockerignoreを作成
cp .gitignore .dockerignore

# Docker固有の除外を追加
cat >> .dockerignore << 'EOF'

# Docker specific
Dockerfile*
docker-compose*
.dockerignore
*.md
docs/
EOF
```

## パフォーマンスへの影響

### ビルド時間の比較

```bash
# .dockerignoreなし（node_modulesが含まれる）
# Sending build context to Docker daemon  500MB
# Build time: 45s

# .dockerignoreあり（node_modulesを除外）
# Sending build context to Docker daemon  5MB
# Build time: 15s
```

### キャッシュ効率の向上

```dockerignore
# テストファイルを除外すると、テスト変更でキャッシュが無効化されない
*.test.js
*.spec.js
__tests__

# ドキュメント変更でもキャッシュが維持される
*.md
docs
```

## セキュリティ上の重要性

### 除外すべき機密ファイル

```dockerignore
# 環境変数・設定
.env
.env.*
*.env
config/secrets.yml
config/credentials.yml

# SSH鍵
.ssh
*.pem
*.key
id_rsa
id_rsa.pub

# 認証情報
.npmrc
.pypirc
.docker/config.json

# クラウド認証
.aws
.gcloud
.azure

# 証明書
*.crt
*.p12
*.pfx
```

### 事故を防ぐパターン

```dockerignore
# パスワード・トークンが含まれそうなファイル
*password*
*secret*
*token*
*credential*
*key*

# ただし公開鍵は含めてもよい場合
!*.pub
```

## トラブルシューティング

### ファイルが除外されない場合

```bash
# パターンのテスト
# gitignoreと同じルールなので、git check-ignoreが参考になる
echo "test.log" | git check-ignore --stdin

# ビルドして確認
docker build -t test . && docker run --rm test ls -la
```

### よくある間違い

```dockerignore
# 間違い：スラッシュで始まるとルートからの相対パス
/node_modules    # ルートのnode_modulesのみ

# 正しい：すべてのnode_modules
node_modules
**/node_modules

# 間違い：スペースが含まれている
node_modules   # 末尾にスペースがあると動作しない

# 間違い：ディレクトリの末尾にスラッシュ
# （動作するが、スラッシュなしでも同じ）
node_modules/
node_modules   # 推奨
```

### 否定パターンの順序

```dockerignore
# 間違い：否定パターンが先
!important.md
*.md

# 正しい：除外してから否定
*.md
!important.md
```

## まとめ

- .dockerignoreはビルドコンテキストから除外するファイルを指定
- node_modules、.git、.envなどを除外してビルドを高速化
- セキュリティのため、機密情報は必ず除外
- ホワイトリスト方式で厳密に管理することも可能
- 否定パターンは除外パターンの後に記述

次のセクションでは、イメージのビルドとタグ付けについて学びます。
