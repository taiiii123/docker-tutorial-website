import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'

// デフォルトの学習統計
const defaultLearningStats = {
  totalDays: 0,
  totalVisits: 0,
  completionsToday: 0,
  streak: 0,
  completionsByDate: {} as Record<string, number>,
}

// デフォルトのモック値
const defaultMockState = {
  completedSections: [] as string[],
  bookmarks: [] as string[],
  lastVisited: null as string | null,
  resetProgress: vi.fn(),
  getLearningStats: vi.fn(() => defaultLearningStats),
}

// zustand ストアのモック
const mockUseProgressStore = vi.fn(() => defaultMockState)
vi.mock('@/stores/progressStore', () => ({
  useProgressStore: () => mockUseProgressStore(),
}))

// metadata のモック
vi.mock('@/content/metadata', () => ({
  chapters: [
    {
      id: 'chapter-01',
      number: 1,
      title: 'Docker入門',
      description: 'Dockerの基礎を学ぶ',
      level: 'beginner',
      sections: [
        { id: 'section-01', title: 'Dockerとは' },
        { id: 'section-02', title: 'インストール' },
      ],
    },
    {
      id: 'chapter-02',
      number: 2,
      title: 'コンテナ操作',
      description: 'コンテナの基本操作',
      level: 'intermediate',
      sections: [
        { id: 'section-01', title: 'コンテナ実行' },
      ],
    },
  ],
  getTotalSectionCount: vi.fn(() => 3),
  getSectionFullId: vi.fn((chapterId: string, sectionId: string) => {
    return `${chapterId}/${sectionId}`
  }),
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト状態にリセット
    mockUseProgressStore.mockReturnValue({
      completedSections: [],
      bookmarks: [],
      lastVisited: null,
      resetProgress: vi.fn(),
      getLearningStats: vi.fn(() => defaultLearningStats),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
  }

  describe('ヘッダー', () => {
    it('タイトルが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('学習ダッシュボード')).toBeInTheDocument()
    })

    it('説明文が表示される', () => {
      renderWithRouter()
      expect(
        screen.getByText('学習の進捗を確認し、次のステップを見つけましょう')
      ).toBeInTheDocument()
    })
  })

  describe('全体進捗', () => {
    it('進捗タイトルが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('全体の進捗')).toBeInTheDocument()
    })

    it('完了セクション数が表示される', () => {
      renderWithRouter()
      expect(screen.getByText('0 / 3 セクション完了')).toBeInTheDocument()
    })
  })

  describe('進捗がある場合', () => {
    const mockResetProgress = vi.fn()

    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        completedSections: ['chapter-01/section-01', 'chapter-01/section-02'],
        bookmarks: ['chapter-02/section-01'],
        lastVisited: 'chapter-02/section-01',
        resetProgress: mockResetProgress,
        getLearningStats: vi.fn(() => ({
          ...defaultLearningStats,
          totalDays: 5,
          streak: 3,
          completionsToday: 2,
        })),
      })
    })

    it('正しい進捗率が表示される', () => {
      renderWithRouter()
      // 2/3 = 67% がメインの進捗表示に表示される
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('続きから学習セクションが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('続きから学習')).toBeInTheDocument()
    })

    it('ブックマークが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('ブックマーク (1)')).toBeInTheDocument()
    })
  })

  describe('チャプター別進捗', () => {
    it('チャプター一覧が表示される', () => {
      renderWithRouter()
      expect(screen.getByText('チャプター別進捗')).toBeInTheDocument()
      expect(screen.getByText('Docker入門')).toBeInTheDocument()
      expect(screen.getByText('コンテナ操作')).toBeInTheDocument()
    })

    it('チャプターへのリンクがある', () => {
      renderWithRouter()
      const links = screen.getAllByRole('link')
      const chapterLinks = links.filter(
        (link) =>
          link.getAttribute('href') === '/chapter/chapter-01' ||
          link.getAttribute('href') === '/chapter/chapter-02'
      )
      expect(chapterLinks.length).toBe(2)
    })
  })

  describe('進捗リセット', () => {
    const mockResetProgress = vi.fn()

    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        completedSections: [],
        bookmarks: [],
        lastVisited: null,
        resetProgress: mockResetProgress,
        getLearningStats: vi.fn(() => defaultLearningStats),
      })
    })

    it('リセットボタンが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('進捗をリセット')).toBeInTheDocument()
    })

    it('確認ダイアログが表示される', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithRouter()
      const resetButton = screen.getByText('進捗をリセット')
      fireEvent.click(resetButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'すべての進捗をリセットしますか？この操作は取り消せません。'
      )
    })

    it('確認後にリセットが実行される', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithRouter()
      const resetButton = screen.getByText('進捗をリセット')
      fireEvent.click(resetButton)

      expect(mockResetProgress).toHaveBeenCalled()
    })

    it('キャンセル時はリセットされない', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      renderWithRouter()
      const resetButton = screen.getByText('進捗をリセット')
      fireEvent.click(resetButton)

      expect(mockResetProgress).not.toHaveBeenCalled()
    })
  })

  describe('ブックマークがない場合', () => {
    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        completedSections: [],
        bookmarks: [],
        lastVisited: null,
        resetProgress: vi.fn(),
        getLearningStats: vi.fn(() => defaultLearningStats),
      })
    })

    it('ブックマークセクションが表示されない', () => {
      renderWithRouter()
      expect(screen.queryByText(/ブックマーク \(/)).not.toBeInTheDocument()
    })
  })

  describe('続きから学習がない場合', () => {
    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        completedSections: [],
        bookmarks: [],
        lastVisited: null,
        resetProgress: vi.fn(),
        getLearningStats: vi.fn(() => defaultLearningStats),
      })
    })

    it('続きから学習セクションが表示されない', () => {
      renderWithRouter()
      expect(screen.queryByText('続きから学習')).not.toBeInTheDocument()
    })
  })
})
