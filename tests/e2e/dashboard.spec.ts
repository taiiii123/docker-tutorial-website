import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'
import { SectionPage } from './pages/SectionPage'
import { clearLocalStorage, setProgressData } from './helpers/storage'

/**
 * ダッシュボード機能
 * IMPORTANT: 進捗表示が正確
 */
test.describe('ダッシュボード機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
  })

  test('ダッシュボードページが表示される', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.goto()
    await dashboardPage.expectTitle()
  })

  test('初期状態で進捗が0%', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.goto()

    // 完了セクション数が0
    const completedCount = await dashboardPage.getCompletedSectionsCount()
    expect(completedCount).toBe(0)

    // 全体進捗が0%
    const progressPercent = await dashboardPage.getOverallProgressPercent()
    expect(progressPercent).toBe(0)
  })

  test('セクション完了後に進捗が更新される', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // セクションを完了させる
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()
    await sectionPage.markAsComplete()

    // ダッシュボードに移動
    await dashboardPage.goto()

    // 完了セクション数が1以上
    const completedCount = await dashboardPage.getCompletedSectionsCount()
    expect(completedCount).toBeGreaterThan(0)
  })

  test('チャプター別進捗が表示される', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.goto()

    // チャプター別進捗カードが表示されている
    const chapterCount = await dashboardPage.getChapterProgressCount()
    expect(chapterCount).toBeGreaterThan(0)
  })

  test('「続きから学習」セクションが前回訪問後に表示される', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // セクションを訪問
    await sectionPage.goto('chapter-01', 'section-02')
    await sectionPage.waitForContentLoad()

    // ダッシュボードに移動
    await dashboardPage.goto()

    // 「続きから学習」セクションが表示される
    await expect(dashboardPage.resumeLearningSection).toBeVisible()

    // リンクをクリックして前回のセクションに移動できる
    await dashboardPage.resumeLearningLink.click()
    await expect(page).toHaveURL(/\/chapter\/chapter-01\/section-02/)
  })

  test('進捗リセットが機能する', async ({ page }) => {
    const sectionPage = new SectionPage(page)
    const dashboardPage = new DashboardPage(page)

    // セクションを完了させる
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()
    await sectionPage.markAsComplete()

    // ダッシュボードに移動
    await dashboardPage.goto()

    // 完了数を確認
    const beforeReset = await dashboardPage.getCompletedSectionsCount()
    expect(beforeReset).toBeGreaterThan(0)

    // 進捗をリセット
    await dashboardPage.resetProgress()

    // ページをリロードして確認
    await page.reload()

    // 完了数が0に戻っている
    const afterReset = await dashboardPage.getCompletedSectionsCount()
    expect(afterReset).toBe(0)
  })
})
