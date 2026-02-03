import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { SectionPage } from './pages/SectionPage'
import { clearLocalStorage, getProgressData } from './helpers/storage'

/**
 * 学習開始フロー
 * CRITICAL: ホーム → 「学習を始める」→ Section 1 表示
 */
test.describe('学習開始フロー', () => {
  test.beforeEach(async ({ page }) => {
    // LocalStorageをクリアして初期状態にする
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
  })

  test('ホームから「学習を始める」をクリックしてSection 1に移動できる', async ({ page }) => {
    const homePage = new HomePage(page)
    const sectionPage = new SectionPage(page)

    // ホームページを開く
    await homePage.goto()

    // タイトルが表示されていることを確認
    await homePage.expectTitle()

    // 「学習を始める」ボタンが表示されていることを確認
    await expect(homePage.startLearningButton).toBeVisible()

    // 「学習を始める」をクリック
    await homePage.clickStartLearning()

    // Section 1のURLに遷移していることを確認
    await expect(page).toHaveURL(/\/chapter\/chapter-01\/section-01/)

    // コンテンツが読み込まれるのを待つ
    await sectionPage.waitForContentLoad()

    // セクションコンテンツが表示されていることを確認
    await expect(sectionPage.articleContent).toBeVisible()
  })

  test('初回訪問時は「学習を始める」が表示される', async ({ page }) => {
    const homePage = new HomePage(page)

    await homePage.goto()

    // 「学習を始める」ボタンが表示されている
    await expect(homePage.startLearningButton).toBeVisible()

    // 「学習を再開する」ボタンは表示されていない
    await expect(homePage.resumeLearningButton).toBeHidden()
  })

  test('セクション訪問後は「学習を再開する」が表示される', async ({ page }) => {
    const homePage = new HomePage(page)
    const sectionPage = new SectionPage(page)

    // まずセクションを訪問
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // ホームに戻る
    await homePage.goto()

    // 「学習を再開する」ボタンが表示されている
    await expect(homePage.resumeLearningButton).toBeVisible()

    // 「学習を始める」ボタンは表示されていない
    await expect(homePage.startLearningButton).toBeHidden()
  })
})

/**
 * セクション完了フロー
 * CRITICAL: 完了ボタンクリック → 状態が変わる → LocalStorageに保存
 */
test.describe('セクション完了フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
  })

  test('完了ボタンをクリックして完了状態にできる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 初期状態では完了していない
    const isInitiallyCompleted = await sectionPage.isCompleted()
    expect(isInitiallyCompleted).toBe(false)

    // 完了ボタンをクリック
    await sectionPage.markAsComplete()

    // 完了状態になっていることを確認
    const isNowCompleted = await sectionPage.isCompleted()
    expect(isNowCompleted).toBe(true)
  })

  test('完了状態がLocalStorageに保存される', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 完了ボタンをクリック
    await sectionPage.markAsComplete()

    // LocalStorageのデータを確認
    const progressData = await getProgressData(page)
    expect(progressData).not.toBeNull()
    expect(progressData.completedSections).toContain('chapter-01/section-01')
  })

  test('完了状態を解除できる', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 完了ボタンをクリック
    await sectionPage.markAsComplete()
    expect(await sectionPage.isCompleted()).toBe(true)

    // もう一度クリックして解除
    await sectionPage.markAsIncomplete()

    // 完了状態が解除されていることを確認
    expect(await sectionPage.isCompleted()).toBe(false)
  })

  test('完了状態がページリロード後も保持される', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // セクションページに移動
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // 完了ボタンをクリック
    await sectionPage.markAsComplete()

    // ページをリロード
    await page.reload()
    await sectionPage.waitForContentLoad()

    // 完了状態が保持されていることを確認
    const isStillCompleted = await sectionPage.isCompleted()
    expect(isStillCompleted).toBe(true)
  })
})
