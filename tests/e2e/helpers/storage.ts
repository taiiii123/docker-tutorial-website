import { Page } from '@playwright/test'

/**
 * LocalStorageをクリアするヘルパー
 * 各テストの前にストレージをクリーンな状態にするために使用
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
  })
}

/**
 * LocalStorageの進捗データをクリア
 */
export async function clearProgressData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('docker-tutorial-progress')
  })
}

/**
 * LocalStorageのテーマデータをクリア
 */
export async function clearThemeData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('docker-tutorial-theme')
  })
}

/**
 * 進捗データを設定
 */
export async function setProgressData(
  page: Page,
  data: {
    completedSections?: string[]
    lastVisited?: string | null
    bookmarks?: string[]
  }
) {
  await page.evaluate((progressData) => {
    const currentData = JSON.parse(
      localStorage.getItem('docker-tutorial-progress') || '{"state":{},"version":0}'
    )
    currentData.state = {
      ...currentData.state,
      ...progressData,
    }
    localStorage.setItem('docker-tutorial-progress', JSON.stringify(currentData))
  }, data)
}

/**
 * テーマを設定
 */
export async function setTheme(page: Page, theme: 'light' | 'dark' | 'system') {
  await page.evaluate((themeValue) => {
    const data = {
      state: { theme: themeValue },
      version: 0,
    }
    localStorage.setItem('docker-tutorial-theme', JSON.stringify(data))
  }, theme)
}

/**
 * 進捗データを取得
 */
export async function getProgressData(page: Page) {
  return await page.evaluate(() => {
    const data = localStorage.getItem('docker-tutorial-progress')
    if (!data) return null
    return JSON.parse(data).state
  })
}
