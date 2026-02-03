# アーキテクチャ設計仕様

## 1. 背景・目的

本ドキュメントでは、Docker学習教材ウェブサイトのアーキテクチャ設計を定義する。
保守性、拡張性、テスタビリティを重視した設計とする。

## 2. ディレクトリ構造

```
docker-tutorial-website/
├── docs/                          # ドキュメント
│   ├── spec/                      # 仕様書
│   ├── tasks/                     # タスク管理
│   └── requirements/              # 要件定義
├── src/                           # ソースコード
│   ├── components/                # Reactコンポーネント
│   │   ├── common/                # 汎用コンポーネント
│   │   ├── layout/                # レイアウトコンポーネント
│   │   └── content/               # コンテンツ表示コンポーネント
│   ├── pages/                     # ページコンポーネント
│   ├── hooks/                     # カスタムフック
│   ├── stores/                    # Zustand ストア
│   ├── types/                     # TypeScript 型定義
│   ├── utils/                     # ユーティリティ関数
│   ├── content/                   # 学習コンテンツ（Markdown）
│   │   ├── chapters/              # チャプター別コンテンツ
│   │   └── metadata.ts            # コンテンツメタデータ
│   ├── styles/                    # グローバルスタイル
│   ├── routes/                    # ルーティング設定
│   ├── App.tsx                    # アプリケーションルート
│   └── main.tsx                   # エントリーポイント
├── e2e/                           # E2Eテスト
├── public/                        # 静的ファイル
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.ts
```

## 3. コンポーネント設計

### 3.1 レイヤー構成

```
┌─────────────────────────────────────────┐
│              Pages                       │
│  (Home, Chapter, Section, Dashboard)     │
├─────────────────────────────────────────┤
│            Layout Components             │
│  (Header, Sidebar, MainLayout, Footer)   │
├─────────────────────────────────────────┤
│           Content Components             │
│  (CodeBlock, ContentPage, Quiz, TOC)     │
├─────────────────────────────────────────┤
│           Common Components              │
│  (Button, Modal, Search, Icon)           │
├─────────────────────────────────────────┤
│         Hooks & Stores                   │
│  (useTheme, useProgress, progressStore)  │
├─────────────────────────────────────────┤
│            Utils & Types                 │
│  (markdownParser, contentLoader, types)  │
└─────────────────────────────────────────┘
```

### 3.2 主要コンポーネント

| コンポーネント | 責務 | 場所 |
|---------------|------|------|
| MainLayout | ページ全体のレイアウト制御 | layout/ |
| Header | ヘッダー、検索、テーマ切替 | layout/ |
| Sidebar | ナビゲーション、進捗表示 | layout/ |
| ContentPage | Markdownコンテンツ表示 | content/ |
| CodeBlock | コードのシンタックスハイライト | content/ |
| Quiz | クイズ機能 | content/ |

## 4. 状態管理設計

### 4.1 Zustand ストア構成

```typescript
// themeStore.ts - テーマ状態管理
interface ThemeStore {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: Theme) => void
}

// progressStore.ts - 学習進捗管理
interface ProgressStore {
  completedSections: string[]
  lastVisited: string | null
  bookmarks: string[]
  markAsCompleted: (sectionId: string) => void
  toggleBookmark: (sectionId: string) => void
  setLastVisited: (sectionId: string) => void
}
```

### 4.2 データフロー

```
User Action
    ↓
Component (dispatch action)
    ↓
Zustand Store (update state)
    ↓
LocalStorage (persist)
    ↓
Component (re-render with new state)
```

## 5. ルーティング設計

| パス | ページ | 説明 |
|------|--------|------|
| `/` | Home | トップページ |
| `/chapter/:chapterId` | Chapter | チャプター概要 |
| `/chapter/:chapterId/:sectionId` | Section | セクション詳細 |
| `/dashboard` | Dashboard | 進捗ダッシュボード |
| `/search` | Search | 検索結果 |
| `/bookmarks` | Bookmarks | ブックマーク一覧 |
| `*` | NotFound | 404ページ |

## 6. コンテンツ管理

### 6.1 Markdownファイル構造

```
src/content/chapters/
├── chapter-01/
│   ├── index.ts           # チャプターメタデータ
│   ├── section-01.md      # Dockerとは何か
│   ├── section-02.md      # 仮想マシンとコンテナの違い
│   └── ...
├── chapter-02/
│   └── ...
└── ...
```

### 6.2 メタデータ形式

```typescript
// src/content/metadata.ts
export const chapters: Chapter[] = [
  {
    id: 'chapter-01',
    title: '入門編 - Dockerを始めよう',
    description: 'Dockerの基本概念とインストール方法を学びます',
    level: 'beginner',
    sections: [
      {
        id: 'section-01',
        title: 'Dockerとは何か',
        slug: 'what-is-docker'
      },
      // ...
    ]
  }
]
```

## 7. パフォーマンス最適化

### 7.1 コード分割

- ページ単位でのReact.lazy()による遅延読み込み
- 大きなライブラリ（シンタックスハイライト等）の動的インポート

### 7.2 キャッシュ戦略

- Markdownコンテンツのメモ化
- 検索インデックスの初回構築後キャッシュ

## 8. テスト戦略

### 8.1 テストピラミッド

```
        E2E Tests (Playwright)
       /                      \
      /   Integration Tests    \
     /                          \
    /      Unit Tests (Vitest)   \
   ──────────────────────────────
```

### 8.2 テスト対象

| 種別 | 対象 | ツール |
|------|------|--------|
| Unit | コンポーネント、フック、ユーティリティ | Vitest, RTL |
| Integration | ストア連携、ルーティング | Vitest, RTL |
| E2E | ユーザーフロー | Playwright |
