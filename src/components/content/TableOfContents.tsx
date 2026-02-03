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
 */
export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
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
    }
  }

  return (
    <nav className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          目次
        </h3>
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
                  'block py-1 transition-colors border-l-2',
                  heading.level === 2 ? 'pl-3' : 'pl-3',
                  activeId === heading.id
                    ? 'text-docker-blue border-docker-blue font-medium'
                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
