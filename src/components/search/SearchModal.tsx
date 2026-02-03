import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { useSearchStore } from '@/stores/searchStore'
import { chapters } from '@/content/metadata'
import clsx from 'clsx'

/**
 * 検索用のインデックスアイテム
 */
interface SearchItem {
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  sectionId: string
  sectionTitle: string
  /** 検索用のキーワード（チャプタータイトル + セクションタイトル） */
  searchText: string
}

/**
 * 検索インデックスを作成
 */
const createSearchIndex = (): SearchItem[] => {
  const items: SearchItem[] = []

  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      items.push({
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sectionId: section.id,
        sectionTitle: section.title,
        searchText: `${chapter.title} ${section.title}`,
      })
    }
  }

  return items
}

// 検索インデックス（静的に作成）
const searchIndex = createSearchIndex()

// Fuse.jsインスタンス
const fuse = new Fuse(searchIndex, {
  keys: ['sectionTitle', 'chapterTitle', 'searchText'],
  threshold: 0.4,
  includeScore: true,
})

/**
 * 検索モーダルコンポーネント
 */
export default function SearchModal() {
  const { isOpen, query, closeSearch, setQuery } = useSearchStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 検索結果
  const results = query.trim()
    ? fuse.search(query).slice(0, 10)
    : []

  // モーダルが開いたらフォーカス
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      // 少し遅延させてフォーカス
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // 選択インデックスをリセット
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // 選択中のアイテムをスクロール
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, results.length])

  // 結果を選択して遷移
  const handleSelect = useCallback((item: SearchItem) => {
    closeSearch()
    navigate(`/chapter/${item.chapterId}/${item.sectionId}`)
  }, [closeSearch, navigate])

  // キーボード操作
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].item)
        }
        break
      case 'Escape':
        e.preventDefault()
        closeSearch()
        break
    }
  }, [results, selectedIndex, handleSelect, closeSearch])

  // グローバルキーボードショートカット
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K または Cmd+K で検索を開く
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          closeSearch()
        } else {
          useSearchStore.getState().openSearch()
        }
      }
      // Escape で閉じる
      if (e.key === 'Escape' && isOpen) {
        closeSearch()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen, closeSearch])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSearch}
      />

      {/* モーダル */}
      <div
        className="relative min-h-full flex items-start justify-center pt-[10vh] px-4"
        onClick={closeSearch}
      >
        <div
          className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 検索入力 */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="セクションを検索..."
              className="flex-1 h-14 bg-transparent text-slate-900 dark:text-white placeholder-slate-500 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
              ESC
            </kbd>
          </div>

          {/* 検索結果 */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
            {query.trim() === '' ? (
              // クエリが空の場合
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">キーワードを入力して検索</p>
                <p className="text-xs mt-2">例: Docker, Compose, ネットワーク</p>
              </div>
            ) : results.length === 0 ? (
              // 結果がない場合
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">「{query}」に一致する結果がありません</p>
              </div>
            ) : (
              // 検索結果
              results.map((result, index) => (
                <button
                  key={`${result.item.chapterId}-${result.item.sectionId}`}
                  onClick={() => handleSelect(result.item)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-docker-blue text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  {/* アイコン */}
                  <div className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    index === selectedIndex
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}>
                    {result.item.chapterNumber}
                  </div>

                  {/* テキスト */}
                  <div className="flex-1 min-w-0">
                    <div className={clsx(
                      'font-medium truncate',
                      index === selectedIndex
                        ? 'text-white'
                        : 'text-slate-900 dark:text-white'
                    )}>
                      {result.item.sectionTitle}
                    </div>
                    <div className={clsx(
                      'text-sm truncate',
                      index === selectedIndex
                        ? 'text-white/70'
                        : 'text-slate-500 dark:text-slate-400'
                    )}>
                      Chapter {result.item.chapterNumber}: {result.item.chapterTitle}
                    </div>
                  </div>

                  {/* Enter キー表示 */}
                  {index === selectedIndex && (
                    <kbd className="flex-shrink-0 px-2 py-1 text-xs bg-white/20 rounded">
                      Enter
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↓</kbd>
                移動
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Enter</kbd>
                選択
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Ctrl</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">K</kbd>
              で検索
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
