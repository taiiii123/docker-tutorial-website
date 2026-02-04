import { useState, useEffect } from 'react'
import clsx from 'clsx'

/**
 * 目次アイテムの型定義
 */
interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  /** Markdownコンテンツ */
  content: string
}

/**
 * Markdownから見出しを抽出
 */
function extractHeadings(markdown: string): TocItem[] {
  const headings: TocItem[] = []
  // h2とh3を抽出（h1はタイトルなので除外）
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    // IDを生成（日本語対応）
    const id = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')

    headings.push({ id, text, level })
  }

  return headings
}

/**
 * テキストからスラッグを生成（見出しにIDを付与するため）
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')
}

/**
 * 目次コンポーネント
 * - デスクトップ: サイドバー表示
 * - タブレット・スマホ: フローティングボタン + ドロワー
 */
export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const headings = extractHeadings(content)

  // Intersection Observerでアクティブな見出しを追跡
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    // すべての見出し要素を監視
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  // 見出しがない場合は表示しない
  if (headings.length === 0) {
    return null
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      // ヘッダー分のオフセットを考慮
      const offset = 120
      const y = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)
      setIsOpen(false) // モバイルでクリック後に閉じる
    }
  }

  // 目次リストの共通部分
  const TocList = () => (
    <ul className="space-y-2 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
        >
          <a
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={clsx(
              'block py-1.5 transition-colors border-l-2 touch-manipulation',
              heading.level === 2 ? 'pl-3' : 'pl-3',
              activeId === heading.id
                ? 'text-docker-blue border-docker-blue font-medium'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 active:text-docker-blue'
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* デスクトップ版: サイドバー（xl以上） */}
      <nav className="hidden xl:block w-64 flex-shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            目次
          </h3>
          <TocList />
        </div>
      </nav>

      {/* タブレット・スマホ版: フローティングボタン + ドロワー（xl未満） */}
      <div className="xl:hidden">
        {/* フローティングボタン */}
        <button
          onClick={() => setIsOpen(true)}
          className={clsx(
            'fixed bottom-20 right-4 z-40 flex items-center justify-center',
            'w-12 h-12 rounded-full bg-docker-blue text-white shadow-lg',
            'hover:bg-blue-600 active:bg-blue-700 transition-colors',
            'touch-manipulation'
          )}
          aria-label="目次を開く"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </button>

        {/* ドロワー（オーバーレイ） */}
        {isOpen && (
          <>
            {/* バックドロップ */}
            <div
              className="fixed inset-0 z-50 bg-slate-900/50"
              onClick={() => setIsOpen(false)}
            />

            {/* ドロワー本体 */}
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl animate-slide-up">
              {/* ハンドル */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>

              {/* ヘッダー */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  目次
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 touch-manipulation"
                  aria-label="閉じる"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 目次リスト */}
              <div className="px-4 py-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                <TocList />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
