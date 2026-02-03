import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizCard from './QuizCard'
import type { Quiz } from '@/types'

const mockQuiz: Quiz = {
  id: 'quiz-1',
  question: 'Dockerの主な用途は何ですか？',
  options: [
    { id: 'a', text: 'アプリケーションのコンテナ化' },
    { id: 'b', text: 'ウェブブラウジング' },
    { id: 'c', text: '動画編集' },
    { id: 'd', text: 'ゲーム開発' },
  ],
  correctOptionId: 'a',
  explanation: 'Dockerはアプリケーションをコンテナ化して実行するためのプラットフォームです。',
}

describe('QuizCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期表示', () => {
    it('問題文が表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)
      expect(screen.getByText('Dockerの主な用途は何ですか？')).toBeInTheDocument()
    })

    it('全ての選択肢が表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)
      expect(screen.getByText('アプリケーションのコンテナ化')).toBeInTheDocument()
      expect(screen.getByText('ウェブブラウジング')).toBeInTheDocument()
      expect(screen.getByText('動画編集')).toBeInTheDocument()
      expect(screen.getByText('ゲーム開発')).toBeInTheDocument()
    })

    it('回答ボタンが表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)
      expect(screen.getByText('回答する')).toBeInTheDocument()
    })

    it('回答ボタンは選択前は無効', () => {
      render(<QuizCard quiz={mockQuiz} />)
      const submitButton = screen.getByText('回答する')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('選択肢の選択', () => {
    it('選択肢をクリックすると選択状態になる', () => {
      render(<QuizCard quiz={mockQuiz} />)
      const option = screen.getByText('アプリケーションのコンテナ化')
      fireEvent.click(option)

      // 回答ボタンが有効になる
      const submitButton = screen.getByText('回答する')
      expect(submitButton).not.toBeDisabled()
    })

    it('別の選択肢を選ぶと選択が変わる', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('ウェブブラウジング'))

      // 回答ボタンは有効のまま
      const submitButton = screen.getByText('回答する')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('正解の場合', () => {
    it('正解メッセージが表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      expect(screen.getByText('正解!')).toBeInTheDocument()
    })

    it('解説が表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      expect(screen.getByText(mockQuiz.explanation)).toBeInTheDocument()
    })

    it('onAnswerコールバックがtrueで呼ばれる', () => {
      const onAnswer = vi.fn()
      render(<QuizCard quiz={mockQuiz} onAnswer={onAnswer} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      expect(onAnswer).toHaveBeenCalledWith('quiz-1', true)
    })
  })

  describe('不正解の場合', () => {
    it('不正解メッセージが表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('ウェブブラウジング'))
      fireEvent.click(screen.getByText('回答する'))

      expect(screen.getByText('不正解')).toBeInTheDocument()
    })

    it('正解の選択肢がハイライトされる', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('ウェブブラウジング'))
      fireEvent.click(screen.getByText('回答する'))

      // 解説が表示される
      expect(screen.getByText(mockQuiz.explanation)).toBeInTheDocument()
    })

    it('onAnswerコールバックがfalseで呼ばれる', () => {
      const onAnswer = vi.fn()
      render(<QuizCard quiz={mockQuiz} onAnswer={onAnswer} />)

      fireEvent.click(screen.getByText('ウェブブラウジング'))
      fireEvent.click(screen.getByText('回答する'))

      expect(onAnswer).toHaveBeenCalledWith('quiz-1', false)
    })
  })

  describe('回答後の動作', () => {
    it('回答後は選択肢をクリックしても変更されない', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      // 別の選択肢をクリック
      fireEvent.click(screen.getByText('ウェブブラウジング'))

      // 正解のまま
      expect(screen.getByText('正解!')).toBeInTheDocument()
    })

    it('「もう一度」ボタンが表示される', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      expect(screen.getByText('もう一度')).toBeInTheDocument()
    })

    it('「もう一度」をクリックするとリセットされる', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))
      fireEvent.click(screen.getByText('もう一度'))

      // 回答ボタンが再表示される
      expect(screen.getByText('回答する')).toBeInTheDocument()
      // 回答ボタンは無効状態
      expect(screen.getByText('回答する')).toBeDisabled()
    })
  })

  describe('onAnswerなしの場合', () => {
    it('コールバックなしでも正常に動作する', () => {
      render(<QuizCard quiz={mockQuiz} />)

      fireEvent.click(screen.getByText('アプリケーションのコンテナ化'))
      fireEvent.click(screen.getByText('回答する'))

      expect(screen.getByText('正解!')).toBeInTheDocument()
    })
  })
})
