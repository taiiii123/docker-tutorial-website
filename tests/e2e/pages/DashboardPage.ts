import { Page, Locator, expect } from '@playwright/test'

/**
 * ダッシュボードページのPage Objectクラス
 * - 進捗表示
 * - チャプター別進捗
 * - ブックマーク一覧
 */
export class DashboardPage {
  readonly page: Page

  // ヘッダー
  readonly pageTitle: Locator

  // 学習統計カード
  readonly completedSectionsCount: Locator
  readonly streakCount: Locator
  readonly todayCompletionsCount: Locator
  readonly totalDaysCount: Locator

  // 全体進捗
  readonly overallProgressPercent: Locator
  readonly overallProgressBar: Locator
  readonly progressText: Locator

  // 続きから学習
  readonly resumeLearningSection: Locator
  readonly resumeLearningLink: Locator

  // チャプター別進捗
  readonly chapterProgressCards: Locator

  // ブックマーク
  readonly bookmarkSection: Locator
  readonly bookmarkItems: Locator

  // リセットボタン
  readonly resetButton: Locator

  constructor(page: Page) {
    this.page = page

    // ヘッダー
    this.pageTitle = page.locator('h1', { hasText: '学習ダッシュボード' })

    // 学習統計カード - 各カードはrounded-xlクラスを持つdiv内にある
    // 数値はtext-2xlクラスを持つp要素、ラベルはtext-xsクラスを持つp要素
    const statsCards = page.locator('.grid.grid-cols-2 .rounded-xl')
    this.completedSectionsCount = statsCards.filter({ hasText: '完了セクション' }).locator('.text-2xl')
    this.streakCount = statsCards.filter({ hasText: '連続学習日数' }).locator('.text-2xl')
    this.todayCompletionsCount = statsCards.filter({ hasText: '今日の完了数' }).locator('.text-2xl')
    this.totalDaysCount = statsCards.filter({ hasText: '学習日数' }).locator('.text-2xl')

    // 全体進捗
    this.overallProgressPercent = page.locator('h2', { hasText: '全体の進捗' })
      .locator('..').locator('.text-3xl')
    this.overallProgressBar = page.locator('.h-4.bg-slate-200')
    this.progressText = page.locator('text=/\\d+ \\/ \\d+ セクション完了/')

    // 続きから学習
    this.resumeLearningSection = page.locator('h2', { hasText: '続きから学習' }).locator('..')
    this.resumeLearningLink = this.resumeLearningSection.locator('a')

    // チャプター別進捗 - h2の次の兄弟要素内のリンク
    this.chapterProgressCards = page.locator('h2:has-text("チャプター別進捗") + .space-y-3 a')

    // ブックマーク
    this.bookmarkSection = page.locator('h2', { hasText: /ブックマーク \(\d+\)/ }).locator('..')
    this.bookmarkItems = this.bookmarkSection.locator('a')

    // リセットボタン
    this.resetButton = page.locator('button', { hasText: '進捗をリセット' })
  }

  /**
   * ダッシュボードページに移動
   */
  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ページタイトルを検証
   */
  async expectTitle() {
    await expect(this.pageTitle).toBeVisible()
  }

  /**
   * 完了セクション数を取得
   */
  async getCompletedSectionsCount(): Promise<number> {
    const text = await this.completedSectionsCount.textContent()
    return parseInt(text || '0', 10)
  }

  /**
   * 全体進捗パーセントを取得
   */
  async getOverallProgressPercent(): Promise<number> {
    const text = await this.overallProgressPercent.textContent()
    return parseInt(text?.replace('%', '') || '0', 10)
  }

  /**
   * ブックマーク数を取得
   */
  async getBookmarkCount(): Promise<number> {
    // ブックマークセクションが存在しない場合は0
    const isVisible = await this.bookmarkSection.isVisible().catch(() => false)
    if (!isVisible) return 0
    return await this.bookmarkItems.count()
  }

  /**
   * チャプター別進捗数を取得
   */
  async getChapterProgressCount(): Promise<number> {
    return await this.chapterProgressCards.count()
  }

  /**
   * 進捗リセットを実行
   */
  async resetProgress() {
    // confirmダイアログを自動承認
    this.page.on('dialog', async (dialog) => {
      await dialog.accept()
    })
    await this.resetButton.click()
  }
}
