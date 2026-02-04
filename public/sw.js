// Docker学習サイト Service Worker
const CACHE_NAME = 'docker-tutorial-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/docker-logo.svg',
  '/grid.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/manifest.webmanifest'
];

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// フェッチリクエストのハンドリング
self.addEventListener('fetch', (event) => {
  // GET以外はスキップ
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 同一オリジンのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // キャッシュがあればそれを返す（Network First for HTML, Cache First for assets）
      if (event.request.destination === 'document') {
        // HTMLはネットワーク優先
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => cachedResponse || caches.match('/index.html'));
      }

      // アセットはキャッシュ優先
      if (cachedResponse) {
        // バックグラウンドでキャッシュを更新
        fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        });
        return cachedResponse;
      }

      // キャッシュがない場合はネットワークから取得
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
