import { describe, it, expect, beforeEach } from 'vitest'
import { useProgressStore } from './progressStore'

/**
 * progressStore のテスト
 * 学習進捗管理機能をテストする
 */
describe('progressStore', () => {
  // 各テスト前にストアをリセット
  beforeEach(() => {
    useProgressStore.getState().resetProgress()
  })

  describe('初期状態', () => {
    it('completedSections が空配列で初期化される', () => {
      const state = useProgressStore.getState()
      expect(state.completedSections).toEqual([])
    })

    it('lastVisited が null で初期化される', () => {
      const state = useProgressStore.getState()
      expect(state.lastVisited).toBeNull()
    })

    it('bookmarks が空配列で初期化される', () => {
      const state = useProgressStore.getState()
      expect(state.bookmarks).toEqual([])
    })
  })

  describe('markAsCompleted', () => {
    it('セクションを完了としてマークできる', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.completedSections).toContain('chapter-01/section-01')
    })

    it('複数のセクションを完了としてマークできる', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-02')
      markAsCompleted('chapter-02/section-01')

      const state = useProgressStore.getState()
      expect(state.completedSections).toHaveLength(3)
      expect(state.completedSections).toContain('chapter-01/section-01')
      expect(state.completedSections).toContain('chapter-01/section-02')
      expect(state.completedSections).toContain('chapter-02/section-01')
    })

    it('同じセクションを2回マークしても重複しない', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.completedSections).toHaveLength(1)
    })
  })

  describe('markAsIncomplete', () => {
    it('完了状態を解除できる', () => {
      const { markAsCompleted, markAsIncomplete } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')
      markAsIncomplete('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.completedSections).not.toContain('chapter-01/section-01')
    })

    it('存在しないセクションを解除してもエラーにならない', () => {
      const { markAsIncomplete } = useProgressStore.getState()
      expect(() => markAsIncomplete('nonexistent')).not.toThrow()
    })
  })

  describe('isCompleted', () => {
    it('完了済みセクションに対して true を返す', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')

      expect(useProgressStore.getState().isCompleted('chapter-01/section-01')).toBe(true)
    })

    it('未完了セクションに対して false を返す', () => {
      const { isCompleted } = useProgressStore.getState()
      expect(isCompleted('chapter-01/section-01')).toBe(false)
    })
  })

  describe('toggleBookmark', () => {
    it('ブックマークを追加できる', () => {
      const { toggleBookmark } = useProgressStore.getState()
      toggleBookmark('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.bookmarks).toContain('chapter-01/section-01')
    })

    it('ブックマークを削除できる', () => {
      const { toggleBookmark } = useProgressStore.getState()
      toggleBookmark('chapter-01/section-01')
      toggleBookmark('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.bookmarks).not.toContain('chapter-01/section-01')
    })

    it('複数のブックマークを管理できる', () => {
      const { toggleBookmark } = useProgressStore.getState()
      toggleBookmark('chapter-01/section-01')
      toggleBookmark('chapter-02/section-03')

      const state = useProgressStore.getState()
      expect(state.bookmarks).toHaveLength(2)
    })
  })

  describe('isBookmarked', () => {
    it('ブックマーク済みセクションに対して true を返す', () => {
      const { toggleBookmark } = useProgressStore.getState()
      toggleBookmark('chapter-01/section-01')

      expect(useProgressStore.getState().isBookmarked('chapter-01/section-01')).toBe(true)
    })

    it('ブックマークされていないセクションに対して false を返す', () => {
      const { isBookmarked } = useProgressStore.getState()
      expect(isBookmarked('chapter-01/section-01')).toBe(false)
    })
  })

  describe('setLastVisited', () => {
    it('最後に訪問したセクションを記録できる', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.lastVisited).toBe('chapter-01/section-01')
    })

    it('新しい訪問で上書きされる', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')
      setLastVisited('chapter-02/section-03')

      const state = useProgressStore.getState()
      expect(state.lastVisited).toBe('chapter-02/section-03')
    })
  })

  describe('resetProgress', () => {
    it('全ての進捗をリセットできる', () => {
      const { markAsCompleted, toggleBookmark, setLastVisited, resetProgress } =
        useProgressStore.getState()

      // 状態を変更
      markAsCompleted('chapter-01/section-01')
      toggleBookmark('chapter-02/section-01')
      setLastVisited('chapter-01/section-02')

      // リセット
      resetProgress()

      const state = useProgressStore.getState()
      expect(state.completedSections).toEqual([])
      expect(state.bookmarks).toEqual([])
      expect(state.lastVisited).toBeNull()
    })
  })

  describe('getChapterProgress', () => {
    it('チャプターの進捗率を正しく計算する', () => {
      const { markAsCompleted } = useProgressStore.getState()

      // chapter-01 の 6 セクション中 3 つを完了
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-02')
      markAsCompleted('chapter-01/section-03')

      const sectionIds = [
        'chapter-01/section-01',
        'chapter-01/section-02',
        'chapter-01/section-03',
        'chapter-01/section-04',
        'chapter-01/section-05',
        'chapter-01/section-06',
      ]

      const progress = useProgressStore.getState().getChapterProgress('chapter-01', sectionIds)
      expect(progress).toBe(50)
    })

    it('進捗がない場合は 0 を返す', () => {
      const sectionIds = ['chapter-01/section-01', 'chapter-01/section-02']
      const progress = useProgressStore.getState().getChapterProgress('chapter-01', sectionIds)
      expect(progress).toBe(0)
    })

    it('セクションがない場合は 0 を返す', () => {
      const progress = useProgressStore.getState().getChapterProgress('chapter-01', [])
      expect(progress).toBe(0)
    })

    it('100% 完了の場合は 100 を返す', () => {
      const { markAsCompleted } = useProgressStore.getState()

      const sectionIds = ['chapter-01/section-01', 'chapter-01/section-02']
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-02')

      const progress = useProgressStore.getState().getChapterProgress('chapter-01', sectionIds)
      expect(progress).toBe(100)
    })
  })

  describe('getTotalProgress', () => {
    it('全体の進捗率を正しく計算する', () => {
      const { markAsCompleted } = useProgressStore.getState()

      // 50 セクション中 10 完了
      for (let i = 1; i <= 10; i++) {
        markAsCompleted(`chapter-01/section-${i.toString().padStart(2, '0')}`)
      }

      const progress = useProgressStore.getState().getTotalProgress(50)
      expect(progress).toBe(20)
    })

    it('進捗がない場合は 0 を返す', () => {
      const progress = useProgressStore.getState().getTotalProgress(50)
      expect(progress).toBe(0)
    })

    it('totalSections が 0 の場合は 0 を返す', () => {
      const progress = useProgressStore.getState().getTotalProgress(0)
      expect(progress).toBe(0)
    })

    it('端数は四捨五入される', () => {
      const { markAsCompleted } = useProgressStore.getState()

      // 3 セクション中 1 完了 = 33.33...%
      markAsCompleted('chapter-01/section-01')

      const progress = useProgressStore.getState().getTotalProgress(3)
      expect(progress).toBe(33)
    })
  })

  describe('getLearningStats', () => {
    it('初期状態では全てゼロを返す', () => {
      const stats = useProgressStore.getState().getLearningStats()

      expect(stats.totalDays).toBe(0)
      expect(stats.totalVisits).toBe(0)
      expect(stats.completionsToday).toBe(0)
      expect(stats.streak).toBe(0)
      expect(stats.completionsByDate).toEqual({})
    })

    it('セクション訪問で学習開始日が設定される', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')

      const state = useProgressStore.getState()
      expect(state.learningStartDate).not.toBeNull()
    })

    it('訪問履歴がカウントされる', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')
      setLastVisited('chapter-01/section-02')
      setLastVisited('chapter-02/section-01')

      const stats = useProgressStore.getState().getLearningStats()
      expect(stats.totalVisits).toBe(3)
    })

    it('今日の完了数がカウントされる', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-02')

      const stats = useProgressStore.getState().getLearningStats()
      expect(stats.completionsToday).toBe(2)
    })

    it('日別の完了数が集計される', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')
      markAsCompleted('chapter-01/section-02')
      markAsCompleted('chapter-01/section-03')

      const stats = useProgressStore.getState().getLearningStats()
      const today = new Date().toISOString().split('T')[0]

      expect(stats.completionsByDate[today]).toBe(3)
    })

    it('連続学習日数（ストリーク）が計算される', () => {
      const { markAsCompleted } = useProgressStore.getState()
      // 今日セクションを完了
      markAsCompleted('chapter-01/section-01')

      const stats = useProgressStore.getState().getLearningStats()
      expect(stats.streak).toBe(1)
    })

    it('学習履歴に完了アクションが記録される', () => {
      const { markAsCompleted } = useProgressStore.getState()
      markAsCompleted('chapter-01/section-01')

      const state = useProgressStore.getState()
      const completeEntry = state.learningHistory.find(
        (e) => e.action === 'complete' && e.sectionId === 'chapter-01/section-01'
      )

      expect(completeEntry).toBeDefined()
      expect(completeEntry?.timestamp).toBeDefined()
    })

    it('学習履歴に訪問アクションが記録される', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')

      const state = useProgressStore.getState()
      const visitEntry = state.learningHistory.find(
        (e) => e.action === 'visit' && e.sectionId === 'chapter-01/section-01'
      )

      expect(visitEntry).toBeDefined()
      expect(visitEntry?.timestamp).toBeDefined()
    })

    it('リセットで学習履歴もクリアされる', () => {
      const { markAsCompleted, setLastVisited, resetProgress } = useProgressStore.getState()

      markAsCompleted('chapter-01/section-01')
      setLastVisited('chapter-01/section-02')
      resetProgress()

      const state = useProgressStore.getState()
      expect(state.learningHistory).toEqual([])
      expect(state.learningStartDate).toBeNull()
    })

    it('学習開始からの日数が計算される', () => {
      const { setLastVisited } = useProgressStore.getState()
      setLastVisited('chapter-01/section-01')

      const stats = useProgressStore.getState().getLearningStats()
      // 今日開始なので1日以下
      expect(stats.totalDays).toBeGreaterThanOrEqual(0)
      expect(stats.totalDays).toBeLessThanOrEqual(1)
    })
  })
})
