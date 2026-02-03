import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types'

/**
 * テーマストアの型定義
 */
interface ThemeState {
  /** 現在のテーマ設定 */
  theme: Theme
  /** テーマを設定する */
  setTheme: (theme: Theme) => void
  /** 実際に適用されるテーマを取得 */
  getResolvedTheme: () => 'light' | 'dark'
}

/**
 * システムのダークモード設定を取得
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * DOMにテーマを適用
 */
const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
  const root = document.documentElement

  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * テーマ管理用のZustandストア
 * - LocalStorageに永続化
 * - システム設定への追従対応
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      getResolvedTheme: () => {
        const { theme } = get()
        return theme === 'system' ? getSystemTheme() : theme
      },
    }),
    {
      name: 'docker-tutorial-theme',
      onRehydrateStorage: () => (state) => {
        // ストレージから復元時にテーマを適用
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

// システム設定の変更を監視
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      applyTheme('system')
    }
  })
}
