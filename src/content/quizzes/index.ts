import type { Quiz } from '@/types'

/**
 * チャプター1のクイズ
 */
export const chapter01Quizzes: Quiz[] = [
  {
    id: 'chapter-01-quiz-01',
    question: 'Dockerコンテナの特徴として正しいものはどれですか？',
    options: [
      { id: 'a', text: '各コンテナが独自のOSカーネルを持つ' },
      { id: 'b', text: 'ホストOSのカーネルを共有する' },
      { id: 'c', text: '仮想マシンより起動が遅い' },
      { id: 'd', text: 'ハイパーバイザーが必須である' },
    ],
    correctOptionId: 'b',
    explanation: 'Dockerコンテナはホストマシンのカーネルを共有することで、軽量で高速に動作します。仮想マシンと異なり、各コンテナに専用のOSは不要です。',
  },
  {
    id: 'chapter-01-quiz-02',
    question: 'Docker Daemonの役割として正しいものはどれですか？',
    options: [
      { id: 'a', text: 'ユーザーがコマンドを入力するインターフェース' },
      { id: 'b', text: 'コンテナやイメージを管理するバックグラウンドサービス' },
      { id: 'c', text: 'Dockerイメージを保存するレジストリ' },
      { id: 'd', text: 'コンテナ間のネットワーク通信のみを担当' },
    ],
    correctOptionId: 'b',
    explanation: 'Docker Daemon（dockerd）はバックグラウンドで動作し、コンテナの作成・実行・停止、イメージ管理、ネットワーク管理などを行うサービスです。',
  },
]

/**
 * チャプター2のクイズ
 */
export const chapter02Quizzes: Quiz[] = [
  {
    id: 'chapter-02-quiz-01',
    question: 'Dockerイメージのレイヤー構造の利点はどれですか？',
    options: [
      { id: 'a', text: 'イメージのサイズが常に小さくなる' },
      { id: 'b', text: '共通レイヤーを再利用してストレージとビルド時間を節約できる' },
      { id: 'c', text: 'セキュリティが自動的に向上する' },
      { id: 'd', text: 'コンテナの起動時間が常に速くなる' },
    ],
    correctOptionId: 'b',
    explanation: 'レイヤー構造により、同じベースイメージや依存関係のレイヤーを複数のイメージで共有できます。これによりディスク使用量とビルド時間を大幅に削減できます。',
  },
  {
    id: 'chapter-02-quiz-02',
    question: '`docker run -d nginx` の `-d` フラグの意味は？',
    options: [
      { id: 'a', text: 'デバッグモードで実行' },
      { id: 'b', text: 'デタッチモード（バックグラウンド）で実行' },
      { id: 'c', text: 'ドライランモードで実行' },
      { id: 'd', text: 'コンテナを削除してから実行' },
    ],
    correctOptionId: 'b',
    explanation: '`-d` または `--detach` フラグは、コンテナをバックグラウンドで実行します。フォアグラウンドで実行する場合は省略します。',
  },
]

/**
 * チャプター3のクイズ
 */
export const chapter03Quizzes: Quiz[] = [
  {
    id: 'chapter-03-quiz-01',
    question: 'Dockerfileで `COPY` と `ADD` の主な違いは？',
    options: [
      { id: 'a', text: 'COPYはローカルファイルのみ、ADDはURLからのダウンロードと圧縮ファイルの自動展開にも対応' },
      { id: 'b', text: 'COPYは大きいファイル用、ADDは小さいファイル用' },
      { id: 'c', text: '機能は同じで名前だけが違う' },
      { id: 'd', text: 'ADDは非推奨で使用すべきでない' },
    ],
    correctOptionId: 'a',
    explanation: 'ADDはURLからのダウンロードや、tar.gzなどの圧縮ファイルの自動展開機能がありますが、予期しない動作を避けるため、単純なコピーにはCOPYを使用することが推奨されています。',
  },
  {
    id: 'chapter-03-quiz-02',
    question: '`CMD` と `ENTRYPOINT` の違いについて正しいのは？',
    options: [
      { id: 'a', text: 'CMDは上書き可能、ENTRYPOINTは上書きできない' },
      { id: 'b', text: 'CMDはdocker run時の引数で上書き可能、ENTRYPOINTは--entrypointオプションで上書き可能' },
      { id: 'c', text: '両方とも全く同じ動作をする' },
      { id: 'd', text: 'ENTRYPOINTはビルド時のみ使用される' },
    ],
    correctOptionId: 'b',
    explanation: 'CMDはdocker runの引数で簡単に上書きできますが、ENTRYPOINTを上書きするには--entrypointオプションが必要です。ENTRYPOINTとCMDを組み合わせて使うことも一般的です。',
  },
]

/**
 * チャプター4のクイズ
 */
export const chapter04Quizzes: Quiz[] = [
  {
    id: 'chapter-04-quiz-01',
    question: 'Docker Composeの主な利点はどれですか？',
    options: [
      { id: 'a', text: 'シングルコンテナの管理が簡単になる' },
      { id: 'b', text: '複数のコンテナを1つのYAMLファイルで定義し、一括で管理できる' },
      { id: 'c', text: 'Kubernetesの代わりになる' },
      { id: 'd', text: 'イメージのビルドが不要になる' },
    ],
    correctOptionId: 'b',
    explanation: 'Docker Composeは複数のサービス（コンテナ）をdocker-compose.ymlで宣言的に定義し、`docker compose up`で一括起動できます。開発環境の構築に特に有用です。',
  },
]

/**
 * 全クイズを取得
 */
export const allQuizzes: Quiz[] = [
  ...chapter01Quizzes,
  ...chapter02Quizzes,
  ...chapter03Quizzes,
  ...chapter04Quizzes,
]

/**
 * チャプターIDからクイズを取得
 */
export function getQuizzesByChapterId(chapterId: string): Quiz[] {
  switch (chapterId) {
    case 'chapter-01':
      return chapter01Quizzes
    case 'chapter-02':
      return chapter02Quizzes
    case 'chapter-03':
      return chapter03Quizzes
    case 'chapter-04':
      return chapter04Quizzes
    default:
      return []
  }
}
