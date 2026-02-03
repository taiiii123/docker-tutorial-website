import { Link } from 'react-router-dom'
import { chapters, getTotalSectionCount } from '@/content/metadata'
import { useProgressStore } from '@/stores/progressStore'

/**
 * レベルに応じたバッジの色を返す
 */
const getLevelBadgeClass = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'reference':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  }
}

/**
 * レベルの日本語表示
 */
const getLevelLabel = (level: string) => {
  switch (level) {
    case 'beginner':
      return '入門'
    case 'intermediate':
      return '中級'
    case 'advanced':
      return '応用'
    case 'reference':
      return '参照'
    default:
      return level
  }
}

/**
 * ホームページコンポーネント
 * - ヒーローセクション
 * - チャプター一覧
 * - 学習の進め方
 */
export default function Home() {
  const { completedSections, lastVisited } = useProgressStore()
  const totalSections = getTotalSectionCount()
  const progressPercent = Math.round(
    (completedSections.length / totalSections) * 100
  )

  return (
    <div className="animate-fade-in">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-docker-blue to-blue-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Dockerを基礎から学ぼう
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
              コンテナ技術の基礎から本番運用まで、
              <br className="hidden sm:inline" />
              体系的に学べる日本語の完全ガイド
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {lastVisited ? (
                <Link
                  to={`/chapter/${lastVisited.split('/')[0]}/${lastVisited.split('/')[1]}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-docker-blue font-semibold shadow-lg hover:bg-blue-50 transition-colors"
                >
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
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                  学習を再開する
                </Link>
              ) : (
                <Link
                  to="/chapter/chapter-01/section-01"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-docker-blue font-semibold shadow-lg hover:bg-blue-50 transition-colors"
                >
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
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                  学習を始める
                </Link>
              )}
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-white font-semibold hover:bg-white/20 transition-colors"
              >
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
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                進捗を確認
              </Link>
            </div>

            {/* 進捗表示 */}
            {completedSections.length > 0 && (
              <div className="mt-8 mx-auto max-w-xs">
                <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
                  <span>学習進捗</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-12 bg-slate-50 dark:bg-slate-800/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-docker-blue/10 text-docker-blue">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                体系的なカリキュラム
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                入門から応用まで段階的に学習できる全11章構成
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-docker-blue/10 text-docker-blue">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                実践的なコード例
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                すぐに試せるDockerfile、Composeファイルを多数収録
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-docker-blue/10 text-docker-blue">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                進捗管理機能
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                学習の進捗を記録し、いつでも続きから再開可能
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* チャプター一覧 */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            全11チャプター・{totalSections}セクション
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/chapter/${chapter.id}`}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-docker-blue dark:hover:border-docker-blue transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-docker-blue text-white text-sm font-bold">
                    {chapter.number}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-docker-blue transition-colors">
                      {chapter.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {chapter.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelBadgeClass(chapter.level)}`}
                      >
                        {getLevelLabel(chapter.level)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {chapter.sections.length} セクション
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
