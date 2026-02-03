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
 * コード例の定義
 */
export interface CodeExample {
  /** プログラミング言語 */
  language: string
  /** コード内容 */
  code: string
  /** ファイル名（オプション） */
  filename?: string
  /** コードの説明 */
  description?: string
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
 * 目次項目
 */
export interface TocItem {
  /** 見出しID */
  id: string
  /** 見出しテキスト */
  text: string
  /** 見出しレベル（h2=2, h3=3） */
  level: number
}

/**
 * ユーザーの学習進捗
 */
export interface UserProgress {
  /** 完了したセクションIDの配列 */
  completedSections: string[]
  /** 最後に訪問したセクションID */
  lastVisited: string | null
  /** ブックマークしたセクションIDの配列 */
  bookmarks: string[]
  /** 最終更新日時 */
  updatedAt: string
}

/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * 検索結果
 */
export interface SearchResult {
  /** チャプターID */
  chapterId: string
  /** セクションID */
  sectionId: string
  /** チャプタータイトル */
  chapterTitle: string
  /** セクションタイトル */
  sectionTitle: string
  /** マッチしたテキストの抜粋 */
  excerpt: string
  /** マッチスコア */
  score: number
}

/**
 * ナビゲーション用のリンク情報
 */
export interface NavLink {
  /** リンク先パス */
  href: string
  /** 表示テキスト */
  label: string
  /** アイコン名（オプション） */
  icon?: string
}
