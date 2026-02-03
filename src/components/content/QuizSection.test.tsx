import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizSection from './QuizSection'
import type { Quiz } from '@/types'

const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    question: '質問1: Dockerとは何ですか？',
    options: [
      { id: 'a', text: 'コンテナプラットフォーム' },
      { id: 'b', text: 'ウェブブラウザ' },
    ],
    correctOptionId: 'a',
    explanation: 'Dockerはコンテナプラットフォームです。',
  },
  {
    id: 'quiz-2',
    question: '質問2: コンテナの利点は？',
    options: [
      { id: 'a', text: '軽量で高速' },
      { id: 'b', text: '重くて遅い' },
    ],
    correctOptionId: 'a',
    explanation: 'コンテナは軽量で起動が高速です。',
  },
]

describe('QuizSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('クイズがない場合', () => {
    it('何も表示されない', () => {
      const { container } = render(
        <QuizSection quizzes={[]} chapterTitle="Chapter 1" />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('クイズがある場合', () => {
    it('タイトルが表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)
      expect(screen.getByText('確認クイズ')).toBeInTheDocument()
    })

    it('チャプタータイトルを含む説明が表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)
      expect(
        screen.getByText('Docker入門の理解度をチェックしましょう')
      ).toBeInTheDocument()
    })

    it('問題番号が表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)
      expect(screen.getByText('問題 1 / 2')).toBeInTheDocument()
      expect(screen.getByText('問題 2 / 2')).toBeInTheDocument()
    })

    it('全てのクイズが表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)
      expect(screen.getByText('質問1: Dockerとは何ですか？')).toBeInTheDocument()
      expect(screen.getByText('質問2: コンテナの利点は？')).toBeInTheDocument()
    })
  })

  describe('回答時の動作', () => {
    it('回答すると正解数が表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)

      // 1問目に正解
      const options1 = screen.getAllByText('コンテナプラットフォーム')
      fireEvent.click(options1[0])
      const submitButtons = screen.getAllByText('回答する')
      fireEvent.click(submitButtons[0])

      // 正解数が表示される
      expect(screen.getByText('1/2')).toBeInTheDocument()
      expect(screen.getByText('正解数')).toBeInTheDocument()
    })

    it('全問正解すると完了メッセージが表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)

      // 1問目に正解
      fireEvent.click(screen.getByText('コンテナプラットフォーム'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 2問目に正解
      fireEvent.click(screen.getByText('軽量で高速'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 全問正解メッセージ
      expect(screen.getByText('素晴らしい！全問正解です！')).toBeInTheDocument()
      expect(
        screen.getByText('このチャプターの内容をしっかり理解できています')
      ).toBeInTheDocument()
    })

    it('一部不正解でも完了メッセージが表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)

      // 1問目に正解
      fireEvent.click(screen.getByText('コンテナプラットフォーム'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 2問目に不正解
      fireEvent.click(screen.getByText('重くて遅い'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 一部正解メッセージ
      expect(screen.getByText('2問中1問正解しました')).toBeInTheDocument()
      expect(
        screen.getByText('間違えた問題を復習して、もう一度挑戦してみましょう')
      ).toBeInTheDocument()
    })

    it('正解率が表示される', () => {
      render(<QuizSection quizzes={mockQuizzes} chapterTitle="Docker入門" />)

      // 1問目に正解
      fireEvent.click(screen.getByText('コンテナプラットフォーム'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 2問目に不正解
      fireEvent.click(screen.getByText('重くて遅い'))
      fireEvent.click(screen.getAllByText('回答する')[0])

      // 50%が表示される
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })
})
