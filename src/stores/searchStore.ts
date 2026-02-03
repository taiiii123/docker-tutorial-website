import { create } from 'zustand'

/**
 * 検索クエリの最大長（DoS対策）
 */
const MAX_QUERY_LENGTH = 100

/**
 * 検索ストアの型定義
 */
interface SearchState {
  /** 検索モーダルの表示状態 */
  isOpen: boolean
  /** 検索クエリ */
  query: string

  /** 検索モーダルを開く */
  openSearch: () => void
  /** 検索モーダルを閉じる */
  closeSearch: () => void
  /** 検索モーダルをトグル */
  toggleSearch: () => void
  /** 検索クエリを設定 */
  setQuery: (query: string) => void
}

/**
 * 検索状態管理用のZustandストア
 */
export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',

  openSearch: () => set({ isOpen: true, query: '' }),
  closeSearch: () => set({ isOpen: false, query: '' }),
  toggleSearch: () => set((state) => ({ isOpen: !state.isOpen, query: state.isOpen ? '' : state.query })),
  // クエリ長を制限（DoS対策）
  setQuery: (query) => set({ query: query.slice(0, MAX_QUERY_LENGTH) }),
}))
