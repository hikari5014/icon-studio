/**
 * Service Worker：離線可用 ＋ 可控的更新。
 *
 * 策略刻意分兩種：
 *  - 導覽請求（開頁面）走 network-first：這樣「按了更新」之後一定拿得到新版。
 *    快取優先的話，使用者會永遠停在第一次裝的那一版，而且完全沒有線索。
 *  - 其他靜態檔走 cache-first：離線時整支工具照樣能用。
 *
 * ⚠ VERSION 必須跟著 js/version.js 的 APP_VERSION 一起改——
 *   不然舊快取不會被清掉，使用者更新完看到的還是舊程式。
 */
const VERSION = 'icon-studio-1.0.0'
const CORE = [
  './', './index.html', './styles.css', './manifest.webmanifest', './version.json',
  './js/main.js', './js/render.js', './js/export.js', './js/libs.js',
  './js/version.js', './js/changelog.js',
  './assets/icon.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // addAll 是「全有全無」：少一個檔就整個裝不起來。核心檔案本來就該全有，
      // 但個別資產（圖示）漏了不該讓整支 SW 裝不上去，所以分開處理。
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // 版本檔一律走網路：它的唯一用途就是回答「有沒有新版」，快取它等於讓這個問題永遠答錯
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)))
    return
  }

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { caches.open(VERSION).then((c) => c.put(req, r.clone())); return r })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) caches.open(VERSION).then((c) => c.put(req, r.clone()))
      return r
    }).catch(() => hit))
  )
})
