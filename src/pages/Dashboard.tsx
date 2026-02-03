import { Link } from 'react-router-dom'
import { chapters, getTotalSectionCount, getSectionFullId } from '@/content/metadata'
import { useProgressStore } from '@/stores/progressStore'

/**
 * ダッシュボードページ
 * - 全体の進捗表示
 * - チャプター別進捗
 * - 最近の学習履歴
 */
export default function Dashboard() {
  const { completedSections, bookmarks, lastVisited, resetProgress, getLearningStats } =
    useProgressStore()

  // 学習統計を取得
  const stats = getLearningStats()

  const totalSections = getTotalSectionCount()
  const progressPercent = Math.round(
    (completedSections.length / totalSections) * 100
  )

  // チャプター別の進捗を計算
  const chapterProgress = chapters.map((chapter) => {
    const completedCount = chapter.sections.filter((section) =>
      completedSections.includes(getSectionFullId(chapter.id, section.id))
    ).length
    return {
      ...chapter,
      completedCount,
      progressPercent: Math.round(
        (completedCount / chapter.sections.length) * 100
      ),
    }
  })

  // 最後に訪問したセクションの情報を取得
  const getLastVisitedInfo = () => {
    if (!lastVisited) return null
    const [chapterId, sectionId] = lastVisited.split('/')
    const chapter = chapters.find((c) => c.id === chapterId)
    const section = chapter?.sections.find((s) => s.id === sectionId)
    if (!chapter || !section) return null
    return { chapter, section }
  }

  const lastVisitedInfo = getLastVisitedInfo()

  return (
    <div className="animate-fade-in">
      {/* ヘッダー */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            学習ダッシュボード
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            学習の進捗を確認し、次のステップを見つけましょう
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 学習統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-docker-blue/10 text-docker-blue flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedSections.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">完了セクション</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.streak}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">連続学習日数</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completionsToday}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">今日の完了数</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalDays}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">学習日数</p>
              </div>
            </div>
          </div>
        </div>

        {/* 全体進捗 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              全体の進捗
            </h2>
            <span className="text-3xl font-bold text-docker-blue">
              {progressPercent}%
            </span>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-docker-blue transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {completedSections.length} / {totalSections} セクション完了
          </p>
        </div>

        {/* 続きから学習 */}
        {lastVisitedInfo && (
          <div className="rounded-xl border border-docker-blue/20 bg-docker-blue/5 dark:bg-docker-blue/10 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              続きから学習
            </h2>
            <Link
              to={`/chapter/${lastVisitedInfo.chapter.id}/${lastVisitedInfo.section.id}`}
              className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chapter {lastVisitedInfo.chapter.number}
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {lastVisitedInfo.section.title}
                </p>
              </div>
              <svg
                className="h-5 w-5 text-docker-blue"
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
        )}

        {/* チャプター別進捗 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            チャプター別進捗
          </h2>
          <div className="space-y-3">
            {chapterProgress.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/chapter/${chapter.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-docker-blue dark:hover:border-docker-blue transition-colors"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-docker-blue text-white font-bold">
                  {chapter.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {chapter.title}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-docker-blue transition-all duration-300"
                        style={{ width: `${chapter.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums w-12 text-right">
                      {chapter.progressPercent}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ブックマーク */}
        {bookmarks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              ブックマーク ({bookmarks.length})
            </h2>
            <div className="space-y-2">
              {bookmarks.map((bookmark) => {
                const [chapterId, sectionId] = bookmark.split('/')
                const chapter = chapters.find((c) => c.id === chapterId)
                const section = chapter?.sections.find((s) => s.id === sectionId)
                if (!chapter || !section) return null

                return (
                  <Link
                    key={bookmark}
                    to={`/chapter/${chapter.id}/${section.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-docker-blue dark:hover:border-docker-blue transition-colors"
                  >
                    <svg
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Chapter {chapter.number}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {section.title}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 進捗リセット */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <button
            onClick={() => {
              if (window.confirm('すべての進捗をリセットしますか？この操作は取り消せません。')) {
                resetProgress()
              }
            }}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            進捗をリセット
          </button>
        </div>
      </div>
    </div>
  )
}
