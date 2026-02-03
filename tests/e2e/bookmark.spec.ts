import { test, expect } from '@playwright/test'
import { SectionPage } from './pages/SectionPage'
import { DashboardPage } from './pages/DashboardPage'
import { clearLocalStorage, getProgressData } from './helpers/storage'

/**
 * ブックマーク機能
 * IMPORTANT: 追加/削除がダッシュボードに反映
 */
test.describe('ブックマーク機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
  })

  test('ブックマークボタンでブックマークを追加できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 初期状態ではブックマークされていない
    const isInitiallyBookmarked = await sectionPage.isBookmarked()
    expect(isInitiallyBookmarked).toBe(false)

    // ブックマークをトグル
    await sectionPage.toggleBookmark()

    // ブックマークされていることを確認
    const isNowBookmarked = await sectionPage.isBookmarked()
    expect(isNowBookmarked).toBe(true)
  })

  test('ブックマークがLocalStorageに保存される', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // ブックマークをトグル
    await sectionPage.toggleBookmark()

    // LocalStorageのデータを確認
    const progressData = await getProgressData(page)
    expect(progressData).not.toBeNull()
    expect(progressData.bookmarks).toContain('chapter-01/section-01')
  })

  test('ブックマークを解除できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // ブックマークを追加
    await sectionPage.toggleBookmark()
    expect(await sectionPage.isBookmarked()).toBe(true)

    // ブックマークを解除
    await sectionPage.toggleBookmark()

    // ブックマークが解除されていることを確認
    expect(await sectionPage.isBookmarked()).toBe(false)
  })

  test('ブックマークがダッシュボードに表示される', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // セクションページに移動してブックマーク
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()
    await sectionPage.toggleBookmark()

    // ダッシュボードに移動
    await dashboardPage.goto()

    // ブックマークセクションが表示される
    await expect(dashboardPage.bookmarkSection).toBeVisible()

    // ブックマーク数が1以上
    const bookmarkCount = await dashboardPage.getBookmarkCount()
    expect(bookmarkCount).toBeGreaterThan(0)
  })

  test('複数のセクションをブックマークできる', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // 1つ目のセクションをブックマーク
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()
    await sectionPage.toggleBookmark()

    // 2つ目のセクションをブックマーク
    await sectionPage.goto('chapter-01', 'section-02')
    await sectionPage.waitForContentLoad()
    await sectionPage.toggleBookmark()

    // ダッシュボードで確認
    await dashboardPage.goto()

    // ブックマーク数が2
    const bookmarkCount = await dashboardPage.getBookmarkCount()
    expect(bookmarkCount).toBe(2)
  })

  test('ダッシュボードのブックマークからセクションに移動できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // セクションをブックマーク
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()
    await sectionPage.toggleBookmark()

    // ダッシュボードに移動
    await dashboardPage.goto()

    // ブックマークアイテムをクリック
    await dashboardPage.bookmarkItems.first().click()

    // セクションページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\/chapter-01\/section-01/)
  })

  test('ブックマーク状態がページリロード後も保持される', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // ブックマーク
    await sectionPage.toggleBookmark()

    // ページをリロード
    await page.reload()
    await sectionPage.waitForContentLoad()

    // ブックマーク状態が保持されていることを確認
    const isStillBookmarked = await sectionPage.isBookmarked()
    expect(isStillBookmarked).toBe(true)
  })
})
