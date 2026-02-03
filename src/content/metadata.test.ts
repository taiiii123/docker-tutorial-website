import { describe, it, expect } from 'vitest'
import {
  chapters,
  getChapterById,
  getSectionFullId,
  getTotalSectionCount,
  getNextSection,
  getPrevSection,
} from './metadata'

/**
 * metadata.ts ユーティリティ関数のテスト
 */
describe('metadata ユーティリティ', () => {
  describe('chapters データ', () => {
    it('チャプターが定義されている', () => {
      expect(chapters).toBeDefined()
      expect(chapters.length).toBeGreaterThan(0)
    })

    it('各チャプターが必須プロパティを持つ', () => {
      chapters.forEach((chapter) => {
        expect(chapter.id).toBeDefined()
        expect(chapter.number).toBeDefined()
        expect(chapter.title).toBeDefined()
        expect(chapter.description).toBeDefined()
        expect(chapter.level).toBeDefined()
        expect(chapter.sections).toBeDefined()
        expect(Array.isArray(chapter.sections)).toBe(true)
      })
    })

    it('各セクションが必須プロパティを持つ', () => {
      chapters.forEach((chapter) => {
        chapter.sections.forEach((section) => {
          expect(section.id).toBeDefined()
          expect(section.title).toBeDefined()
          expect(section.slug).toBeDefined()
        })
      })
    })
  })

  describe('getChapterById', () => {
    it('存在するチャプターIDで正しいチャプターを返す', () => {
      const chapter = getChapterById('chapter-01')

      expect(chapter).toBeDefined()
      expect(chapter?.id).toBe('chapter-01')
      expect(chapter?.number).toBe(1)
    })

    it('存在しないチャプターIDで undefined を返す', () => {
      const chapter = getChapterById('chapter-99')
      expect(chapter).toBeUndefined()
    })

    it('空文字列で undefined を返す', () => {
      const chapter = getChapterById('')
      expect(chapter).toBeUndefined()
    })

    it('全てのチャプターが取得可能', () => {
      chapters.forEach((expectedChapter) => {
        const chapter = getChapterById(expectedChapter.id)
        expect(chapter).toBeDefined()
        expect(chapter?.id).toBe(expectedChapter.id)
      })
    })
  })

  describe('getSectionFullId', () => {
    it('チャプターIDとセクションIDを結合する', () => {
      const fullId = getSectionFullId('chapter-01', 'section-01')
      expect(fullId).toBe('chapter-01/section-01')
    })

    it('異なるチャプターとセクションの組み合わせ', () => {
      const fullId = getSectionFullId('chapter-05', 'section-03')
      expect(fullId).toBe('chapter-05/section-03')
    })

    it('空文字列でも結合される', () => {
      const fullId = getSectionFullId('', '')
      expect(fullId).toBe('/')
    })
  })

  describe('getTotalSectionCount', () => {
    it('全セクション数を返す', () => {
      const count = getTotalSectionCount()
      expect(count).toBeGreaterThan(0)
    })

    it('各チャプターのセクション数の合計と一致する', () => {
      const expectedCount = chapters.reduce(
        (total, chapter) => total + chapter.sections.length,
        0
      )
      const count = getTotalSectionCount()
      expect(count).toBe(expectedCount)
    })
  })

  describe('getNextSection', () => {
    it('同じチャプター内の次のセクションを返す', () => {
      const next = getNextSection('chapter-01', 'section-01')

      expect(next).not.toBeNull()
      expect(next?.chapterId).toBe('chapter-01')
      expect(next?.sectionId).toBe('section-02')
    })

    it('チャプターの最後のセクションから次のチャプターの最初のセクションを返す', () => {
      // chapter-01 の最後のセクションを取得
      const chapter01 = getChapterById('chapter-01')
      const lastSectionId = chapter01?.sections[chapter01.sections.length - 1].id

      const next = getNextSection('chapter-01', lastSectionId!)

      expect(next).not.toBeNull()
      expect(next?.chapterId).toBe('chapter-02')
      expect(next?.sectionId).toBe('section-01')
    })

    it('最後のチャプターの最後のセクションで null を返す', () => {
      // 最後のチャプターを取得
      const lastChapter = chapters[chapters.length - 1]
      const lastSectionId = lastChapter.sections[lastChapter.sections.length - 1].id

      const next = getNextSection(lastChapter.id, lastSectionId)
      expect(next).toBeNull()
    })

    it('存在しないチャプターIDで null を返す', () => {
      const next = getNextSection('chapter-99', 'section-01')
      expect(next).toBeNull()
    })

    it('存在しないセクションIDでもチャプターが存在すれば処理される', () => {
      // セクションが見つからない場合、findIndex は -1 を返す
      // その後の処理は実装依存だが、エラーにならないことを確認
      const next = getNextSection('chapter-01', 'section-99')
      // findIndex が -1 の場合、sectionIndex < chapter.sections.length - 1 が true になり
      // chapter.sections[0] を返す
      expect(next).not.toBeNull()
    })
  })

  describe('getPrevSection', () => {
    it('同じチャプター内の前のセクションを返す', () => {
      const prev = getPrevSection('chapter-01', 'section-02')

      expect(prev).not.toBeNull()
      expect(prev?.chapterId).toBe('chapter-01')
      expect(prev?.sectionId).toBe('section-01')
    })

    it('チャプターの最初のセクションから前のチャプターの最後のセクションを返す', () => {
      const prev = getPrevSection('chapter-02', 'section-01')

      expect(prev).not.toBeNull()
      expect(prev?.chapterId).toBe('chapter-01')
      // chapter-01 の最後のセクション
      const chapter01 = getChapterById('chapter-01')
      const expectedSectionId = chapter01?.sections[chapter01.sections.length - 1].id
      expect(prev?.sectionId).toBe(expectedSectionId)
    })

    it('最初のチャプターの最初のセクションで null を返す', () => {
      const prev = getPrevSection('chapter-01', 'section-01')
      expect(prev).toBeNull()
    })

    it('存在しないチャプターIDで null を返す', () => {
      const prev = getPrevSection('chapter-99', 'section-01')
      expect(prev).toBeNull()
    })

    it('セクション03から02への移動', () => {
      const prev = getPrevSection('chapter-01', 'section-03')

      expect(prev).not.toBeNull()
      expect(prev?.chapterId).toBe('chapter-01')
      expect(prev?.sectionId).toBe('section-02')
    })
  })

  describe('ナビゲーションの一貫性', () => {
    it('getNextSection と getPrevSection が逆関係になる', () => {
      const startChapter = 'chapter-02'
      const startSection = 'section-03'

      // 次に移動
      const next = getNextSection(startChapter, startSection)
      expect(next).not.toBeNull()

      // 前に戻る
      const prev = getPrevSection(next!.chapterId, next!.sectionId)
      expect(prev).not.toBeNull()
      expect(prev?.chapterId).toBe(startChapter)
      expect(prev?.sectionId).toBe(startSection)
    })

    it('全セクションを順番に辿れる', () => {
      let current: { chapterId: string; sectionId: string } | null = {
        chapterId: 'chapter-01',
        sectionId: 'section-01',
      }

      let count = 1
      while (current) {
        const next = getNextSection(current.chapterId, current.sectionId)
        if (next) {
          count++
        }
        current = next
      }

      // 全セクション数と一致
      expect(count).toBe(getTotalSectionCount())
    })
  })
})
