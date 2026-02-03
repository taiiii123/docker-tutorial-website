import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './themeStore'

/**
 * themeStore のテスト
 * テーマ管理機能をテストする
 */
describe('themeStore', () => {
  // 各テスト前にストアをリセット
  beforeEach(() => {
    // テーマを初期状態（system）に戻す
    useThemeStore.setState({ theme: 'system' })
    // DOM のクラスをクリア
    document.documentElement.classList.remove('dark')
  })

  describe('初期状態', () => {
    it('theme が system で初期化される', () => {
      const state = useThemeStore.getState()
      expect(state.theme).toBe('system')
    })

    it('setTheme 関数が存在する', () => {
      const state = useThemeStore.getState()
      expect(typeof state.setTheme).toBe('function')
    })

    it('getResolvedTheme 関数が存在する', () => {
      const state = useThemeStore.getState()
      expect(typeof state.getResolvedTheme).toBe('function')
    })
  })

  describe('setTheme', () => {
    it('light テーマに設定できる', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('light')
    })

    it('dark テーマに設定できる', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('dark')
    })

    it('system テーマに設定できる', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light') // まず別のテーマに変更
      setTheme('system')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('system')
    })

    it('dark テーマ設定時に DOM に dark クラスが追加される', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('light テーマ設定時に DOM から dark クラスが削除される', () => {
      const { setTheme } = useThemeStore.getState()
      // まず dark に設定
      setTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // light に切り替え
      setTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('getResolvedTheme', () => {
    it('light テーマ設定時に light を返す', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light')

      const resolvedTheme = useThemeStore.getState().getResolvedTheme()
      expect(resolvedTheme).toBe('light')
    })

    it('dark テーマ設定時に dark を返す', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      const resolvedTheme = useThemeStore.getState().getResolvedTheme()
      expect(resolvedTheme).toBe('dark')
    })

    it('system テーマ設定時にシステム設定に応じた値を返す', () => {
      // setup.ts で matchMedia は常に false（light）を返す設定
      const { setTheme } = useThemeStore.getState()
      setTheme('system')

      const resolvedTheme = useThemeStore.getState().getResolvedTheme()
      // モックでは prefers-color-scheme: dark が false なので light
      expect(resolvedTheme).toBe('light')
    })
  })

  describe('テーマの切り替え', () => {
    it('複数回のテーマ切り替えが正しく動作する', () => {
      const { setTheme } = useThemeStore.getState()

      setTheme('dark')
      expect(useThemeStore.getState().theme).toBe('dark')

      setTheme('light')
      expect(useThemeStore.getState().theme).toBe('light')

      setTheme('system')
      expect(useThemeStore.getState().theme).toBe('system')

      setTheme('dark')
      expect(useThemeStore.getState().theme).toBe('dark')
    })

    it('同じテーマを再設定しても問題ない', () => {
      const { setTheme } = useThemeStore.getState()

      setTheme('dark')
      setTheme('dark')
      setTheme('dark')

      expect(useThemeStore.getState().theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
