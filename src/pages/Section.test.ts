import { describe, it, expect } from 'vitest'
import { extractTextFromNode, VALID_ID_PATTERN } from './Section'

/**
 * Section.tsx ユーティリティ関数のテスト
 *
 * 仕様: docs/spec/section-utility-functions-test-spec.md
 */
describe('extractTextFromNode', () => {
  describe('null / undefined の処理', () => {
    it('null 入力で空文字列を返す', () => {
      expect(extractTextFromNode(null)).toBe('')
    })

    it('undefined 入力で空文字列を返す', () => {
      expect(extractTextFromNode(undefined)).toBe('')
    })
  })

  describe('プリミティブ値の処理', () => {
    it('文字列入力でそのまま返す', () => {
      expect(extractTextFromNode('hello world')).toBe('hello world')
    })

    it('空文字列入力で空文字列を返す', () => {
      expect(extractTextFromNode('')).toBe('')
    })

    it('日本語文字列を正しく返す', () => {
      expect(extractTextFromNode('Dockerの基本')).toBe('Dockerの基本')
    })

    it('数値入力で文字列に変換して返す', () => {
      expect(extractTextFromNode(42)).toBe('42')
    })

    it('数値 0 を文字列 "0" に変換して返す', () => {
      expect(extractTextFromNode(0)).toBe('0')
    })

    it('負の数値を文字列に変換して返す', () => {
      expect(extractTextFromNode(-1)).toBe('-1')
    })

    it('小数を文字列に変換して返す', () => {
      expect(extractTextFromNode(3.14)).toBe('3.14')
    })

    it('boolean の true で空文字列を返す', () => {
      // ReactNode の型定義では boolean は含まれるが、
      // extractTextFromNode はどの条件にも一致せず最後の return '' に到達する
      expect(extractTextFromNode(true as unknown as React.ReactNode)).toBe('')
    })

    it('boolean の false で空文字列を返す', () => {
      expect(extractTextFromNode(false as unknown as React.ReactNode)).toBe('')
    })
  })

  describe('配列の処理', () => {
    it('文字列の配列を結合して返す', () => {
      expect(extractTextFromNode(['hello', ' ', 'world'])).toBe('hello world')
    })

    it('空配列で空文字列を返す', () => {
      expect(extractTextFromNode([])).toBe('')
    })

    it('混合型の配列（文字列と数値）を結合して返す', () => {
      expect(extractTextFromNode(['port: ', 8080])).toBe('port: 8080')
    })

    it('null を含む配列で null を無視して結合する', () => {
      expect(extractTextFromNode(['hello', null, 'world'])).toBe('helloworld')
    })

    it('ネストされた配列を再帰的に処理する', () => {
      const nestedArray = [
        'start',
        ['middle1', 'middle2'],
        'end',
      ]
      expect(extractTextFromNode(nestedArray)).toBe('startmiddle1middle2end')
    })
  })

  describe('React 要素（オブジェクト）の処理', () => {
    it('children を持つ React 要素からテキストを抽出する', () => {
      const element = {
        props: {
          children: 'Docker コマンド',
        },
      }
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('Docker コマンド')
    })

    it('ネストされた React 要素から再帰的にテキストを抽出する', () => {
      const element = {
        props: {
          children: {
            props: {
              children: 'ネストされたテキスト',
            },
          },
        },
      }
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('ネストされたテキスト')
    })

    it('children が配列の React 要素を処理する', () => {
      const element = {
        props: {
          children: ['docker ', 'run'],
        },
      }
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('docker run')
    })

    it('props がない要素で空文字列を返す', () => {
      const element = {}
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('')
    })

    it('props はあるが children がない要素で空文字列を返す', () => {
      const element = {
        props: {
          className: 'test-class',
        },
      }
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('')
    })

    it('children が undefined の要素で空文字列を返す', () => {
      const element = {
        props: {
          children: undefined,
        },
      }
      // children が undefined の場合、条件 element.props?.children !== undefined は false
      // よって extractTextFromNode は呼ばれず、最後の return '' に到達
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('')
    })

    it('深くネストされた構造からテキストを抽出する', () => {
      // rehype-highlight が生成する典型的な構造をシミュレート
      const element = {
        props: {
          children: [
            {
              props: {
                children: 'const ',
              },
            },
            {
              props: {
                children: 'x',
              },
            },
            ' = ',
            {
              props: {
                children: '42',
              },
            },
          ],
        },
      }
      expect(extractTextFromNode(element as unknown as React.ReactNode)).toBe('const x = 42')
    })
  })
})

describe('VALID_ID_PATTERN', () => {
  describe('有効なIDパターン', () => {
    it('英小文字のみのIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('chapter')).toBe(true)
    })

    it('数字のみのIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('123')).toBe(true)
    })

    it('英小文字と数字の混合IDを許可する', () => {
      expect(VALID_ID_PATTERN.test('chapter01')).toBe(true)
    })

    it('ハイフン区切りのIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('chapter-01')).toBe(true)
    })

    it('複数ハイフンを含むIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('section-01-intro')).toBe(true)
    })

    it('典型的なセクションIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('section-01')).toBe(true)
    })

    it('1文字のIDを許可する', () => {
      expect(VALID_ID_PATTERN.test('a')).toBe(true)
    })
  })

  describe('無効なIDパターン（セキュリティ対策）', () => {
    it('英大文字を含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('Chapter-01')).toBe(false)
    })

    it('スペースを含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('chapter 01')).toBe(false)
    })

    it('スラッシュを含むIDを拒否する（パストラバーサル対策）', () => {
      expect(VALID_ID_PATTERN.test('chapter/01')).toBe(false)
    })

    it('ドットを含むIDを拒否する（パストラバーサル対策）', () => {
      expect(VALID_ID_PATTERN.test('../etc')).toBe(false)
    })

    it('ドット単体を拒否する', () => {
      expect(VALID_ID_PATTERN.test('.')).toBe(false)
    })

    it('空文字列を拒否する', () => {
      expect(VALID_ID_PATTERN.test('')).toBe(false)
    })

    it('日本語を含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('チャプター01')).toBe(false)
    })

    it('アンダースコアを含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('chapter_01')).toBe(false)
    })

    it('特殊文字を含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('chapter@01')).toBe(false)
    })

    it('バックスラッシュを含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('chapter\\01')).toBe(false)
    })

    it('クエリパラメータ文字を含むIDを拒否する', () => {
      expect(VALID_ID_PATTERN.test('chapter?id=01')).toBe(false)
    })
  })
})
