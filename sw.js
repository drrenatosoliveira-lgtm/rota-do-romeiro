// Guarda o app no celular para funcionar sem internet; imagens do mapa ficam salvas conforme são vistas.
var VERSAO = 'romeiro-v1';
var APP = ['./', 'index.html', 'app.js', 'dados.js', 'manifest.webmanifest', 'icone.svg', 'icone-192.png', 'icone-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(APP); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO && k !== 'romeiro-mapa'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
var nTiles = 0;
self.addEventListener('fetch', function (e) {
  var u = e.request.url;
  if (e.request.method !== 'GET') return;
  if (u.indexOf('tile.openstreetmap.org') > -1 || u.indexOf('fonts.g') > -1) {
    e.respondWith(caches.open('romeiro-mapa').then(function (c) {
      return c.match(e.request).then(function (r) {
        var rede = fetch(e.request).then(function (resp) {
          if (resp.ok || resp.type === 'opaque') { c.put(e.request, resp.clone()); if (++nTiles % 50 === 0) limpar(c); }
          return resp;
        }).catch(function () { return r || new Response('', { status: 504 }); });
        return r || rede;
      });
    }));
    return;
  }
  // app: tenta a internet primeiro (pega atualizações); sem sinal, usa a cópia salva
  e.respondWith(fetch(e.request).then(function (resp) {
    if (resp.ok) { var cp = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(e.request, cp); }); }
    return resp;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
function limpar(c) { c.keys().then(function (ks) { if (ks.length > 2500) ks.slice(0, ks.length - 2500).forEach(function (k) { c.delete(k); }); }); }
