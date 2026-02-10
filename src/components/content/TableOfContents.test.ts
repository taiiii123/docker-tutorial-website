import { describe, it, expect } from 'vitest'
import { generateHeadingId, extractHeadings } from './TableOfContents'

/**
 * TableOfContents.tsx ユーティリティ関数のテスト
 *
 * 仕様: docs/spec/section-utility-functions-test-spec.md
 */
describe('generateHeadingId', () => {
  describe('英語テキストの変換', () => {
    it('英語テキストを小文字に変換する', () => {
      expect(generateHeadingId('Hello World')).toBe('hello-world')
    })

    it('既に小文字のテキストをそのまま返す', () => {
      expect(generateHeadingId('docker basics')).toBe('docker-basics')
    })

    it('大文字混じりのテキストを小文字に変換する', () => {
      expect(generateHeadingId('Docker Compose')).toBe('docker-compose')
    })
  })

  describe('日本語テキストの変換', () => {
    it('ひらがなを保持する', () => {
      const result = generateHeadingId('はじめに')
      expect(result).toBe('はじめに')
    })

    it('カタカナを保持する', () => {
      const result = generateHeadingId('コンテナ')
      expect(result).toBe('コンテナ')
    })

    it('漢字を保持する', () => {
      const result = generateHeadingId('基本操作')
      expect(result).toBe('基本操作')
    })

    it('日本語のスペース区切りをハイフンに変換する', () => {
      const result = generateHeadingId('Docker の基本')
      expect(result).toBe('docker-の基本')
    })
  })

  describe('英語と日本語の混合テキスト', () => {
    it('混合テキストのスペースをハイフンに変換する', () => {
      const result = generateHeadingId('Docker コンテナの操作')
      expect(result).toBe('docker-コンテナの操作')
    })

    it('英数字と日本語の混合', () => {
      const result = generateHeadingId('Chapter 1 はじめに')
      expect(result).toBe('chapter-1-はじめに')
    })
  })

  describe('特殊文字の処理', () => {
    it('空文字列で空文字列を返す', () => {
      expect(generateHeadingId('')).toBe('')
    })

    it('特殊記号が除去される', () => {
      // `!`, `@`, `#` 等は \w にも日本語範囲にもハイフンにも含まれないため除去
      const result = generateHeadingId('Hello! World?')
      expect(result).toBe('hello-world')
    })

    it('括弧が除去される', () => {
      const result = generateHeadingId('Docker (基本)')
      expect(result).toBe('docker-基本')
    })

    it('コロンが除去される', () => {
      const result = generateHeadingId('Docker: 入門')
      expect(result).toBe('docker-入門')
    })

    it('連続スペースが1つのハイフンに変換される', () => {
      const result = generateHeadingId('Docker    Compose')
      expect(result).toBe('docker-compose')
    })

    it('アンダースコアは保持される', () => {
      // \w には [a-zA-Z0-9_] が含まれるため、アンダースコアは保持
      const result = generateHeadingId('docker_compose')
      expect(result).toBe('docker_compose')
    })

    it('バッククォート付きコード記法が処理される', () => {
      // バッククォートは除去される（\w にも日本語にもハイフンにも含まれない）
      const result = generateHeadingId('`docker run` コマンド')
      expect(result).toBe('docker-run-コマンド')
    })
  })
})

describe('extractHeadings', () => {
  describe('h2 見出しの抽出', () => {
    it('単一の h2 見出しを抽出できる', () => {
      const markdown = '## はじめに'
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('はじめに')
      expect(result[0].level).toBe(2)
    })

    it('複数の h2 見出しを抽出できる', () => {
      const markdown = `## セクション1

テキスト

## セクション2

テキスト`
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('セクション1')
      expect(result[1].text).toBe('セクション2')
    })
  })

  describe('h3 見出しの抽出', () => {
    it('単一の h3 見出しを抽出できる', () => {
      const markdown = '### サブセクション'
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('サブセクション')
      expect(result[0].level).toBe(3)
    })
  })

  describe('h2 と h3 の混合', () => {
    it('h2 と h3 を正しい順序で抽出する', () => {
      const markdown = `## メインセクション

テキスト

### サブセクション1

テキスト

### サブセクション2

テキスト

## 次のセクション`
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({
        id: expect.any(String),
        text: 'メインセクション',
        level: 2,
      })
      expect(result[1]).toEqual({
        id: expect.any(String),
        text: 'サブセクション1',
        level: 3,
      })
      expect(result[2]).toEqual({
        id: expect.any(String),
        text: 'サブセクション2',
        level: 3,
      })
      expect(result[3]).toEqual({
        id: expect.any(String),
        text: '次のセクション',
        level: 2,
      })
    })
  })

  describe('除外すべき見出し', () => {
    it('h1 見出しは除外される', () => {
      const markdown = `# タイトル

## セクション`
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('セクション')
    })

    it('h4 見出しは除外される', () => {
      const markdown = `## セクション

#### サブサブセクション`
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('セクション')
    })

    it('h5 以下の見出しも除外される', () => {
      const markdown = `## セクション

##### h5 見出し
###### h6 見出し`
      const result = extractHeadings(markdown)

      expect(result).toHaveLength(1)
    })
  })

  describe('エッジケース', () => {
    it('空の Markdown で空配列を返す', () => {
      expect(extractHeadings('')).toEqual([])
    })

    it('見出しがない Markdown で空配列を返す', () => {
      const markdown = `これは本文です。

見出しはありません。

- リスト1
- リスト2`
      expect(extractHeadings(markdown)).toEqual([])
    })

    it('h1 のみの Markdown で空配列を返す', () => {
      const markdown = '# タイトルのみ'
      expect(extractHeadings(markdown)).toEqual([])
    })
  })

  describe('ID の生成', () => {
    it('英語の見出しから正しい ID を生成する', () => {
      const markdown = '## Docker Basics'
      const result = extractHeadings(markdown)

      expect(result[0].id).toBe('docker-basics')
    })

    it('日本語の見出しから正しい ID を生成する', () => {
      const markdown = '## コンテナの基本操作'
      const result = extractHeadings(markdown)

      // generateHeadingId と同じロジックで ID が生成される
      expect(result[0].id).toBe('コンテナの基本操作')
    })

    it('見出しテキストの前後の空白がトリムされる', () => {
      const markdown = '##   Docker Basics  '
      const result = extractHeadings(markdown)

      expect(result[0].text).toBe('Docker Basics')
      expect(result[0].id).toBe('docker-basics')
    })
  })

  describe('実際のコンテンツに近いケース', () => {
    it('典型的な Docker チュートリアルの Markdown を処理できる', () => {
      const markdown = `# Docker 入門

## Docker とは

Docker はコンテナ仮想化ツールです。

### インストール方法

公式サイトからダウンロードします。

### 動作確認

\`\`\`bash
docker --version
\`\`\`

## 基本コマンド

### docker run

コンテナを実行します。

### docker build

イメージをビルドします。`

      const result = extractHeadings(markdown)

      expect(result).toHaveLength(6)
      expect(result[0].text).toBe('Docker とは')
      expect(result[0].level).toBe(2)
      expect(result[1].text).toBe('インストール方法')
      expect(result[1].level).toBe(3)
      expect(result[2].text).toBe('動作確認')
      expect(result[2].level).toBe(3)
      expect(result[3].text).toBe('基本コマンド')
      expect(result[3].level).toBe(2)
      expect(result[4].text).toBe('docker run')
      expect(result[4].level).toBe(3)
      expect(result[5].text).toBe('docker build')
      expect(result[5].level).toBe(3)
    })
  })
})
