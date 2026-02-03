import { Link, useParams, Navigate } from 'react-router-dom'
import { getChapterById, getSectionFullId } from '@/content/metadata'
import { useProgressStore } from '@/stores/progressStore'
import { getQuizzesByChapterId } from '@/content/quizzes'
import QuizSection from '@/components/content/QuizSection'
import clsx from 'clsx'

/**
 * チャプター概要ページ
 * - チャプターの説明
 * - セクション一覧（進捗付き）
 */
export default function Chapter() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const { isCompleted, completedSections } = useProgressStore()

  const chapter = chapterId ? getChapterById(chapterId) : undefined

  // チャプターが見つからない場合は404へリダイレクト
  if (!chapter) {
    return <Navigate to="/404" replace />
  }

  // チャプターの進捗を計算
  const completedCount = chapter.sections.filter((section) =>
    completedSections.includes(getSectionFullId(chapter.id, section.id))
  ).length
  const progressPercent = Math.round(
    (completedCount / chapter.sections.length) * 100
  )

  return (
    <div className="animate-fade-in">
      {/* ヘッダー */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Link to="/" className="hover:text-docker-blue transition-colors">
              ホーム
            </Link>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="text-slate-900 dark:text-white">
              Chapter {chapter.number}
            </span>
          </nav>

          {/* タイトル */}
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-docker-blue text-white text-xl font-bold">
              {chapter.number}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {chapter.title}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {chapter.description}
              </p>
            </div>
          </div>

          {/* 進捗 */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-400">
                進捗: {completedCount} / {chapter.sections.length} セクション完了
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-docker-blue transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* セクション一覧 */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          セクション一覧
        </h2>
        <div className="space-y-2">
          {chapter.sections.map((section, index) => {
            const fullId = getSectionFullId(chapter.id, section.id)
            const completed = isCompleted(fullId)

            return (
              <Link
                key={section.id}
                to={`/chapter/${chapter.id}/${section.id}`}
                className={clsx(
                  'flex items-center gap-4 rounded-lg border p-4 transition-colors',
                  completed
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                    : 'border-slate-200 bg-white hover:border-docker-blue dark:border-slate-700 dark:bg-slate-800 dark:hover:border-docker-blue'
                )}
              >
                {/* 番号/チェック */}
                <div
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                    completed
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  )}
                >
                  {completed ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* タイトル */}
                <div className="flex-1">
                  <span
                    className={clsx(
                      'font-medium',
                      completed
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {section.title}
                  </span>
                </div>

                {/* 矢印 */}
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            )
          })}
        </div>

        {/* 学習を始めるボタン */}
        <div className="mt-8 text-center">
          <Link
            to={`/chapter/${chapter.id}/${chapter.sections[0].id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-docker-blue px-6 py-3 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            {completedCount > 0 ? '続きを学習する' : 'このチャプターを始める'}
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        {/* クイズセクション */}
        <QuizSection
          quizzes={getQuizzesByChapterId(chapter.id)}
          chapterTitle={chapter.title}
        />
      </div>
    </div>
  )
}
