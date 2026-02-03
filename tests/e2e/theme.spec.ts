import { test, expect } from '@playwright/test'
import { HeaderComponent } from './pages/HeaderComponent'
import { clearLocalStorage, setTheme } from './helpers/storage'

/**
 * テーマ切り替え機能
 * IMPORTANT: light → dark → system
 */
test.describe('テーマ切り替え機能', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await clearLocalStorage(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
  })

  test('テーマ切り替えボタンが表示される', async ({ page }) => {
    const header = new HeaderComponent(page)

    await expect(header.themeButton).toBeVisible()
  })

  test('テーマを light → dark に切り替えられる', async ({ page }) => {
    const header = new HeaderComponent(page)

    // 初期テーマを確認（通常はsystem）
    const initialTheme = await header.getCurrentTheme()

    // テーマを切り替え
    await header.toggleTheme()

    // テーマが変更されていることを確認
    const newTheme = await header.getCurrentTheme()
    expect(newTheme).not.toBe(initialTheme)
  })

  test('テーマを3回切り替えると元に戻る', async ({ page }) => {
    const header = new HeaderComponent(page)

    // 初期テーマを記録
    const initialTheme = await header.getCurrentTheme()

    // 3回切り替え（light → dark → system → light の循環）
    await header.toggleTheme()
    await header.toggleTheme()
    await header.toggleTheme()

    // 元のテーマに戻っていることを確認
    const finalTheme = await header.getCurrentTheme()
    expect(finalTheme).toBe(initialTheme)
  })

  test('darkテーマでhtml要素にdarkクラスが付与される', async ({ page }) => {
    // darkテーマを設定してリロード
    await setTheme(page, 'dark')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // html要素にdarkクラスがあることを確認
    const header = new HeaderComponent(page)
    const isDarkMode = await header.isDarkMode()
    expect(isDarkMode).toBe(true)
  })

  test('lightテーマでhtml要素にdarkクラスがない', async ({ page }) => {
    // lightテーマを設定してリロード
    await setTheme(page, 'light')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // html要素にdarkクラスがないことを確認
    const header = new HeaderComponent(page)
    const isDarkMode = await header.isDarkMode()
    expect(isDarkMode).toBe(false)
  })

  test('テーマ設定がページリロード後も保持される', async ({ page }) => {
    const header = new HeaderComponent(page)

    // darkテーマに切り替え
    await setTheme(page, 'dark')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // ダークモードが保持されていることを確認
    const isDarkAfterReload = await header.isDarkMode()
    expect(isDarkAfterReload).toBe(true)
  })

  test('テーマ変更がリアルタイムで反映される', async ({ page }) => {
    const header = new HeaderComponent(page)

    // lightテーマを設定
    await setTheme(page, 'light')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 初期状態を確認
    expect(await header.isDarkMode()).toBe(false)

    // テーマを切り替え（light → dark）
    await header.toggleTheme()

    // ダークモードになっていることを確認
    expect(await header.isDarkMode()).toBe(true)
  })
})

/**
 * systemテーマ（システム設定に追従）
 */
test.describe('systemテーマ', () => {
  test.setTimeout(60000)

  test('systemテーマではシステム設定に追従する（ライトモード）', async ({ page }) => {
    // システムテーマをライトモードに設定
    await page.emulateMedia({ colorScheme: 'light' })

    // systemテーマを設定
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await setTheme(page, 'system')
    // リロード後の待機を調整
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { state: 'visible' })

    // ライトモードになっていることを確認
    const header = new HeaderComponent(page)
    expect(await header.isDarkMode()).toBe(false)
  })

  test('systemテーマではシステム設定に追従する（ダークモード）', async ({ page }) => {
    // システムテーマをダークモードに設定
    await page.emulateMedia({ colorScheme: 'dark' })

    // systemテーマを設定
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await setTheme(page, 'system')
    // リロード後の待機を調整
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { state: 'visible' })

    // ダークモードになっていることを確認
    const header = new HeaderComponent(page)
    expect(await header.isDarkMode()).toBe(true)
  })
})
