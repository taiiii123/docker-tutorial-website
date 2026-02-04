import { useEffect, useState, ReactNode } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import {
  getChapterById,
  getSectionFullId,
  getNextSection,
  getPrevSection,
} from '@/content/metadata'
import { useProgressStore } from '@/stores/progressStore'
import CodeBlock from '@/components/content/CodeBlock'
import TableOfContents, { generateHeadingId } from '@/components/content/TableOfContents'
import clsx from 'clsx'

/**
 * React ノードからテキストを再帰的に抽出する
 * rehype-highlight によって children がオブジェクトになる問題に対応
 */
function extractTextFromNode(node: ReactNode): string {
  if (node === null || node === undefined) {
    return ''
  }
  if (typeof node === 'string') {
    return node
  }
  if (typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('')
  }
  if (typeof node === 'object' && 'props' in node) {
    const element = node as { props?: { children?: ReactNode } }
    if (element.props?.children !== undefined) {
      return extractTextFromNode(element.props.children)
    }
  }
  return ''
}

/**
 * セクション詳細ページ
 * - Markdownコンテンツ表示
 * - 前後ナビゲーション
 * - 完了マーク機能
 */
/**
 * URLパラメータの検証用パターン
 * 英小文字、数字、ハイフンのみを許可（パストラバーサル対策）
 */
const VALID_ID_PATTERN = /^[a-z0-9-]+$/

export default function Section() {
  const { chapterId, sectionId } = useParams<{
    chapterId: string
    sectionId: string
  }>()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { markAsCompleted, markAsIncomplete, isCompleted, setLastVisited, toggleBookmark, isBookmarked } =
    useProgressStore()

  // パラメータの検証（パストラバーサル対策）
  const isValidId = (id: string | undefined): boolean => {
    return !!id && VALID_ID_PATTERN.test(id)
  }

  // 不正なパラメータの場合は404へリダイレクト
  if (!isValidId(chapterId) || !isValidId(sectionId)) {
    return <Navigate to="/404" replace />
  }

  const chapter = chapterId ? getChapterById(chapterId) : undefined
  const section = chapter?.sections.find((s) => s.id === sectionId)
  const fullId = chapter && section ? getSectionFullId(chapter.id, section.id) : ''
  const completed = fullId ? isCompleted(fullId) : false
  const bookmarked = fullId ? isBookmarked(fullId) : false

  // 前後のセクション
  const prevSection =
    chapterId && sectionId ? getPrevSection(chapterId, sectionId) : null
  const nextSection =
    chapterId && sectionId ? getNextSection(chapterId, sectionId) : null

  // コンテンツの読み込み
  useEffect(() => {
    const loadContent = async () => {
      if (!chapterId || !sectionId) return

      setLoading(true)
      try {
        // 動的インポートでMarkdownファイルを読み込む
        const module = await import(
          `../content/chapters/${chapterId}/${sectionId}.md?raw`
        )
        setContent(module.default)
      } catch {
        // ファイルが見つからない場合はデフォルトコンテンツを表示
        setContent(`# ${section?.title || 'コンテンツ準備中'}

このセクションのコンテンツは現在準備中です。

しばらくお待ちください。`)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [chapterId, sectionId, section?.title])

  // 最後に訪問したセクションを記録
  useEffect(() => {
    if (fullId) {
      setLastVisited(fullId)
    }
  }, [fullId, setLastVisited])

  // チャプターまたはセクションが見つからない場合は404へ
  if (!chapter || !section) {
    return <Navigate to="/404" replace />
  }

  const handleToggleComplete = () => {
    if (completed) {
      markAsIncomplete(fullId)
    } else {
      markAsCompleted(fullId)
    }
  }

  const handleToggleBookmark = () => {
    toggleBookmark(fullId)
  }

  return (
    <div className="animate-fade-in">
      {/* ヘッダー */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-4xl px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* パンくずリスト */}
            <nav className="flex items-center gap-1 sm:gap-2 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-thin">
              <Link
                to="/"
                className="flex-shrink-0 py-1 px-1 hover:text-docker-blue active:text-docker-blue transition-colors touch-manipulation"
              >
                ホーム
              </Link>
              <svg
                className="h-4 w-4 flex-shrink-0"
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
              <Link
                to={`/chapter/${chapter.id}`}
                className="flex-shrink-0 py-1 px-1 hover:text-docker-blue active:text-docker-blue transition-colors touch-manipulation"
              >
                <span className="hidden sm:inline">Chapter {chapter.number}</span>
                <span className="sm:hidden">Ch.{chapter.number}</span>
              </Link>
              <svg
                className="h-4 w-4 flex-shrink-0"
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
              <span className="text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[200px] md:max-w-none">
                {section.title}
              </span>
            </nav>

            {/* アクションボタン */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* ブックマークボタン */}
              <button
                onClick={handleToggleBookmark}
                className={clsx(
                  'flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-3 min-h-[44px] text-sm font-medium transition-colors touch-manipulation active:scale-95',
                  bookmarked
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 active:bg-yellow-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 active:bg-slate-300'
                )}
                title={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
                aria-label={bookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
              >
                <svg
                  className="h-5 w-5 sm:h-4 sm:w-4"
                  fill={bookmarked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
                <span className="hidden sm:inline">{bookmarked ? 'ブックマーク済' : 'ブックマーク'}</span>
              </button>

              {/* 完了ボタン */}
              <button
                onClick={handleToggleComplete}
                className={clsx(
                  'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 min-h-[44px] text-sm font-medium transition-colors touch-manipulation active:scale-95',
                  completed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 active:bg-green-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 active:bg-slate-300'
                )}
                aria-label={completed ? '完了を取り消す' : '完了にする'}
              >
                <svg
                  className="h-5 w-5 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">{completed ? '完了' : '完了にする'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* コンテンツ + 目次 */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0 max-w-4xl">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-docker-blue border-t-transparent" />
              </div>
            ) : (
              <article className="prose-docker">
                <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeHighlight,
                rehypeRaw,
                // XSS対策: HTMLをサニタイズ（許可するタグを拡張）
                [rehypeSanitize, {
                  ...defaultSchema,
                  tagNames: [
                    ...(defaultSchema.tagNames || []),
                    // コードブロック関連
                    'pre', 'code', 'span',
                    // 表関連
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    // 図表・ASCII art
                    'div', 'br',
                  ],
                  attributes: {
                    ...defaultSchema.attributes,
                    code: ['className'],
                    span: ['className'],  // style属性は削除（CSS injection対策）
                    pre: ['className'],
                    div: ['className'],
                  },
                }],
              ]}
              components={{
                // コードブロックのカスタムレンダリング
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }

                  return (
                    <CodeBlock
                      language={match[1]}
                      code={extractTextFromNode(children).replace(/\n$/, '')}
                    />
                  )
                },
                // リンクを新しいタブで開く
                a({ href, children, ...props }) {
                  const isExternal = href?.startsWith('http')
                  return (
                    <a
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      {...props}
                    >
                      {children}
                    </a>
                  )
                },
                // h2にIDを付与（目次からのリンク用）
                h2({ children, ...props }) {
                  const text = extractTextFromNode(children)
                  const id = generateHeadingId(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                // h3にIDを付与（目次からのリンク用）
                h3({ children, ...props }) {
                  const text = extractTextFromNode(children)
                  const id = generateHeadingId(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
              }}
            >
              {content}
                </ReactMarkdown>
              </article>
            )}

            {/* ナビゲーション */}
            <nav className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-8">
              {prevSection ? (
                <Link
                  to={`/chapter/${prevSection.chapterId}/${prevSection.sectionId}`}
                  className="group flex items-center justify-center sm:justify-start gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-docker-blue hover:bg-slate-200 dark:text-slate-400 dark:hover:text-docker-blue dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 transition-colors touch-manipulation"
                >
                  <svg
                    className="h-5 w-5 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                  <span className="text-sm font-medium">前のセクション</span>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextSection ? (
                <Link
                  to={`/chapter/${nextSection.chapterId}/${nextSection.sectionId}`}
                  className="group flex items-center justify-center sm:justify-end gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-docker-blue text-white hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                >
                  <span className="text-sm font-medium">次のセクション</span>
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              ) : (
                <Link
                  to={`/chapter/${chapter.id}`}
                  className="group flex items-center justify-center sm:justify-end gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
                >
                  <span className="text-sm font-medium">チャプター完了</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Link>
              )}
            </nav>
          </div>

          {/* 目次サイドバー */}
          {!loading && <TableOfContents content={content} />}
        </div>
      </div>
    </div>
  )
}
