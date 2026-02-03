import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { SectionPage } from './pages/SectionPage'
import { HeaderComponent } from './pages/HeaderComponent'
import { clearLocalStorage } from './helpers/storage'

/**
 * ナビゲーション機能
 * CRITICAL: サイドバー → チャプター選択 → セクション一覧 → セクション表示
 */
test.describe('ナビゲーション機能', () => {
  // タイムアウトを延長（並列実行時のリソース競合対策）
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await clearLocalStorage(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
  })

  test('ホームからチャプターページに移動できる', async ({ page }) => {
    const homePage = new HomePage(page)

    await homePage.goto()

    // チャプターカードが表示されていることを確認
    const chapterCount = await homePage.getChapterCount()
    expect(chapterCount).toBeGreaterThan(0)

    // チャプター1をクリック
    await homePage.clickChapter(1)

    // チャプターページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\/chapter-01$/, { timeout: 15000 })
  })

  test('チャプターページからセクションに移動できる', async ({ page }) => {
    // チャプターページに移動
    await page.goto('/chapter/chapter-01')
    await page.waitForLoadState('networkidle')

    // セクションリンクをクリック
    const sectionLink = page.locator('a[href*="/chapter/chapter-01/section-"]').first()
    await expect(sectionLink).toBeVisible()
    await sectionLink.click()

    // セクションページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\/chapter-01\/section-/)
  })

  test('セクション間を「次のセクション」で移動できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // Section 1に移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 次のセクションボタンが表示されていることを確認
    await expect(sectionPage.nextSectionButton).toBeVisible()

    // 次のセクションに移動
    await sectionPage.goToNextSection()

    // 別のセクションに移動していることを確認
    await expect(page).not.toHaveURL(/section-01$/)
  })

  test('セクション間を「前のセクション」で移動できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // Section 2に移動
    await sectionPage.goto('chapter-01', 'section-02')
    await sectionPage.waitForContentLoad()

    // 前のセクションボタンが表示されていることを確認
    await expect(sectionPage.prevSectionButton).toBeVisible()

    // 前のセクションに移動
    await sectionPage.goToPrevSection()

    // Section 1に戻っていることを確認
    await expect(page).toHaveURL(/section-01$/)
  })

  test('パンくずリストでホームに戻れる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // パンくずリストの「ホーム」をクリック
    await sectionPage.breadcrumbHome.click()
    await page.waitForLoadState('networkidle')

    // ホームに戻っていることを確認
    await expect(page).toHaveURL('/')
  })

  test('ヘッダーのロゴでホームに戻れる', async ({ page }) => {
    const header = new HeaderComponent(page)

    // セクションページに移動
    await page.goto('/chapter/chapter-01/section-01')
    await page.waitForLoadState('networkidle')

    // ロゴをクリック
    await header.clickLogo()

    // ホームに戻っていることを確認
    await expect(page).toHaveURL('/')
  })

  test('サイドバーのチャプター一覧からナビゲートできる', async ({ page }) => {
    // デスクトップサイズに設定（サイドバーが表示される）
    await page.setViewportSize({ width: 1280, height: 720 })

    // ホームに移動
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // サイドバーのチャプターリンクをクリック
    const sidebarChapter = page.locator('nav a[href="/chapter/chapter-01"]').first()
    await expect(sidebarChapter).toBeVisible()
    await sidebarChapter.click()

    // チャプターページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\/chapter-01$/)
  })
})

/**
 * 404ページ
 */
test.describe('404ページ', () => {
  test.setTimeout(60000)

  test('存在しないページで404が表示される', async ({ page }) => {
    await page.goto('/nonexistent-page', { waitUntil: 'domcontentloaded' })

    // 404メッセージが表示されることを確認
    await expect(page.locator('text=ページが見つかりません')).toBeVisible({ timeout: 15000 })
  })

  test('404ページからホームに戻れる', async ({ page }) => {
    await page.goto('/nonexistent-page', { waitUntil: 'domcontentloaded' })

    // ホームへのリンクをクリック
    await page.locator('a', { hasText: 'ホームに戻る' }).click()

    // ホームに戻っていることを確認
    await expect(page).toHaveURL('/', { timeout: 15000 })
  })
})
