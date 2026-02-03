import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 学習履歴のエントリ
 */
interface LearningEntry {
  /** セクションID */
  sectionId: string
  /** タイムスタンプ（Unix時間） */
  timestamp: number
  /** アクション種別 */
  action: 'visit' | 'complete'
}

/**
 * 進捗管理ストアの型定義
 */
interface ProgressState {
  /** 完了したセクションIDの配列 */
  completedSections: string[]
  /** 最後に訪問したセクションID */
  lastVisited: string | null
  /** ブックマークしたセクションIDの配列 */
  bookmarks: string[]
  /** 学習履歴 */
  learningHistory: LearningEntry[]
  /** 学習開始日（初回訪問日） */
  learningStartDate: number | null

  /** セクションを完了としてマーク */
  markAsCompleted: (sectionId: string) => void
  /** セクションの完了状態を解除 */
  markAsIncomplete: (sectionId: string) => void
  /** セクションが完了済みかどうかを確認 */
  isCompleted: (sectionId: string) => boolean

  /** ブックマークをトグル */
  toggleBookmark: (sectionId: string) => void
  /** ブックマークされているかどうかを確認 */
  isBookmarked: (sectionId: string) => boolean

  /** 最後に訪問したセクションを記録 */
  setLastVisited: (sectionId: string) => void

  /** 進捗をリセット */
  resetProgress: () => void

  /** チャプターの進捗率を計算 */
  getChapterProgress: (chapterId: string, sectionIds: string[]) => number
  /** 全体の進捗率を計算 */
  getTotalProgress: (totalSections: number) => number

  /** 学習統計を取得 */
  getLearningStats: () => {
    totalDays: number
    totalVisits: number
    completionsToday: number
    streak: number
    completionsByDate: Record<string, number>
  }
}

/**
 * 進捗管理用のZustandストア
 * - LocalStorageに永続化
 * - セクション完了、ブックマーク、最終訪問を管理
 */
export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSections: [],
      lastVisited: null,
      bookmarks: [],
      learningHistory: [],
      learningStartDate: null,

      markAsCompleted: (sectionId) => {
        set((state) => {
          if (state.completedSections.includes(sectionId)) {
            return state
          }
          const now = Date.now()
          return {
            completedSections: [...state.completedSections, sectionId],
            learningHistory: [
              ...state.learningHistory,
              { sectionId, timestamp: now, action: 'complete' as const },
            ],
          }
        })
      },

      markAsIncomplete: (sectionId) => {
        set((state) => ({
          completedSections: state.completedSections.filter(
            (id) => id !== sectionId
          ),
        }))
      },

      isCompleted: (sectionId) => {
        return get().completedSections.includes(sectionId)
      },

      toggleBookmark: (sectionId) => {
        set((state) => {
          const isBookmarked = state.bookmarks.includes(sectionId)
          return {
            bookmarks: isBookmarked
              ? state.bookmarks.filter((id) => id !== sectionId)
              : [...state.bookmarks, sectionId],
          }
        })
      },

      isBookmarked: (sectionId) => {
        return get().bookmarks.includes(sectionId)
      },

      setLastVisited: (sectionId) => {
        const now = Date.now()
        set((state) => ({
          lastVisited: sectionId,
          learningHistory: [
            ...state.learningHistory,
            { sectionId, timestamp: now, action: 'visit' as const },
          ],
          learningStartDate: state.learningStartDate ?? now,
        }))
      },

      resetProgress: () => {
        set({
          completedSections: [],
          lastVisited: null,
          bookmarks: [],
          learningHistory: [],
          learningStartDate: null,
        })
      },

      getChapterProgress: (chapterId, sectionIds) => {
        const { completedSections } = get()
        // チャプターに属するセクションのみをフィルタリング
        const chapterSectionIds = sectionIds.filter((id) =>
          id.startsWith(chapterId)
        )
        if (chapterSectionIds.length === 0) return 0

        const completedCount = chapterSectionIds.filter((id) =>
          completedSections.includes(id)
        ).length

        return Math.round((completedCount / chapterSectionIds.length) * 100)
      },

      getTotalProgress: (totalSections) => {
        const { completedSections } = get()
        if (totalSections === 0) return 0
        return Math.round((completedSections.length / totalSections) * 100)
      },

      getLearningStats: () => {
        const { learningHistory, learningStartDate } = get()

        // 日付をYYYY-MM-DD形式に変換
        const toDateString = (timestamp: number) => {
          const date = new Date(timestamp)
          return date.toISOString().split('T')[0]
        }

        // 今日の日付
        const today = toDateString(Date.now())

        // 学習開始からの日数
        const totalDays = learningStartDate
          ? Math.ceil((Date.now() - learningStartDate) / (1000 * 60 * 60 * 24))
          : 0

        // 総訪問数
        const totalVisits = learningHistory.filter((e) => e.action === 'visit').length

        // 今日の完了数
        const completionsToday = learningHistory.filter(
          (e) => e.action === 'complete' && toDateString(e.timestamp) === today
        ).length

        // 日別の完了数
        const completionsByDate: Record<string, number> = {}
        learningHistory
          .filter((e) => e.action === 'complete')
          .forEach((entry) => {
            const dateStr = toDateString(entry.timestamp)
            completionsByDate[dateStr] = (completionsByDate[dateStr] || 0) + 1
          })

        // 連続学習日数（ストリーク）を計算
        let streak = 0
        const sortedDates = Object.keys(completionsByDate).sort().reverse()
        if (sortedDates.length > 0) {
          // 今日または昨日から開始
          const todayDate = new Date()
          const yesterday = new Date(todayDate)
          yesterday.setDate(yesterday.getDate() - 1)

          const checkDate = sortedDates[0] === today
            ? todayDate
            : sortedDates[0] === toDateString(yesterday.getTime())
              ? yesterday
              : null

          if (checkDate) {
            const currentDate = new Date(checkDate)
            while (true) {
              const dateStr = toDateString(currentDate.getTime())
              if (completionsByDate[dateStr]) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
              } else {
                break
              }
            }
          }
        }

        return {
          totalDays,
          totalVisits,
          completionsToday,
          streak,
          completionsByDate,
        }
      },
    }),
    {
      name: 'docker-tutorial-progress',
    }
  )
)
