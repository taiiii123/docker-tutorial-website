import { Page, Locator, expect } from '@playwright/test'

/**
 * ヘッダーコンポーネントのPage Objectクラス
 * - ロゴ
 * - 検索ボタン
 * - テーマ切り替え
 * - ダッシュボードリンク
 */
export class HeaderComponent {
  readonly page: Page

  // ロゴ
  readonly logo: Locator
  readonly logoText: Locator

  // 検索
  readonly searchButton: Locator
  readonly searchButtonDesktop: Locator

  // テーマ切り替え
  readonly themeButton: Locator

  // ダッシュボードリンク
  readonly dashboardLink: Locator

  // モバイルメニュー
  readonly mobileMenuButton: Locator

  constructor(page: Page) {
    this.page = page

    // ロゴ
    this.logo = page.locator('header a[href="/"]')
    this.logoText = page.locator('header span', { hasText: 'Docker学習' })

    // 検索（デスクトップ）
    this.searchButtonDesktop = page.locator('header button', { hasText: '検索...' })
    // 検索（モバイル - aria-label使用）
    this.searchButton = page.locator('button[aria-label="検索を開く"]')

    // テーマ切り替え
    this.themeButton = page.locator('button[aria-label^="テーマを変更"]')

    // ダッシュボードリンク
    this.dashboardLink = page.locator('header a[href="/dashboard"]')

    // モバイルメニュー
    this.mobileMenuButton = page.locator('button[aria-label="メニューを開く"]')
  }

  /**
   * ロゴをクリックしてホームに戻る
   */
  async clickLogo() {
    await this.logo.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 検索ボタンをクリック（デスクトップ）
   */
  async clickSearchDesktop() {
    await this.searchButtonDesktop.click()
  }

  /**
   * 検索ボタンをクリック（モバイル）
   */
  async clickSearchMobile() {
    await this.searchButton.click()
  }

  /**
   * テーマを切り替え
   */
  async toggleTheme() {
    await this.themeButton.click()
  }

  /**
   * 現在のテーマを取得
   */
  async getCurrentTheme(): Promise<'light' | 'dark' | 'system'> {
    const label = await this.themeButton.getAttribute('aria-label')
    if (label?.includes('light')) return 'light'
    if (label?.includes('dark')) return 'dark'
    return 'system'
  }

  /**
   * ダッシュボードに移動
   */
  async goToDashboard() {
    await this.dashboardLink.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ダークモードが適用されているか確認
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html')
    const classList = await html.getAttribute('class')
    return classList?.includes('dark') || false
  }
}
