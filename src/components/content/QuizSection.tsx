import { useState } from 'react'
import type { Quiz } from '@/types'
import QuizCard from './QuizCard'

interface QuizSectionProps {
  quizzes: Quiz[]
  chapterTitle: string
}

/**
 * クイズセクションコンポーネント
 * チャプター末に表示するクイズ一覧
 */
export default function QuizSection({ quizzes, chapterTitle }: QuizSectionProps) {
  const [results, setResults] = useState<Record<string, boolean>>({})

  const handleAnswer = (quizId: string, isCorrect: boolean) => {
    setResults((prev) => ({
      ...prev,
      [quizId]: isCorrect,
    }))
  }

  const answeredCount = Object.keys(results).length
  const correctCount = Object.values(results).filter(Boolean).length

  if (quizzes.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-docker-blue"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            確認クイズ
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {chapterTitle}の理解度をチェックしましょう
          </p>
        </div>

        {/* 進捗表示 */}
        {answeredCount > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-docker-blue">
              {correctCount}/{quizzes.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">正解数</div>
          </div>
        )}
      </div>

      {/* クイズ一覧 */}
      <div className="space-y-6">
        {quizzes.map((quiz, index) => (
          <div key={quiz.id}>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              問題 {index + 1} / {quizzes.length}
            </div>
            <QuizCard quiz={quiz} onAnswer={handleAnswer} />
          </div>
        ))}
      </div>

      {/* 完了メッセージ */}
      {answeredCount === quizzes.length && (
        <div className="mt-6 p-4 rounded-lg bg-docker-blue/10 border border-docker-blue/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-docker-blue text-white flex items-center justify-center">
              {correctCount === quizzes.length ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <span className="font-bold">{Math.round((correctCount / quizzes.length) * 100)}%</span>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                {correctCount === quizzes.length
                  ? '素晴らしい！全問正解です！'
                  : `${quizzes.length}問中${correctCount}問正解しました`}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {correctCount === quizzes.length
                  ? 'このチャプターの内容をしっかり理解できています'
                  : '間違えた問題を復習して、もう一度挑戦してみましょう'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
