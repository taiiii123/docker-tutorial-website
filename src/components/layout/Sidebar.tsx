import { Link, useLocation } from 'react-router-dom'
import { chapters } from '@/content/metadata'
import { useProgressStore } from '@/stores/progressStore'
import clsx from 'clsx'

interface SidebarProps {
  /** ナビゲーション時のコールバック（モバイル用） */
  onNavigate?: () => void
}

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
 * サイドバーコンポーネント
 * - チャプター一覧を表示
 * - 進捗インジケーター付き
 */
export default function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation()
  const { completedSections } = useProgressStore()

  /**
   * チャプターの進捗率を計算
   */
  const getChapterProgress = (chapterId: string, sectionCount: number) => {
    if (sectionCount === 0) return 0
    const completedCount = completedSections.filter((id) =>
      id.startsWith(`${chapterId}/`)
    ).length
    return Math.round((completedCount / sectionCount) * 100)
  }

  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 bg-slate-50 dark:bg-slate-800/50">
      <ul className="space-y-1">
        {chapters.map((chapter) => {
          const isActive = location.pathname.includes(chapter.id)
          const progress = getChapterProgress(chapter.id, chapter.sections.length)

          return (
            <li key={chapter.id}>
              <Link
                to={`/chapter/${chapter.id}`}
                onClick={onNavigate}
                className={clsx(
                  'group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  isActive
                    ? 'bg-docker-blue/10 text-docker-blue dark:bg-docker-blue/20'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
                )}
              >
                {/* チャプター番号 */}
                <span
                  className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium',
                    isActive
                      ? 'bg-docker-blue text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  )}
                >
                  {chapter.number}
                </span>

                {/* タイトルと進捗 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {chapter.title}
                    </span>
                    <span
                      className={clsx(
                        'shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
                        getLevelBadgeClass(chapter.level)
                      )}
                    >
                      {getLevelLabel(chapter.level)}
                    </span>
                  </div>

                  {/* 進捗バー */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-docker-blue transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
