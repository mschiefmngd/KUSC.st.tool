/* 오프라인 캐시 — 한 번 접속하면 이후에는 네트워크 없이도 열립니다 */
const CACHE = "kusc-diag-v1";
const CORE = ["./", "./index.html", "./manifest.json"];

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
  if (req.method !== "GET") return;                    // 응답 전송(POST)은 캐시하지 않음
  if (req.url.indexOf("script.google.com") > -1) return; // 구글 시트 전송도 통과

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (err) {} });
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
