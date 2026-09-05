// خدمة عاملة أولية (placeholder) — سيتم استبدالها لاحقًا بمنطق تخزين مؤقت حقيقي (Workbox / vite-plugin-pwa)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // لا يوجد تخزين مؤقت الآن — هذه المرحلة تجهّز البنية فقط
});
