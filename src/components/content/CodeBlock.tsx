import { useState } from 'react'
import clsx from 'clsx'

interface CodeBlockProps {
  /** プログラミング言語 */
  language: string
  /** コード内容 */
  code: string
  /** ファイル名（オプション） */
  filename?: string
}

/**
 * コードブロックコンポーネント
 * - シンタックスハイライト
 * - コピーボタン
 * - 言語/ファイル名表示
 */
export default function CodeBlock({ language, code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // クリップボード操作失敗時は静かに無視
      // ユーザーには視覚的フィードバック（copied状態が変わらない）で伝わる
    }
  }

  // 言語の表示名をマッピング
  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      dockerfile: 'Dockerfile',
      docker: 'Dockerfile',
      yaml: 'YAML',
      yml: 'YAML',
      json: 'JSON',
      bash: 'Bash',
      sh: 'Shell',
      shell: 'Shell',
      javascript: 'JavaScript',
      js: 'JavaScript',
      typescript: 'TypeScript',
      ts: 'TypeScript',
      python: 'Python',
      py: 'Python',
      go: 'Go',
      rust: 'Rust',
      sql: 'SQL',
      html: 'HTML',
      css: 'CSS',
      nginx: 'Nginx',
      plaintext: 'Text',
      text: 'Text',
    }
    return labels[lang.toLowerCase()] || lang.toUpperCase()
  }

  return (
    <div className="group relative my-4 rounded-lg overflow-hidden bg-slate-900 dark:bg-slate-800">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-800 dark:bg-slate-700/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {/* 言語アイコン */}
          <span className="text-xs font-medium text-slate-400 truncate max-w-[120px] sm:max-w-none">
            {filename || getLanguageLabel(language)}
          </span>
        </div>

        {/* コピーボタン - タッチ最適化（min 44x44px） */}
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center justify-center gap-1.5 rounded px-3 min-h-[44px] text-xs font-medium transition-colors touch-manipulation',
            'active:scale-95',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300 active:bg-slate-500'
          )}
        >
          {copied ? (
            <>
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
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span className="hidden sm:inline">コピー済み</span>
            </>
          ) : (
            <>
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
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
              <span className="hidden sm:inline">コピー</span>
            </>
          )}
        </button>
      </div>

      {/* コード - モバイルでフォントサイズ縮小 */}
      <div className="relative">
        <pre className="overflow-x-auto p-3 sm:p-4 text-xs sm:text-sm leading-relaxed scrollbar-thin">
          <code className={`language-${language} text-slate-100`}>{code}</code>
        </pre>
        {/* 横スクロールインジケーター（モバイル） */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none sm:hidden" />
      </div>
    </div>
  )
}
