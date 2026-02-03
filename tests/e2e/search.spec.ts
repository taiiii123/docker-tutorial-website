import { test, expect } from '@playwright/test'
import { SearchModal } from './pages/SearchModal'
import { clearLocalStorage } from './helpers/storage'

/**
 * 検索機能
 * CRITICAL: Ctrl+K → 検索 → 結果選択 → ページ移動
 */
test.describe('検索機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('Ctrl+Kで検索モーダルを開くことができる', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 検索入力にフォーカスがあることを確認
    await expect(searchModal.searchInput).toBeFocused()
  })

  test('検索モーダルをEscで閉じることができる', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // Escで閉じる
    await searchModal.close()

    // モーダルが閉じていることを確認
    await expect(searchModal.modal).toBeHidden()
  })

  test('キーワードを入力して検索結果が表示される', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 「Docker」で検索
    await searchModal.search('Docker')

    // 検索結果が表示されることを確認
    const hasResults = await searchModal.hasResults()
    expect(hasResults).toBe(true)
  })

  test('検索結果をクリックしてページに移動できる', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 「Docker」で検索
    await searchModal.search('Docker')

    // 最初の結果をクリック
    await searchModal.clickResult(0)

    // セクションページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\//)

    // モーダルが閉じていることを確認
    await expect(searchModal.modal).toBeHidden()
  })

  test('Enterキーで選択中の結果に移動できる', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 「コンテナ」で検索
    await searchModal.search('コンテナ')

    // 検索結果があることを確認
    const hasResults = await searchModal.hasResults()
    expect(hasResults).toBe(true)

    // Enterキーで確定
    await searchModal.confirmSelection()

    // セクションページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\//)
  })

  test('矢印キーで検索結果を選択できる', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 「Docker」で検索
    await searchModal.search('Docker')

    // 検索結果が複数あることを確認
    const resultCount = await searchModal.getResultCount()
    expect(resultCount).toBeGreaterThan(1)

    // 矢印キーで下に移動
    await searchModal.navigateDown()

    // Enterで確定して移動
    await searchModal.confirmSelection()

    // ページに移動していることを確認
    await expect(page).toHaveURL(/\/chapter\//)
  })

  test('検索結果がない場合にメッセージが表示される', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 存在しないキーワードで検索
    await searchModal.search('あいうえおかきくけこ12345')

    // 結果なしメッセージが表示されることを確認
    const hasNoResults = await searchModal.hasNoResultsMessage()
    expect(hasNoResults).toBe(true)
  })

  test('検索クエリをクリアすると初期状態に戻る', async ({ page }) => {
    const searchModal = new SearchModal(page)

    // 検索モーダルを開く
    await searchModal.openWithKeyboard()

    // 「Docker」で検索
    await searchModal.search('Docker')

    // 検索結果があることを確認
    expect(await searchModal.hasResults()).toBe(true)

    // 検索クエリをクリア
    await searchModal.search('')

    // 初期状態のメッセージが表示されることを確認
    await expect(searchModal.emptyStateMessage).toBeVisible()
  })
})
