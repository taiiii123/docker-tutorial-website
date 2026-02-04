/**
 * 学習レベルの定義
 */
export type Level = 'beginner' | 'intermediate' | 'advanced' | 'reference'

/**
 * セクション（学習コンテンツの最小単位）
 */
export interface Section {
  /** セクションID（例: 'section-01'） */
  id: string
  /** セクションタイトル */
  title: string
  /** URLスラッグ */
  slug: string
  /** Markdownコンテンツ */
  content?: string
}

/**
 * チャプター（複数のセクションを含む）
 */
export interface Chapter {
  /** チャプターID（例: 'chapter-01'） */
  id: string
  /** チャプター番号 */
  number: number
  /** チャプタータイトル */
  title: string
  /** チャプターの説明 */
  description: string
  /** 学習レベル */
  level: Level
  /** 含まれるセクション */
  sections: Section[]
}

/**
 * クイズの選択肢
 */
export interface QuizOption {
  /** 選択肢ID */
  id: string
  /** 選択肢テキスト */
  text: string
}

/**
 * クイズ問題
 */
export interface Quiz {
  /** クイズID */
  id: string
  /** 問題文 */
  question: string
  /** 選択肢 */
  options: QuizOption[]
  /** 正解の選択肢ID */
  correctOptionId: string
  /** 解説 */
  explanation: string
}

/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark' | 'system'

