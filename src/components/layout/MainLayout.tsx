import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

/**
 * メインレイアウトコンポーネント
 * - ヘッダー、サイドバー、コンテンツエリアを組み合わせる
 * - レスポンシブ対応（モバイルではサイドバーを隠す）
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden">
      {/* ヘッダー */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* サイドバー（デスクトップ） */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:pt-16">
          <Sidebar />
        </aside>

        {/* モバイルサイドバー（オーバーレイ） */}
        {sidebarOpen && (
          <>
            {/* バックドロップ */}
            <div
              className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* サイドバー */}
            <aside className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
              <div className="flex h-full flex-col bg-white dark:bg-slate-800">
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    メニュー
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </>
        )}

        {/* メインコンテンツ */}
        <main className="flex-1 lg:pl-72">
          <div className="pt-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
