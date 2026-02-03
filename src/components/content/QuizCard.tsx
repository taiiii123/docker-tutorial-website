import { useState } from 'react'
import type { Quiz } from '@/types'
import clsx from 'clsx'

interface QuizCardProps {
  quiz: Quiz
  onAnswer?: (quizId: string, isCorrect: boolean) => void
}

/**
 * クイズカードコンポーネント
 * 1問のクイズを表示し、回答を受け付ける
 */
export default function QuizCard({ quiz, onAnswer }: QuizCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const isCorrect = selectedOptionId === quiz.correctOptionId

  const handleSelect = (optionId: string) => {
    if (!isSubmitted) {
      setSelectedOptionId(optionId)
    }
  }

  const handleSubmit = () => {
    if (selectedOptionId && !isSubmitted) {
      setIsSubmitted(true)
      onAnswer?.(quiz.id, isCorrect)
    }
  }

  const handleReset = () => {
    setSelectedOptionId(null)
    setIsSubmitted(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 問題文 */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-docker-blue text-white flex items-center justify-center text-sm font-bold">
            Q
          </span>
          <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
            {quiz.question}
          </p>
        </div>
      </div>

      {/* 選択肢 */}
      <div className="p-4 space-y-2">
        {quiz.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const isCorrectOption = option.id === quiz.correctOptionId

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isSubmitted}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                isSubmitted
                  ? isCorrectOption
                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                    : isSelected
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent'
                  : isSelected
                    ? 'bg-docker-blue/10 border-2 border-docker-blue'
                    : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {/* 選択肢マーカー */}
              <span
                className={clsx(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isSubmitted
                    ? isCorrectOption
                      ? 'bg-green-500 text-white'
                      : isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    : isSelected
                      ? 'bg-docker-blue text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}
              >
                {isSubmitted && isCorrectOption ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : isSubmitted && isSelected && !isCorrectOption ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  option.id.toUpperCase()
                )}
              </span>

              {/* 選択肢テキスト */}
              <span
                className={clsx(
                  'flex-1',
                  isSubmitted
                    ? isCorrectOption
                      ? 'text-green-700 dark:text-green-400'
                      : isSelected
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {option.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* 解説（回答後に表示） */}
      {isSubmitted && (
        <div
          className={clsx(
            'mx-4 mb-4 p-4 rounded-lg',
            isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          )}
        >
          <div className="flex items-start gap-2">
            <span className={clsx(
              'font-bold',
              isCorrect ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
            )}>
              {isCorrect ? '正解!' : '不正解'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {quiz.explanation}
          </p>
        </div>
      )}

      {/* アクションボタン */}
      <div className="px-4 pb-4 flex gap-2">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOptionId}
            className={clsx(
              'flex-1 py-2.5 rounded-lg font-medium transition-colors',
              selectedOptionId
                ? 'bg-docker-blue text-white hover:bg-docker-blue/90'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            )}
          >
            回答する
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            もう一度
          </button>
        )}
      </div>
    </div>
  )
}
