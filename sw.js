/* 오프라인 캐시 — 페이지는 최신을 먼저 받고, 안 되면 저장본을 보여줍니다 */
const CACHE = "kusc-v2";
const CORE = ["./", "./index.html", "./diagnostic.html", "./simulation.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.url.indexOf("script.google.com") > -1) return;

  /* 페이지 이동: 네트워크 우선 → 실패하면 캐시 */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  /* 나머지(폰트 등): 캐시 우선 */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (err) {} });
      return res;
    }))
  );
});
