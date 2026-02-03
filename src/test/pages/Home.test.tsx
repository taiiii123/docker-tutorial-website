import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '@/pages/Home'

// zustand ストアのモック
const mockUseProgressStore = vi.fn(() => ({
  completedSections: [] as string[],
  lastVisited: null as string | null,
}))

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
}))

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト状態にリセット
    mockUseProgressStore.mockReturnValue({
      completedSections: [],
      lastVisited: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
  }

  describe('ヒーローセクション', () => {
    it('メインタイトルが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('Dockerを基礎から学ぼう')).toBeInTheDocument()
    })

    it('説明文が表示される', () => {
      renderWithRouter()
      expect(
        screen.getByText(/コンテナ技術の基礎から本番運用まで/)
      ).toBeInTheDocument()
    })

    it('学習を始めるボタンが表示される（進捗なしの場合）', () => {
      renderWithRouter()
      expect(screen.getByText('学習を始める')).toBeInTheDocument()
    })
  })

  describe('進捗がある場合', () => {
    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        completedSections: ['chapter-01/section-01'],
        lastVisited: 'chapter-01/section-02',
      })
    })

    it('学習を再開するボタンが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('学習を再開する')).toBeInTheDocument()
    })

    it('進捗バーが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('学習進捗')).toBeInTheDocument()
    })
  })

  describe('特徴セクション', () => {
    it('3つの特徴が表示される', () => {
      renderWithRouter()
      expect(screen.getByText('体系的なカリキュラム')).toBeInTheDocument()
      expect(screen.getByText('実践的なコード例')).toBeInTheDocument()
      expect(screen.getByText('進捗管理機能')).toBeInTheDocument()
    })
  })

  describe('チャプター一覧', () => {
    it('チャプター数が表示される', () => {
      renderWithRouter()
      expect(screen.getByText(/全11チャプター/)).toBeInTheDocument()
    })

    it('チャプターカードが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('Docker入門')).toBeInTheDocument()
      expect(screen.getByText('コンテナ操作')).toBeInTheDocument()
    })

    it('チャプターの説明が表示される', () => {
      renderWithRouter()
      expect(screen.getByText('Dockerの基礎を学ぶ')).toBeInTheDocument()
      expect(screen.getByText('コンテナの基本操作')).toBeInTheDocument()
    })

    it('レベルバッジが表示される', () => {
      renderWithRouter()
      expect(screen.getByText('入門')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
    })

    it('セクション数が表示される', () => {
      renderWithRouter()
      expect(screen.getByText('2 セクション')).toBeInTheDocument()
      expect(screen.getByText('1 セクション')).toBeInTheDocument()
    })
  })

  describe('ナビゲーション', () => {
    it('ダッシュボードへのリンクがある', () => {
      renderWithRouter()
      expect(screen.getByText('進捗を確認')).toBeInTheDocument()
    })

    it('チャプターへのリンクがある', () => {
      renderWithRouter()
      const links = screen.getAllByRole('link')
      const chapterLinks = links.filter(
        (link) =>
          link.getAttribute('href')?.includes('/chapter/chapter-01') ||
          link.getAttribute('href')?.includes('/chapter/chapter-02')
      )
      expect(chapterLinks.length).toBeGreaterThan(0)
    })
  })
})
