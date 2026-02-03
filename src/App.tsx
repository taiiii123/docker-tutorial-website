import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from '@/stores/themeStore'
import MainLayout from '@/components/layout/MainLayout'
import SearchModal from '@/components/search/SearchModal'
import Home from '@/pages/Home'
import Chapter from '@/pages/Chapter'
import Section from '@/pages/Section'
import Dashboard from '@/pages/Dashboard'
import NotFound from '@/pages/NotFound'

/**
 * アプリケーションのルートコンポーネント
 * - ルーティング設定
 * - テーマの初期化
 */
function App() {
  const theme = useThemeStore((state) => state.theme)

  // 初回マウント時にテーマを適用
  useEffect(() => {
    const root = document.documentElement
    const resolvedTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="chapter/:chapterId" element={<Chapter />} />
          <Route path="chapter/:chapterId/:sectionId" element={<Section />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <SearchModal />
    </>
  )
}

export default App
