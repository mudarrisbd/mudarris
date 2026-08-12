// মুদাররিস — সার্ভিস ওয়ার্কার
// শুধুমাত্র অ্যাপের নিজস্ব শেল ক্যাশ করে, যাতে হোম স্ক্রিন থেকে ইনস্টল করা যায়
// এবং বন্ধ নেটওয়ার্কেও অ্যাপ খোলা যায়। Firebase ডেটা সবসময় নেটওয়ার্ক থেকেই আসবে।

const CACHE_NAME = 'mudarris-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // শুধু GET রিকোয়েস্ট, এবং একই অরিজিনের জন্য ক্যাশ ব্যবহার করি —
  // Firebase / Google Fonts এর মতো বাইরের রিকোয়েস্ট সবসময় নেটওয়ার্কে যাবে।
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
