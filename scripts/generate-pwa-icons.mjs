/**
 * PWAアイコン生成スクリプト
 * SVGからPNGアイコンを生成する
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// アイコンサイズの定義
const sizes = [192, 512]

async function generateIcons() {
  const svgPath = join(rootDir, 'public', 'pwa-icon.svg')
  const svgBuffer = readFileSync(svgPath)

  for (const size of sizes) {
    const outputPath = join(rootDir, 'public', `pwa-${size}x${size}.png`)

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)

    console.log(`Generated: pwa-${size}x${size}.png`)
  }

  console.log('PWA icons generated successfully!')
}

generateIcons().catch(console.error)
