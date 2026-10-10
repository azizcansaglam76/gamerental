// GameRental service worker — index.html ile aynı klasöre koyun
// Sayfa için "önce ağ" stratejisi: her zaman en güncel sürüm gelir, internet yoksa son kopya gösterilir.
const CACHE = 'gamerental-v3';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Sadece kendi sayfamız; Firebase / bot istekleri asla önbelleğe alınmaz
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => { const kopya = res.clone(); caches.open(CACHE).then(c => c.put(req, kopya)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow(url);
    })
  );
});