import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

describe('NotFound', () => {
  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
  }

  it('404というテキストが表示される', () => {
    renderWithRouter()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('ページが見つからないメッセージが表示される', () => {
    renderWithRouter()
    expect(
      screen.getByText('ページが見つかりませんでした')
    ).toBeInTheDocument()
  })

  it('ホームに戻るリンクが表示される', () => {
    renderWithRouter()
    const link = screen.getByText('ホームに戻る')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('アイコンが表示される', () => {
    renderWithRouter()
    // SVGアイコンの存在を確認
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
