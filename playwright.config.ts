import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * Docker学習サイト用
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',

  // テストの並列実行設定
  fullyParallel: true,

  // CI環境では.onlyを禁止
  forbidOnly: !!process.env.CI,

  // リトライ設定: CI環境では2回、ローカルでは0回
  retries: process.env.CI ? 2 : 0,

  // ワーカー数: CI環境では1、ローカルでは4に制限（リソース不足対策）
  workers: process.env.CI ? 1 : 4,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['list'],
  ],

  // グローバル設定
  use: {
    // ベースURL（E2Eテスト専用ポート）
    baseURL: process.env.BASE_URL || 'http://localhost:5174',

    // トレース: 失敗時のみ
    trace: 'on-first-retry',

    // スクリーンショット: 失敗時のみ
    screenshot: 'only-on-failure',

    // ビデオ: 失敗時のみ保持
    video: 'retain-on-failure',

    // タイムアウト設定
    actionTimeout: 15000,
    navigationTimeout: 45000,

    // ロケール設定（日本語UI対応）
    locale: 'ja-JP',
  },

  // プロジェクト設定（ブラウザ）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開発サーバー設定（E2Eテスト専用ポート）
  webServer: {
    command: 'npm run dev -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
