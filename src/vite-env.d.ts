/// <reference types="vite/client" />

// Markdown ファイルの raw インポート
declare module '*.md?raw' {
  const content: string
  export default content
}

// SVG ファイルのインポート
declare module '*.svg' {
  const content: string
  export default content
}
