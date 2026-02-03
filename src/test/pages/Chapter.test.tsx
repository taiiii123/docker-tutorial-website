import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Chapter from '@/pages/Chapter'

// モックの戻り値型
interface MockProgressState {
  isCompleted: (id: string) => boolean
  completedSections: string[]
}

// zustand ストアのモック
const mockUseProgressStore = vi.fn<() => MockProgressState>(() => ({
  isCompleted: () => false,
  completedSections: [],
}))

vi.mock('@/stores/progressStore', () => ({
  useProgressStore: () => mockUseProgressStore(),
}))

// metadata のモック
vi.mock('@/content/metadata', () => ({
  getChapterById: vi.fn((id: string) => {
    if (id === 'chapter-01') {
      return {
        id: 'chapter-01',
        number: 1,
        title: 'Docker入門',
        description: 'Dockerの基礎を学ぶ',
        level: 'beginner',
        sections: [
          { id: 'section-01', title: 'Dockerとは' },
          { id: 'section-02', title: 'インストール' },
          { id: 'section-03', title: '基本コマンド' },
        ],
      }
    }
    return undefined
  }),
  getSectionFullId: vi.fn((chapterId: string, sectionId: string) => {
    return `${chapterId}/${sectionId}`
  }),
}))

describe('Chapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルト状態にリセット
    mockUseProgressStore.mockReturnValue({
      isCompleted: () => false,
      completedSections: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithRouter = (chapterId: string) => {
    return render(
      <MemoryRouter initialEntries={[`/chapter/${chapterId}`]}>
        <Routes>
          <Route path="/chapter/:chapterId" element={<Chapter />} />
          <Route path="/404" element={<div>404 Page</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  describe('正常表示', () => {
    it('チャプタータイトルが表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('Docker入門')).toBeInTheDocument()
    })

    it('チャプター番号が表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('Chapter 1')).toBeInTheDocument()
    })

    it('チャプターの説明が表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('Dockerの基礎を学ぶ')).toBeInTheDocument()
    })

    it('セクション一覧が表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('Dockerとは')).toBeInTheDocument()
      expect(screen.getByText('インストール')).toBeInTheDocument()
      expect(screen.getByText('基本コマンド')).toBeInTheDocument()
    })

    it('進捗が表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText(/0 \/ 3 セクション完了/)).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('パンくずリストが表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('ホーム')).toBeInTheDocument()
    })

    it('学習開始ボタンが表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('このチャプターを始める')).toBeInTheDocument()
    })
  })

  describe('進捗がある場合', () => {
    beforeEach(() => {
      mockUseProgressStore.mockReturnValue({
        isCompleted: (id: string) => id === 'chapter-01/section-01',
        completedSections: ['chapter-01/section-01'],
      })
    })

    it('続きを学習するボタンが表示される', () => {
      renderWithRouter('chapter-01')
      expect(screen.getByText('続きを学習する')).toBeInTheDocument()
    })

    it('完了したセクションは進捗に反映される', () => {
      renderWithRouter('chapter-01')
      // 進捗が33%であることを確認
      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  describe('存在しないチャプター', () => {
    it('404ページにリダイレクトされる', () => {
      renderWithRouter('invalid-chapter')
      expect(screen.getByText('404 Page')).toBeInTheDocument()
    })
  })

  describe('ナビゲーション', () => {
    it('ホームへのリンクがある', () => {
      renderWithRouter('chapter-01')
      const homeLink = screen.getByText('ホーム')
      expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('セクションへのリンクがある', () => {
      renderWithRouter('chapter-01')
      const sectionLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('href')?.includes('/chapter/chapter-01/section-')
      )
      expect(sectionLinks.length).toBe(4) // 3セクション + 開始ボタン
    })
  })
})
