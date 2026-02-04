/**
 * PWA（Progressive Web App）関連のテスト
 *
 * テスト対象:
 * 1. manifest.webmanifest の内容検証
 * 2. Service Worker の基本構造検証
 * 3. ビルド出力にPWAファイルが含まれることの検証
 * 4. index.html のPWA関連設定検証
 *
 * PWA要件:
 * - Web App Manifest（W3C仕様準拠）
 * - Service Worker（オフライン対応）
 * - HTTPS対応（本番環境）
 * - レスポンシブデザイン
 */
import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// プロジェクトルートのパス
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')

/**
 * PWAアイコンの型定義
 */
interface PWAIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

/**
 * Web App Manifestの型定義
 */
interface WebAppManifest {
  name: string
  short_name: string
  description?: string
  start_url: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  theme_color?: string
  background_color?: string
  lang?: string
  icons: PWAIcon[]
}

describe('PWA: manifest.webmanifest', () => {
  let manifest: WebAppManifest

  beforeAll(() => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest')
    const content = fs.readFileSync(manifestPath, 'utf-8')
    manifest = JSON.parse(content) as WebAppManifest
  })

  describe('JSON形式の検証', () => {
    it('有効なJSONとしてパースできる', () => {
      const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest')
      const content = fs.readFileSync(manifestPath, 'utf-8')
      expect(() => JSON.parse(content)).not.toThrow()
    })
  })

  describe('必須フィールド', () => {
    it('name フィールドが存在し、適切な値を持つ', () => {
      expect(manifest.name).toBeDefined()
      expect(typeof manifest.name).toBe('string')
      expect(manifest.name).toBe('Docker学習サイト')
    })

    it('short_name フィールドが存在し、12文字以内である', () => {
      expect(manifest.short_name).toBeDefined()
      expect(typeof manifest.short_name).toBe('string')
      // short_name は12文字以内が推奨
      expect((manifest.short_name as string).length).toBeLessThanOrEqual(12)
    })

    it('start_url フィールドが存在する', () => {
      expect(manifest.start_url).toBeDefined()
      expect(manifest.start_url).toBe('/')
    })

    it('display フィールドが有効な値を持つ', () => {
      const validDisplayValues = ['fullscreen', 'standalone', 'minimal-ui', 'browser']
      expect(manifest.display).toBeDefined()
      expect(validDisplayValues).toContain(manifest.display)
    })

    it('icons フィールドに必要なアイコンが含まれる', () => {
      expect(manifest.icons).toBeDefined()
      expect(Array.isArray(manifest.icons)).toBe(true)

      const icons = manifest.icons

      // 192x192 アイコンが存在する
      const icon192 = icons.find((icon) => icon.sizes === '192x192')
      expect(icon192).toBeDefined()
      expect(icon192?.type).toBe('image/png')

      // 512x512 アイコンが存在する
      const icon512 = icons.find((icon) => icon.sizes === '512x512')
      expect(icon512).toBeDefined()
      expect(icon512?.type).toBe('image/png')
    })

    it('icons の src パスが / で始まる（絶対パス）', () => {
      const icons = manifest.icons
      icons.forEach((icon) => {
        expect(icon.src).toMatch(/^\//)
      })
    })
  })

  describe('推奨フィールド', () => {
    it('description フィールドが存在する', () => {
      expect(manifest.description).toBeDefined()
      expect(typeof manifest.description).toBe('string')
      expect((manifest.description as string).length).toBeGreaterThan(0)
    })

    it('theme_color フィールドが有効なカラーコードを持つ', () => {
      expect(manifest.theme_color).toBeDefined()
      // 有効なカラーコード形式 (#RRGGBB または #RGB)
      expect(manifest.theme_color).toMatch(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    })

    it('background_color フィールドが有効なカラーコードを持つ', () => {
      expect(manifest.background_color).toBeDefined()
      expect(manifest.background_color).toMatch(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    })

    it('lang フィールドが日本語に設定されている', () => {
      expect(manifest.lang).toBe('ja')
    })
  })

  describe('アイコン設定', () => {
    it('maskable アイコンが含まれている', () => {
      const icons = manifest.icons
      const maskableIcon = icons.find(
        (icon) => icon.purpose && icon.purpose.includes('maskable')
      )
      expect(maskableIcon).toBeDefined()
    })

    it('アイコンが最低2つ以上定義されている', () => {
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('theme_color と index.html の一貫性', () => {
    it('theme_color が index.html の meta タグと一致する', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html')
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

      // index.html から theme-color を抽出
      const themeColorMatch = htmlContent.match(
        /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/
      )
      expect(themeColorMatch).not.toBeNull()

      if (themeColorMatch) {
        expect(manifest.theme_color).toBe(themeColorMatch[1])
      }
    })
  })
})

describe('PWA: Service Worker (sw.js)', () => {
  let swContent: string

  beforeAll(() => {
    const swPath = path.join(PUBLIC_DIR, 'sw.js')
    swContent = fs.readFileSync(swPath, 'utf-8')
  })

  describe('基本構造', () => {
    it('キャッシュ名が定義されている', () => {
      expect(swContent).toMatch(/CACHE_NAME\s*=\s*['"`]/)
    })

    it('静的アセットリストが定義されている', () => {
      expect(swContent).toMatch(/STATIC_ASSETS\s*=\s*\[/)
    })

    it('install イベントリスナーが登録されている', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]install['"`]/)
    })

    it('activate イベントリスナーが登録されている', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]activate['"`]/)
    })

    it('fetch イベントリスナーが登録されている', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]fetch['"`]/)
    })
  })

  describe('キャッシュ戦略', () => {
    it('caches.open が使用されている', () => {
      expect(swContent).toMatch(/caches\.open/)
    })

    it('caches.match が使用されている', () => {
      expect(swContent).toMatch(/caches\.match/)
    })

    it('古いキャッシュを削除する処理がある', () => {
      expect(swContent).toMatch(/caches\.delete/)
    })
  })

  describe('静的アセット', () => {
    it('index.html がキャッシュ対象に含まれる', () => {
      expect(swContent).toMatch(/['"`]\/index\.html['"`]/)
    })

    it('manifest.webmanifest がキャッシュ対象に含まれる', () => {
      expect(swContent).toMatch(/['"`]\/manifest\.webmanifest['"`]/)
    })
  })

  describe('セキュリティ', () => {
    it('同一オリジンチェックが実装されている', () => {
      // location.origin との比較
      expect(swContent).toMatch(/origin/)
    })

    it('GETリクエストのみを処理する', () => {
      expect(swContent).toMatch(/method\s*[!=]==?\s*['"`]GET['"`]/)
    })
  })

  describe('ライフサイクル', () => {
    it('skipWaiting が呼び出されている', () => {
      expect(swContent).toMatch(/skipWaiting\s*\(\s*\)/)
    })

    it('clients.claim が呼び出されている', () => {
      expect(swContent).toMatch(/clients\.claim\s*\(\s*\)/)
    })

    it('event.waitUntil が使用されている', () => {
      expect(swContent).toMatch(/event\.waitUntil/)
    })
  })

  describe('エラーハンドリング', () => {
    it('fetch 失敗時のフォールバック処理がある', () => {
      expect(swContent).toMatch(/\.catch/)
    })
  })
})

describe('PWA: index.html の設定', () => {
  let htmlContent: string

  beforeAll(() => {
    const htmlPath = path.join(PROJECT_ROOT, 'index.html')
    htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  })

  describe('マニフェストリンク', () => {
    it('manifest.webmanifest へのリンクが存在する', () => {
      expect(htmlContent).toMatch(/<link[^>]*rel=["']manifest["'][^>]*>/)
      expect(htmlContent).toMatch(/href=["'][^"']*manifest\.webmanifest["']/)
    })
  })

  describe('メタタグ', () => {
    it('theme-color メタタグが存在する', () => {
      expect(htmlContent).toMatch(/<meta[^>]*name=["']theme-color["'][^>]*>/)
    })

    it('apple-mobile-web-app-capable メタタグが存在する', () => {
      expect(htmlContent).toMatch(/<meta[^>]*name=["']apple-mobile-web-app-capable["'][^>]*>/)
    })

    it('apple-touch-icon リンクが存在する', () => {
      expect(htmlContent).toMatch(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>/)
    })

    it('viewport メタタグが存在する', () => {
      expect(htmlContent).toMatch(/<meta[^>]*name=["']viewport["'][^>]*>/)
    })
  })

  describe('Service Worker 登録', () => {
    it('Service Worker 登録スクリプトが存在する', () => {
      expect(htmlContent).toMatch(/serviceWorker/)
      expect(htmlContent).toMatch(/register\s*\(\s*['"`]\/sw\.js['"`]/)
    })

    it('Service Worker 対応チェックがある', () => {
      expect(htmlContent).toMatch(/['"`]serviceWorker['"`]\s*in\s*navigator/)
    })
  })
})

describe('PWA: ファイルの存在確認', () => {
  it('manifest.webmanifest が存在する', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest')
    expect(fs.existsSync(manifestPath)).toBe(true)
  })

  it('sw.js が存在する', () => {
    const swPath = path.join(PUBLIC_DIR, 'sw.js')
    expect(fs.existsSync(swPath)).toBe(true)
  })

  it('index.html が存在する', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'index.html')
    expect(fs.existsSync(htmlPath)).toBe(true)
  })

  describe('アイコンファイル', () => {
    it('pwa-192x192.png が存在する', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-192x192.png')
      expect(fs.existsSync(iconPath)).toBe(true)
    })

    it('pwa-512x512.png が存在する', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-512x512.png')
      expect(fs.existsSync(iconPath)).toBe(true)
    })
  })
})

describe('PWA: ビルド出力検証', () => {
  const DIST_DIR = path.join(PROJECT_ROOT, 'dist')

  // ビルドが実行されている場合のみテスト
  describe.skipIf(!fs.existsSync(DIST_DIR))('distディレクトリ', () => {
    it('manifest.webmanifest がビルド出力に含まれる', () => {
      const manifestPath = path.join(DIST_DIR, 'manifest.webmanifest')
      expect(fs.existsSync(manifestPath)).toBe(true)
    })

    it('sw.js がビルド出力に含まれる', () => {
      const swPath = path.join(DIST_DIR, 'sw.js')
      expect(fs.existsSync(swPath)).toBe(true)
    })

    it('PWAアイコンがビルド出力に含まれる', () => {
      const icon192Path = path.join(DIST_DIR, 'pwa-192x192.png')
      const icon512Path = path.join(DIST_DIR, 'pwa-512x512.png')
      expect(fs.existsSync(icon192Path)).toBe(true)
      expect(fs.existsSync(icon512Path)).toBe(true)
    })

    it('ビルド出力の manifest.webmanifest が有効なJSONである', () => {
      const manifestPath = path.join(DIST_DIR, 'manifest.webmanifest')
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()
      }
    })
  })
})

describe('PWA: アイコンファイルの検証', () => {
  describe('192x192 アイコン', () => {
    it('ファイルサイズが適切である（1KB以上10MB以下）', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-192x192.png')
      const stats = fs.statSync(iconPath)
      // 1KB以上（空ファイルでない）
      expect(stats.size).toBeGreaterThan(1024)
      // 10MB以下（過度に大きくない）
      expect(stats.size).toBeLessThan(10 * 1024 * 1024)
    })

    it('PNGファイルのマジックナンバーを持つ', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-192x192.png')
      const buffer = fs.readFileSync(iconPath)
      // PNG マジックナンバー: 89 50 4E 47 0D 0A 1A 0A
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      expect(buffer.slice(0, 8).equals(pngMagic)).toBe(true)
    })
  })

  describe('512x512 アイコン', () => {
    it('ファイルサイズが適切である（1KB以上10MB以下）', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-512x512.png')
      const stats = fs.statSync(iconPath)
      expect(stats.size).toBeGreaterThan(1024)
      expect(stats.size).toBeLessThan(10 * 1024 * 1024)
    })

    it('PNGファイルのマジックナンバーを持つ', () => {
      const iconPath = path.join(PUBLIC_DIR, 'pwa-512x512.png')
      const buffer = fs.readFileSync(iconPath)
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      expect(buffer.slice(0, 8).equals(pngMagic)).toBe(true)
    })
  })
})
