import { Page, Locator, expect } from '@playwright/test'

/**
 * ホームページのPage Objectクラス
 * - ヒーローセクション
 * - チャプター一覧
 * - 学習開始/再開リンク
 */
export class HomePage {
  readonly page: Page

  // ヒーローセクション
  readonly heroTitle: Locator
  readonly startLearningButton: Locator
  readonly resumeLearningButton: Locator
  readonly dashboardButton: Locator
  readonly progressBar: Locator

  // チャプター一覧
  readonly chapterCards: Locator

  constructor(page: Page) {
    this.page = page

    // ヒーローセクション
    this.heroTitle = page.locator('h1', { hasText: 'Dockerを基礎から学ぼう' })
    this.startLearningButton = page.locator('a', { hasText: '学習を始める' })
    this.resumeLearningButton = page.locator('a', { hasText: '学習を再開する' })
    this.dashboardButton = page.locator('a', { hasText: '進捗を確認' })
    this.progressBar = page.locator('.h-2.bg-white\\/20')

    // チャプター一覧
    this.chapterCards = page.locator('a[href^="/chapter/"]').filter({
      has: page.locator('span', { hasText: /^\d+$/ }),
    })
  }

  /**
   * ホームページに移動
   */
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ページタイトルを検証
   */
  async expectTitle() {
    await expect(this.heroTitle).toBeVisible()
  }

  /**
   * 学習を始めるボタンをクリック
   */
  async clickStartLearning() {
    await this.startLearningButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * チャプター数を取得
   */
  async getChapterCount(): Promise<number> {
    return await this.chapterCards.count()
  }

  /**
   * 指定したチャプターをクリック
   */
  async clickChapter(chapterNumber: number) {
    const chapterCard = this.page.locator(`a[href^="/chapter/chapter-0${chapterNumber}"]`).first()
    await chapterCard.click()
    await this.page.waitForLoadState('networkidle')
  }
}
