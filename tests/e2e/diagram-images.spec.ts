import { test, expect } from '@playwright/test'
import { SectionPage } from './pages/SectionPage'
import { clearLocalStorage, setTheme } from './helpers/storage'

/**
 * ダイアグラム画像表示テスト
 * IMPORTANT: セクションページ内のダイアグラム画像が正しく表示されることを検証
 *
 * 仕様: docs/spec/e2e-diagram-images-spec.md
 */
test.describe('ダイアグラム画像表示', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await clearLocalStorage(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
  })

  test('セクションページにダイアグラム画像が表示される', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    // chapter-01/section-01 には2枚のダイアグラム画像がある
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // ダイアグラム画像のセレクタ
    const diagramImages = page.locator('article.prose-docker img[src*="/images/diagrams/"]')

    // 画像が2枚表示されていることを確認
    await expect(diagramImages).toHaveCount(2)

    // 各画像が visible であることを確認
    for (let i = 0; i < 2; i++) {
      await expect(diagramImages.nth(i)).toBeVisible()
    }
  })

  test('ダイアグラム画像に loading="lazy" 属性が設定されている', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    const diagramImages = page.locator('article.prose-docker img[src*="/images/diagrams/"]')
    const imageCount = await diagramImages.count()

    // 全てのダイアグラム画像に loading="lazy" が設定されていることを確認
    for (let i = 0; i < imageCount; i++) {
      const loadingAttr = await diagramImages.nth(i).getAttribute('loading')
      expect(loadingAttr).toBe('lazy')
    }
  })

  test('ダイアグラム画像に適切な alt テキストが設定されている', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    const diagramImages = page.locator('article.prose-docker img[src*="/images/diagrams/"]')

    // 期待される alt テキスト（Markdown の記述順）
    const expectedAlts = [
      'イメージとコンテナの関係',
      'マイクロサービスアーキテクチャ',
    ]

    const imageCount = await diagramImages.count()
    expect(imageCount).toBe(expectedAlts.length)

    for (let i = 0; i < imageCount; i++) {
      const altText = await diagramImages.nth(i).getAttribute('alt')
      expect(altText).toBe(expectedAlts[i])
    }
  })

  test('ダイアグラム画像の src が正しいパスである', async ({ page }) => {
    const sectionPage = new SectionPage(page)

    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    const diagramImages = page.locator('article.prose-docker img[src*="/images/diagrams/"]')

    // 期待される src パス（Markdown の記述順）
    const expectedSrcs = [
      '/images/diagrams/docker-image-container.png',
      '/images/diagrams/docker-microservices.png',
    ]

    const imageCount = await diagramImages.count()
    expect(imageCount).toBe(expectedSrcs.length)

    for (let i = 0; i < imageCount; i++) {
      const src = await diagramImages.nth(i).getAttribute('src')
      expect(src).toBe(expectedSrcs[i])
    }
  })

  test('ダークモードでダイアグラム画像に白背景が適用される', async ({ page }) => {
    // ダークモードを設定してからセクションに移動
    await setTheme(page, 'dark')
    await page.reload({ waitUntil: 'domcontentloaded' })

    const sectionPage = new SectionPage(page)
    await sectionPage.goto('chapter-01', 'section-01')
    await sectionPage.waitForContentLoad()

    // html 要素に dark クラスが適用されていることを確認
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')

    const diagramImages = page.locator('article.prose-docker img[src*="/images/diagrams/"]')
    const firstImage = diagramImages.first()
    await expect(firstImage).toBeVisible()

    // ダークモード時の computed style を検証
    // CSS 仕様: .dark .prose-docker img に bg-white/95, p-3, border, rounded-xl が適用される
    const styles = await firstImage.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        // bg-white/95 は rgba(255, 255, 255, 0.95) に相当
        backgroundColor: computed.backgroundColor,
        // p-3 は 0.75rem (12px) に相当
        padding: computed.padding,
        // border が設定されていること
        borderStyle: computed.borderStyle,
        // rounded-xl は 0.75rem (12px) に相当
        borderRadius: computed.borderRadius,
      }
    })

    // 背景色が白系（rgba(255, 255, 255, 0.95)）であることを確認
    expect(styles.backgroundColor).toMatch(/rgba?\(255,\s*255,\s*255/)

    // パディングが設定されていることを確認（0px でないこと）
    expect(styles.padding).not.toBe('0px')

    // ボーダースタイルが設定されていることを確認
    expect(styles.borderStyle).not.toBe('none')

    // ボーダーラジウスが設定されていることを確認（0px でないこと）
    expect(styles.borderRadius).not.toBe('0px')
  })
})
