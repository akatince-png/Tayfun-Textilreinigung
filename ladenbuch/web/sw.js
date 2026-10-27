// Ladenbuch offline: die App-Dateien liegen im Gerätespeicher, Daten laufen immer über api.php
const VERSION = "ladenbuch-1.6.0";
const DATEIEN = ["./", "index.html", "app.css", "app.js", "schein.js", "qrcode.min.js", "logo.png", "manifest.webmanifest",
  "fonts/archivo-latin.woff2", "fonts/archivo-latin-ext.woff2", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN))));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", (e) => { if (e.data === "los") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith(".php")) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
