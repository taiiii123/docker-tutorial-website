import { Page, Locator, expect } from '@playwright/test'

/**
 * セクションページのPage Objectクラス
 * - Markdownコンテンツ表示
 * - 完了ボタン
 * - ブックマークボタン
 * - ナビゲーション
 */
export class SectionPage {
  readonly page: Page

  // パンくずリスト
  readonly breadcrumbHome: Locator
  readonly breadcrumbChapter: Locator

  // アクションボタン
  readonly completeButton: Locator
  readonly bookmarkButton: Locator

  // コンテンツ
  readonly articleContent: Locator
  readonly loadingSpinner: Locator

  // ナビゲーション
  readonly prevSectionButton: Locator
  readonly nextSectionButton: Locator
  readonly chapterCompleteButton: Locator

  constructor(page: Page) {
    this.page = page

    // パンくずリスト
    this.breadcrumbHome = page.locator('nav a', { hasText: 'ホーム' })
    this.breadcrumbChapter = page.locator('nav a[href^="/chapter/"]')

    // アクションボタン
    this.completeButton = page.locator('button', { hasText: /完了|完了にする/ })
    this.bookmarkButton = page.locator('button', { hasText: /ブックマーク/ })

    // コンテンツ
    this.articleContent = page.locator('article.prose-docker')
    this.loadingSpinner = page.locator('.animate-spin')

    // ナビゲーション
    this.prevSectionButton = page.locator('a', { hasText: '前のセクション' })
    this.nextSectionButton = page.locator('a', { hasText: '次のセクション' })
    this.chapterCompleteButton = page.locator('a', { hasText: 'チャプター完了' })
  }

  /**
   * セクションページに移動
   */
  async goto(chapterId: string, sectionId: string) {
    await this.page.goto(`/chapter/${chapterId}/${sectionId}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * コンテンツが読み込まれるのを待機
   */
  async waitForContentLoad() {
    // ページが読み込まれるのを待つ
    await this.page.waitForLoadState('domcontentloaded')

    // ローディングスピナーが表示されている場合は消えるのを待つ
    const spinnerVisible = await this.loadingSpinner.isVisible().catch(() => false)
    if (spinnerVisible) {
      await expect(this.loadingSpinner).toBeHidden({ timeout: 15000 })
    }

    // コンテンツが表示されるのを待つ（prose-dockerクラスを持つarticle）
    // または、コンテンツ準備中メッセージを待つ
    await this.page.waitForSelector('article.prose-docker, .animate-fade-in article', {
      timeout: 15000,
      state: 'visible'
    })
  }

  /**
   * セクションを完了状態にする
   */
  async markAsComplete() {
    const buttonText = await this.completeButton.textContent()
    if (buttonText?.includes('完了にする')) {
      await this.completeButton.click()
    }
  }

  /**
   * セクションの完了状態を解除
   */
  async markAsIncomplete() {
    const buttonText = await this.completeButton.textContent()
    if (buttonText?.includes('完了') && !buttonText?.includes('完了にする')) {
      await this.completeButton.click()
    }
  }

  /**
   * 完了状態かどうかを確認
   */
  async isCompleted(): Promise<boolean> {
    const buttonText = await this.completeButton.textContent()
    return buttonText?.includes('完了') && !buttonText?.includes('完了にする') || false
  }

  /**
   * ブックマークをトグル
   */
  async toggleBookmark() {
    await this.bookmarkButton.click()
  }

  /**
   * ブックマーク済みかどうかを確認
   */
  async isBookmarked(): Promise<boolean> {
    const buttonText = await this.bookmarkButton.textContent()
    return buttonText?.includes('ブックマーク済') || false
  }

  /**
   * 次のセクションに移動
   */
  async goToNextSection() {
    await this.nextSectionButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 前のセクションに移動
   */
  async goToPrevSection() {
    await this.prevSectionButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}
