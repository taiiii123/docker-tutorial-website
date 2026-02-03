import type { Chapter } from '@/types'

/**
 * 全チャプターのメタデータ定義
 * 実際のMarkdownコンテンツは各チャプターディレクトリに配置
 */
export const chapters: Chapter[] = [
  {
    id: 'chapter-01',
    number: 1,
    title: '入門編 - Dockerを始めよう',
    description: 'Dockerの基本概念とインストール方法を学びます',
    level: 'beginner',
    sections: [
      { id: 'section-01', title: 'Dockerとは何か', slug: 'what-is-docker' },
      { id: 'section-02', title: '仮想マシンとコンテナの違い', slug: 'vm-vs-container' },
      { id: 'section-03', title: 'Dockerのアーキテクチャ', slug: 'docker-architecture' },
      { id: 'section-04', title: 'Dockerのインストール', slug: 'docker-installation' },
      { id: 'section-05', title: '初めてのDockerコマンド', slug: 'first-docker-command' },
      { id: 'section-06', title: 'Docker Desktopの使い方', slug: 'docker-desktop' },
    ],
  },
  {
    id: 'chapter-02',
    number: 2,
    title: '基礎編 - イメージとコンテナ',
    description: 'Dockerイメージとコンテナの基本操作をマスターします',
    level: 'beginner',
    sections: [
      { id: 'section-01', title: 'Dockerイメージとは', slug: 'what-is-image' },
      { id: 'section-02', title: 'Docker Hubの使い方', slug: 'docker-hub' },
      { id: 'section-03', title: 'イメージの取得・一覧・削除', slug: 'image-management' },
      { id: 'section-04', title: 'コンテナの起動・停止・削除', slug: 'container-lifecycle' },
      { id: 'section-05', title: 'コンテナのライフサイクル', slug: 'lifecycle-details' },
      { id: 'section-06', title: 'コンテナ内での操作', slug: 'container-operations' },
      { id: 'section-07', title: 'ログの確認と管理', slug: 'container-logs' },
    ],
  },
  {
    id: 'chapter-03',
    number: 3,
    title: '基礎編 - Dockerfile',
    description: 'Dockerfileを使ってカスタムイメージを作成します',
    level: 'beginner',
    sections: [
      { id: 'section-01', title: 'Dockerfileの基本構文', slug: 'dockerfile-basics' },
      { id: 'section-02', title: 'FROM, RUN, COPY, ADD', slug: 'dockerfile-commands-1' },
      { id: 'section-03', title: 'WORKDIR, ENV, ARG', slug: 'dockerfile-commands-2' },
      { id: 'section-04', title: 'EXPOSE, CMD, ENTRYPOINT', slug: 'dockerfile-commands-3' },
      { id: 'section-05', title: '.dockerignoreの活用', slug: 'dockerignore' },
      { id: 'section-06', title: 'イメージのビルドとタグ付け', slug: 'image-build' },
      { id: 'section-07', title: 'レイヤーキャッシュの理解', slug: 'layer-cache' },
    ],
  },
  {
    id: 'chapter-04',
    number: 4,
    title: '中級編 - Docker Compose',
    description: '複数コンテナのアプリケーションを構築・管理します',
    level: 'intermediate',
    sections: [
      { id: 'section-01', title: 'Docker Composeとは', slug: 'what-is-compose' },
      { id: 'section-02', title: 'docker-compose.ymlの基本構文', slug: 'compose-syntax' },
      { id: 'section-03', title: '複数サービスの定義', slug: 'multiple-services' },
      { id: 'section-04', title: '環境変数と.envファイル', slug: 'environment-variables' },
      { id: 'section-05', title: 'サービス間の依存関係', slug: 'service-dependencies' },
      { id: 'section-06', title: 'Composeコマンド詳解', slug: 'compose-commands' },
      { id: 'section-07', title: '開発環境の構築例', slug: 'dev-environment' },
    ],
  },
  {
    id: 'chapter-05',
    number: 5,
    title: '中級編 - ネットワークとボリューム',
    description: 'Dockerのネットワークとデータ永続化を理解します',
    level: 'intermediate',
    sections: [
      { id: 'section-01', title: 'Dockerネットワークの基礎', slug: 'network-basics' },
      { id: 'section-02', title: 'ネットワークの種類', slug: 'network-types' },
      { id: 'section-03', title: 'カスタムネットワークの作成', slug: 'custom-network' },
      { id: 'section-04', title: 'コンテナ間通信', slug: 'container-communication' },
      { id: 'section-05', title: 'Dockerボリュームの基礎', slug: 'volume-basics' },
      { id: 'section-06', title: 'ボリュームの種類', slug: 'volume-types' },
      { id: 'section-07', title: 'データの永続化戦略', slug: 'persistence-strategy' },
    ],
  },
  {
    id: 'chapter-06',
    number: 6,
    title: '応用編 - イメージ最適化',
    description: '効率的で軽量なDockerイメージを作成します',
    level: 'advanced',
    sections: [
      { id: 'section-01', title: 'マルチステージビルド', slug: 'multi-stage-build' },
      { id: 'section-02', title: 'イメージサイズの削減テクニック', slug: 'size-reduction' },
      { id: 'section-03', title: 'ベースイメージの選択', slug: 'base-image-selection' },
      { id: 'section-04', title: 'レイヤー最適化', slug: 'layer-optimization' },
      { id: 'section-05', title: 'ビルド時間の短縮', slug: 'build-time-optimization' },
      { id: 'section-06', title: 'Docker BuildKit', slug: 'buildkit' },
    ],
  },
  {
    id: 'chapter-07',
    number: 7,
    title: '応用編 - セキュリティ',
    description: 'セキュアなコンテナ環境を構築します',
    level: 'advanced',
    sections: [
      { id: 'section-01', title: 'コンテナセキュリティの基礎', slug: 'security-basics' },
      { id: 'section-02', title: '非rootユーザーでの実行', slug: 'non-root-user' },
      { id: 'section-03', title: 'イメージの脆弱性スキャン', slug: 'vulnerability-scan' },
      { id: 'section-04', title: 'シークレット管理', slug: 'secret-management' },
      { id: 'section-05', title: 'ネットワークセキュリティ', slug: 'network-security' },
      { id: 'section-06', title: 'リソース制限', slug: 'resource-limits' },
      { id: 'section-07', title: 'セキュリティベストプラクティス', slug: 'security-best-practices' },
    ],
  },
  {
    id: 'chapter-08',
    number: 8,
    title: '実践編 - 本番環境',
    description: '本番環境でのDocker運用を学びます',
    level: 'advanced',
    sections: [
      { id: 'section-01', title: '本番環境向けDockerfile', slug: 'production-dockerfile' },
      { id: 'section-02', title: 'ヘルスチェックの実装', slug: 'health-check' },
      { id: 'section-03', title: 'ログ管理戦略', slug: 'log-management' },
      { id: 'section-04', title: 'コンテナの監視', slug: 'container-monitoring' },
      { id: 'section-05', title: 'バックアップとリストア', slug: 'backup-restore' },
      { id: 'section-06', title: 'Docker Swarmの基礎', slug: 'docker-swarm' },
    ],
  },
  {
    id: 'chapter-09',
    number: 9,
    title: '実践編 - CI/CD',
    description: 'CI/CDパイプラインでDockerを活用します',
    level: 'advanced',
    sections: [
      { id: 'section-01', title: 'CI/CDパイプラインでのDocker', slug: 'docker-in-cicd' },
      { id: 'section-02', title: 'GitHub ActionsでのDocker利用', slug: 'github-actions' },
      { id: 'section-03', title: 'プライベートレジストリ', slug: 'private-registry' },
      { id: 'section-04', title: 'イメージの自動ビルド', slug: 'auto-build' },
      { id: 'section-05', title: '自動デプロイメント', slug: 'auto-deployment' },
    ],
  },
  {
    id: 'chapter-10',
    number: 10,
    title: '実践編 - Kubernetes連携',
    description: 'DockerからKubernetesへの移行を理解します',
    level: 'advanced',
    sections: [
      { id: 'section-01', title: 'Kubernetesの概要', slug: 'kubernetes-overview' },
      { id: 'section-02', title: 'DockerからKubernetesへ', slug: 'docker-to-k8s' },
      { id: 'section-03', title: 'Podとコンテナ', slug: 'pods-and-containers' },
      { id: 'section-04', title: 'Deploymentの基礎', slug: 'deployment-basics' },
      { id: 'section-05', title: 'Docker Desktop + Kubernetes', slug: 'desktop-k8s' },
    ],
  },
  {
    id: 'chapter-11',
    number: 11,
    title: 'リファレンス',
    description: '必要な情報をすばやく参照できます',
    level: 'reference',
    sections: [
      { id: 'section-01', title: 'Dockerコマンド一覧', slug: 'docker-commands' },
      { id: 'section-02', title: 'Docker Composeコマンド一覧', slug: 'compose-commands-ref' },
      { id: 'section-03', title: 'Dockerfile命令一覧', slug: 'dockerfile-instructions' },
      { id: 'section-04', title: 'トラブルシューティングガイド', slug: 'troubleshooting' },
      { id: 'section-05', title: 'ベストプラクティス集', slug: 'best-practices' },
      { id: 'section-06', title: '用語集', slug: 'glossary' },
    ],
  },
]

/**
 * チャプターIDからチャプターを取得
 */
export const getChapterById = (chapterId: string): Chapter | undefined => {
  return chapters.find((chapter) => chapter.id === chapterId)
}

/**
 * セクションの完全IDを生成（例: 'chapter-01/section-01'）
 */
export const getSectionFullId = (chapterId: string, sectionId: string): string => {
  return `${chapterId}/${sectionId}`
}

/**
 * 全セクション数を取得
 */
export const getTotalSectionCount = (): number => {
  return chapters.reduce((total, chapter) => total + chapter.sections.length, 0)
}

/**
 * 次のセクションを取得
 */
export const getNextSection = (
  chapterId: string,
  sectionId: string
): { chapterId: string; sectionId: string } | null => {
  const chapter = getChapterById(chapterId)
  if (!chapter) return null

  const sectionIndex = chapter.sections.findIndex((s) => s.id === sectionId)

  // 同じチャプター内の次のセクション
  if (sectionIndex < chapter.sections.length - 1) {
    return {
      chapterId,
      sectionId: chapter.sections[sectionIndex + 1].id,
    }
  }

  // 次のチャプターの最初のセクション
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId)
  if (chapterIndex < chapters.length - 1) {
    const nextChapter = chapters[chapterIndex + 1]
    if (nextChapter.sections.length > 0) {
      return {
        chapterId: nextChapter.id,
        sectionId: nextChapter.sections[0].id,
      }
    }
  }

  return null
}

/**
 * 前のセクションを取得
 */
export const getPrevSection = (
  chapterId: string,
  sectionId: string
): { chapterId: string; sectionId: string } | null => {
  const chapter = getChapterById(chapterId)
  if (!chapter) return null

  const sectionIndex = chapter.sections.findIndex((s) => s.id === sectionId)

  // 同じチャプター内の前のセクション
  if (sectionIndex > 0) {
    return {
      chapterId,
      sectionId: chapter.sections[sectionIndex - 1].id,
    }
  }

  // 前のチャプターの最後のセクション
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId)
  if (chapterIndex > 0) {
    const prevChapter = chapters[chapterIndex - 1]
    if (prevChapter.sections.length > 0) {
      return {
        chapterId: prevChapter.id,
        sectionId: prevChapter.sections[prevChapter.sections.length - 1].id,
      }
    }
  }

  return null
}
