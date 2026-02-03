import { Page, Locator, expect } from '@playwright/test'

/**
 * 検索モーダルのPage Objectクラス
 * - Ctrl+K でモーダル表示
 * - キーワード検索
 * - 結果選択
 */
export class SearchModal {
  readonly page: Page

  // モーダル
  readonly modal: Locator
  readonly overlay: Locator

  // 検索入力
  readonly searchInput: Locator

  // 検索結果
  readonly searchResults: Locator
  readonly noResultsMessage: Locator
  readonly emptyStateMessage: Locator

  constructor(page: Page) {
    this.page = page

    // モーダル
    this.modal = page.locator('.fixed.inset-0.z-50')
    this.overlay = page.locator('.fixed.inset-0.bg-black\\/50')

    // 検索入力
    this.searchInput = page.locator('input[placeholder="セクションを検索..."]')

    // 検索結果
    this.searchResults = page.locator('button').filter({
      has: page.locator('.font-medium'),
    })
    this.noResultsMessage = page.locator('text=に一致する結果がありません')
    this.emptyStateMessage = page.locator('text=キーワードを入力して検索')
  }

  /**
   * Ctrl+K で検索モーダルを開く
   */
  async openWithKeyboard() {
    await this.page.keyboard.press('Control+k')
    await expect(this.modal).toBeVisible()
    await expect(this.searchInput).toBeFocused()
  }

  /**
   * 検索モーダルを閉じる
   */
  async close() {
    await this.page.keyboard.press('Escape')
    await expect(this.modal).toBeHidden()
  }

  /**
   * キーワードを入力して検索
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    // 検索結果が表示されるのを待つ
    await this.page.waitForTimeout(300)
  }

  /**
   * 検索結果数を取得
   */
  async getResultCount(): Promise<number> {
    return await this.searchResults.count()
  }

  /**
   * 指定したインデックスの結果をクリック
   */
  async clickResult(index: number) {
    await this.searchResults.nth(index).click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Enterキーで選択中の結果を確定
   */
  async confirmSelection() {
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 矢印キーで結果を選択
   */
  async navigateDown() {
    await this.page.keyboard.press('ArrowDown')
  }

  async navigateUp() {
    await this.page.keyboard.press('ArrowUp')
  }

  /**
   * 検索結果が存在するかを確認
   */
  async hasResults(): Promise<boolean> {
    const count = await this.getResultCount()
    return count > 0
  }

  /**
   * 検索結果なしメッセージが表示されているかを確認
   */
  async hasNoResultsMessage(): Promise<boolean> {
    return await this.noResultsMessage.isVisible()
  }
}
