/* Rota do Romeiro — Taubaté → Basílica de Aparecida pela Rota da Luz */
(function () {
  'use strict';

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('romeiro.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('romeiro.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- dados ----------
  var base = [];
  (function () {
    var a = 0, b = 0, e = ROTA.enc;
    for (var i = 0; i < e.length; i += 2) { a += e[i]; b += e[i + 1]; base.push([a / 1e5, b / 1e5]); }
  })();
  var LAT0 = base[0][0], LON0 = base[0][1], COS0 = Math.cos(LAT0 * Math.PI / 180);
  function xy(p) { return [(p[1] - LON0) * 111320 * COS0, (p[0] - LAT0) * 110540]; }
  function acumular(pts) {
    var q = pts.map(xy), c = [0];
    for (var i = 1; i < q.length; i++) c.push(c[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
    return { xy: q, cum: c };
  }
  var baseCum = acumular(base).cum, BASE_TOTAL = baseCum[baseCum.length - 1];

  // ponto de partida escolhido (Catedral de Taubaté por padrão)
  var partidaKey = store.get('partida', 'taubate');
  var PT = partidaKey === 'aqui' ? store.get('partidaAqui', null) : PARTIDAS[partidaKey];
  if (!PT) partidaKey = 'taubate';
  var rota = PT ? PT.conn.concat(base.slice(PT.join + 1)) : base;
  var ac = acumular(rota), rxy = ac.xy, cum = ac.cum;
  var TOTAL = cum[cum.length - 1];
  var LIGA = PT ? cum[PT.conn.length - 1] : 0;          // metros do trecho de ligação
  var DESLOC = PT ? LIGA - PT.joinKm : 0;                // converte km da rota oficial para km desta caminhada
  function kmNovo(kmBase) { return kmBase + DESLOC / 1000; }
  var NOME_PARTIDA = PT ? PT.curto : 'Catedral de Taubaté';

  var PASSOS_BASE = [
    { km: 0, t: 'Saída na Catedral de São Francisco das Chagas (Praça Dom Epaminondas, centro de Taubaté). Siga pelas ruas do centro até a Av. São Pedro.' },
    { km: 2.2, t: 'Pegue a Av. São Pedro e, em seguida, a Av. Joaquim Ferreira da Silva.' },
    { km: 4.2, t: 'Entre na Estrada Municipal Prof. Dr. José Luiz Cembranelli (asfalto). Último apoio por 16 km: encha as garrafas no Assaí ou no Auto Posto Águia.', tag: 'risco', tagTxt: 'Abasteça' },
    { km: 9.4, t: 'Entre na estrada de terra da Rota da Luz. São 9,4 km de zona rural sem comércio. Siga as placas da Rota da Luz.', tag: 'terra', tagTxt: 'Terra' },
    { km: 18.8, t: 'Saída na Estrada Municipal Pinhão do Borba (asfalto), chegando a Pindamonhangaba.' },
    { km: 20.9, t: 'Continue pela Av. Dr. Antônio Pinheiro Júnior. Há uma UBS perto do caminho.' },
    { km: 22.3, t: 'Siga pela Av. Geraldo José Rodrigues Alckmin.' },
    { km: 24.6, t: 'Siga pela Av. Raul Nélson Guaragna e depois pela Av. Eduardo Ryomei Yassuda. Metade do caminho: bom lugar para pernoitar em Pinda.', tag: 'apoio', tagTxt: 'Metade' },
    { km: 26.2, t: 'Entre na Rodovia Vereador Abel Fabrício Dias, a Estrada Velha Rio–SP. Fique nela por cerca de 21,6 km. Esta estrada não é a Dutra.' },
    { km: 33, t: 'Passagem por Moreira César: postos de combustível, lanchonetes e igrejas na beira da estrada.', tag: 'apoio', tagTxt: 'Apoio' },
    { km: 41.7, t: 'Roseira: padaria, mercadinho e posto médico ao lado da rodovia.', tag: 'apoio', tagTxt: 'Apoio' },
    { km: 47.8, t: 'Entrada de Aparecida: Rua Itacoatiara, Av. Itaú e depois as ruas Itapetininga, Itapacaraí e Itaipé.' },
    { km: 48.4, t: 'Pegue a Av. Itaguaçu e siga por ela até o Santuário.' },
    { km: 51.4, t: 'Acesso ao Santuário Nacional.' },
    { km: BASE_TOTAL / 1000, t: 'Chegada à Basílica de Nossa Senhora Aparecida.' }
  ];
  var PASSOS, SECO, APOIOS;
  if (!PT) {
    PASSOS = PASSOS_BASE; SECO = [4.4, 20.9]; APOIOS = POIS;
  } else {
    var corte = PT.joinKm / 1000 + 0.1;
    PASSOS = PT.passos.map(function (s) { return { km: s[0], t: s[1] }; });
    if (PT.aviso) PASSOS[0].tag = 'risco', PASSOS[0].tagTxt = 'Atenção', PASSOS[0].t += ' ' + PT.aviso;
    PASSOS.push({ km: LIGA / 1000, t: 'Encontro com a Rota da Luz. Daqui em diante, siga as placas da Rota da Luz.', tag: 'apoio', tagTxt: 'Rota da Luz' });
    PASSOS_BASE.forEach(function (s) { if (s.km > corte) PASSOS.push({ km: kmNovo(s.km), t: s.t, tag: s.tag, tagTxt: s.tagTxt }); });
    SECO = PT.joinKm < 20900 ? [0, kmNovo(20.9)] : [-1, -1];
    APOIOS = POIS.filter(function (q) { return q.km * 1000 >= PT.joinKm - 50; }).map(function (q) { return Object.assign({}, q, { km: Math.round(kmNovo(q.km) * 10) / 10 }); });
  }
  var CIDADES = [['Pinda', 24.4], ['Moreira César', 33], ['Roseira', 41.7]]
    .map(function (c) { return [c[0], kmNovo(c[1])]; }).filter(function (c) { return c[1] > 1.5; });

  var CAT = {
    igreja: { cor: '#14306b', l: '✝', nome: 'Igreja' },
    posto: { cor: '#b26a00', l: 'P', nome: 'Posto' },
    comida: { cor: '#2e7d32', l: 'C', nome: 'Comida' },
    mercado: { cor: '#2e7d32', l: 'M', nome: 'Mercado' },
    saude: { cor: '#c62828', l: '+', nome: 'Saúde' },
    farmacia: { cor: '#c62828', l: 'F', nome: 'Farmácia' },
    banheiro: { cor: '#546e7a', l: 'WC', nome: 'Banheiro' },
    policia: { cor: '#37474f', l: 'PRF', nome: 'Polícia' },
    agua: { cor: '#0277bd', l: 'A', nome: 'Água' }
  };

  // ---------- util ----------
  function $(id) { return document.getElementById(id); }
  function fmtKm(m) { return (m / 1000).toFixed(1).replace('.', ','); }
  function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : fmtKm(m) + ' km'; }
  function hora(d) { return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function rumo(a, b) {
    var f1 = a[0] * Math.PI / 180, f2 = b[0] * Math.PI / 180, dl = (b[1] - a[1]) * Math.PI / 180;
    var y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function pontoCardeal(g) { return ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'][Math.round(g / 45) % 8]; }
  function pontoNoKm(m) {
    var lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= m) lo = mid; else hi = mid; }
    var t = cum[hi] === cum[lo] ? 0 : (m - cum[lo]) / (cum[hi] - cum[lo]);
    return [rota[lo][0] + t * (rota[hi][0] - rota[lo][0]), rota[lo][1] + t * (rota[hi][1] - rota[lo][1]), lo];
  }

  // Projeta posição na rota: distância até a linha, km percorrido, ponto mais próximo
  function projetar(p) {
    var q = xy(p), best = { d: 1e12 };
    for (var i = 0; i < rxy.length - 1; i++) {
      var a = rxy[i], b = rxy[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      var t = L2 ? ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      var px = a[0] + t * dx, py = a[1] + t * dy, d = Math.hypot(q[0] - px, q[1] - py);
      if (d < best.d) best = { d: d, i: i, t: t, along: cum[i] + t * Math.sqrt(L2) };
    }
    var s = rota[best.i], e = rota[best.i + 1];
    best.ponto = [s[0] + best.t * (e[0] - s[0]), s[1] + best.t * (e[1] - s[1])];
    return best;
  }

  // ---------- mapa ----------
  var mapa = L.map('mapa', { zoomControl: false, attributionControl: true, preferCanvas: true });
  mapa.createPane('vias'); mapa.getPane('vias').style.zIndex = 150;
  mapa.createPane('dutra'); mapa.getPane('dutra').style.zIndex = 390;
  var rendVias = L.canvas({ pane: 'vias', padding: 0.3 });
  var rendDutra = L.canvas({ pane: 'dutra', padding: 0.3 });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', crossOrigin: true
  }).addTo(mapa);

  // mapa base offline (ruas a até 500 m da rota) — aparece quando não há internet para as imagens
  var css = getComputedStyle(document.documentElement);
  var corVia = css.getPropertyValue('--via').trim() || '#b9bcc4', corViaF = css.getPropertyValue('--via-forte').trim() || '#8c909b';
  VIAS.forEach(function (v) {
    var f = v[2], pts = [];
    for (var j = 0; j < f.length; j += 2) pts.push([(f[j] - 2300000) / 1e5, (f[j + 1] - 4550000) / 1e5]);
    if (v[0] === 0) {
      L.polyline(pts, { renderer: rendDutra, color: '#d32f2f', weight: 5, opacity: 0.55, dashArray: '10 8', interactive: false }).addTo(mapa);
    } else {
      L.polyline(pts, { renderer: rendVias, color: v[0] <= 2 ? corViaF : corVia, weight: [0, 4, 3, 2, 1.5][v[0]] || 1.5, interactive: false }).addTo(mapa);
    }
  });

  var casing = L.polyline(rota, { color: '#ffffff', weight: 10, opacity: 0.9, interactive: false }).addTo(mapa);
  var linhaFeita = L.polyline([], { color: '#8a93ab', weight: 6, opacity: 0.9, interactive: false }).addTo(mapa);
  var linhaFalta = L.polyline(rota, { color: '#1f4fbf', weight: 6, opacity: 0.95, interactive: false }).addTo(mapa);
  var linhaVolta = L.polyline([], { color: '#c62828', weight: 3, dashArray: '6 6', interactive: false }).addTo(mapa);
  var linhaDesvio = L.polyline([], { color: '#ef6c00', weight: 6, opacity: 0.95, interactive: false }).addTo(mapa);

  // Fora da rota: calcula pelas ruas o caminho a pé de volta à Rota da Luz (sempre para frente, rumo à Basílica)
  var desvioEmCurso = false, desvioFalhou = 0;
  function pedirDesvio(p) {
    if (desvioEmCurso || Date.now() - desvioFalhou < 30000) return;
    var d0 = est.desvio;
    if (d0 && L.latLng(d0.origem).distanceTo(p) < 150 && Date.now() - d0.t < 180000) return;
    if (navigator.onLine === false) { est.desvioMsg = 'Sem internet para calcular pelas ruas.'; return; }
    desvioEmCurso = true;
    var minimo = Math.max(0, (est.maxAlong || 0) - 300), cands = [], ult = -1e9;
    for (var i = 0; i < rota.length; i++) if (cum[i] >= minimo && cum[i] - ult >= 250) { cands.push(i); ult = cum[i]; }
    cands.push(rota.length - 1);
    cands.sort(function (a, b) { return L.latLng(rota[a]).distanceTo(p) - L.latLng(rota[b]).distanceTo(p); });
    cands = cands.slice(0, 30);
    var srv = 'https://routing.openstreetmap.de/routed-foot/';
    var coords = [p].concat(cands.map(function (i) { return rota[i]; })).map(function (q) { return q[1].toFixed(6) + ',' + q[0].toFixed(6); }).join(';');
    fetch(srv + 'table/v1/foot/' + coords + '?sources=0&annotations=distance').then(function (r) { return r.json(); }).then(function (t) {
      var ds = t.distances[0].slice(1), melhor = -1, mv = 1e15;
      ds.forEach(function (d, k) { if (d != null && d + TOTAL - cum[cands[k]] < mv) { mv = d + TOTAL - cum[cands[k]]; melhor = cands[k]; } });
      if (melhor < 0) throw new Error('sem caminho');
      var j = rota[melhor];
      return fetch(srv + 'route/v1/foot/' + p[1] + ',' + p[0] + ';' + j[1] + ',' + j[0] + '?overview=full&geometries=geojson&steps=true').then(function (r) { return r.json(); }).then(function (r) {
        var rt = r.routes[0], ruas = [];
        rt.legs[0].steps.forEach(function (st) { if (st.name && ruas[ruas.length - 1] !== st.name) ruas.push(st.name); });
        var cs = rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }), kmVolta = cum[melhor];
        // corta o caminho no primeiro ponto em que ele já encosta na rota (não precisa andar em cima da linha azul)
        for (var q = 0; q < cs.length; q++) {
          var pj = projetar(cs[q]);
          if (pj.d < 30 && pj.along >= minimo) { cs = cs.slice(0, q + 1); kmVolta = pj.along; break; }
        }
        est.desvio = { origem: p, t: Date.now(), km: kmVolta, ruas: ruas, coords: cs };
        est.desvioMsg = null;
        if (est.fora) linhaDesvio.setLatLngs(est.desvio.coords);
      });
    }).catch(function () {
      desvioFalhou = Date.now(); est.desvioMsg = 'Não consegui calcular pelas ruas agora.';
    }).then(function () { desvioEmCurso = false; if (est.fora && est.ultimo) aoPosicionar(est.ultimo[0], est.ultimo[1], est.acc || 20, null); });
  }

  // marcos de km
  for (var k = 5000; k < TOTAL; k += 5000) {
    var pk = pontoNoKm(k);
    L.marker([pk[0], pk[1]], { interactive: false, icon: L.divIcon({ className: '', html: '<div style="font:700 12px/1 Barlow Condensed,Arial;background:#14306b;color:#fff;border-radius:4px;padding:2px 4px;border:1.5px solid #fff;white-space:nowrap">' + (k / 1000) + ' km</div>', iconSize: null, iconAnchor: [14, 9] }) }).addTo(mapa);
  }
  // trecho de terra sem apoio
  (function () {
    var ini = kmNovo(9.4) * 1000, fim = kmNovo(18.8) * 1000, seg = [];
    for (var i = 0; i < rota.length; i++) if (cum[i] >= ini && cum[i] <= fim) seg.push(rota[i]);
    L.polyline(seg, { color: '#a0712a', weight: 2, dashArray: '2 6', opacity: 0.9, interactive: false }).addTo(mapa);
  })();

  function pino(cls, txt, cor) { return L.divIcon({ className: '', html: '<div class="pino ' + cls + '" style="background:' + (cor || '') + '">' + txt + '</div>', iconSize: null, iconAnchor: [13, 13] }); }
  L.marker(rota[0], { icon: pino('saida', 'S') }).addTo(mapa).bindPopup('<b>Saída</b><br>' + (PT ? PT.nome : 'Catedral de São Francisco das Chagas, Taubaté'));
  if (PT) L.marker(base[PT.join], { icon: pino('', 'RL', '#c99a2e') }).addTo(mapa).bindPopup('<b>Encontro com a Rota da Luz</b><br>km ' + fmtKm(LIGA));
  L.marker(rota[rota.length - 1], { icon: L.divIcon({ className: '', html: '<div class="pino basilica">★</div>', iconSize: null, iconAnchor: [19, 19] }) }).addTo(mapa).bindPopup('<b>Basílica de Nossa Senhora Aparecida</b><br>km ' + fmtKm(TOTAL));
  var camadaApoio = L.layerGroup();
  mapa.on('zoomend', function () { if (mapa.getZoom() >= 14) camadaApoio.addTo(mapa); else camadaApoio.remove(); });
  APOIOS.forEach(function (p) {
    if (/Basílica|Catedral de São Francisco/.test(p.n)) return;
    var c = CAT[p.c] || CAT.igreja;
    L.marker(p.p, { icon: pino('', c.l, c.cor) }).addTo(camadaApoio)
      .bindPopup('<b>' + p.n + '</b><br>' + c.nome + ' · km ' + String(p.km).replace('.', ',') + (p.d > 80 ? ' · ' + p.d + ' m fora da rota' : ''));
  });

  mapa.fitBounds(L.latLngBounds(rota), { paddingTopLeft: [20, 150], paddingBottomRight: [20, 200] });

  // ---------- estado ----------
  var est = {
    seguir: true, ultimo: null, foraCont: 0, fora: false, historico: [], maxAlong: store.get('maxAlong', 0),
    ritmo: store.get('ritmo', 4.5), watchId: null, sim: false
  };
  var eu = null, euCirc = null;

  function iconeEu(head) {
    return L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11],
      html: '<div style="position:relative;width:22px;height:22px">' + (head == null ? '' : '<div class="eu-cone" style="transform:rotate(' + head + 'deg)"></div>') + '<div class="eu"></div></div>' });
  }

  // ---------- som / vibração ----------
  var audio = null;
  function destravarAudio() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} }
  function bipe() {
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400]);
    if (!audio) return;
    try {
      [0, 0.35].forEach(function (t0) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
        g.gain.setValueAtTime(0.0001, audio.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.5, audio.currentTime + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t0 + 0.28);
        o.start(audio.currentTime + t0); o.stop(audio.currentTime + t0 + 0.3);
      });
    } catch (e) {}
  }

  // ---------- atualização a cada posição ----------
  function chip(cls, txt) { var c = $('estado'); c.className = 'chip ' + cls; c.textContent = txt; }

  function aoPosicionar(lat, lon, acc, head) {
    var p = [lat, lon], agora = Date.now();
    var pr = projetar(p);

    if (!eu) { eu = L.marker(p, { icon: iconeEu(head), zIndexOffset: 1000, interactive: false }).addTo(mapa); euCirc = L.circle(p, { radius: acc, color: '#1a73e8', weight: 1, fillOpacity: 0.08, interactive: false }).addTo(mapa); }
    if (head == null && est.ultimo && L.latLng(est.ultimo).distanceTo(p) > 8) head = rumo(est.ultimo, p);
    eu.setLatLng(p); eu.setIcon(iconeEu(head)); euCirc.setLatLng(p).setRadius(Math.min(acc, 500));
    if (est.seguir) mapa.setView(p, Math.max(mapa.getZoom(), 16), { animate: !est.sim });

    var fraco = acc > 150;
    var limite = Math.max(70, Math.min(acc, 120) + 40);
    if (!fraco) {
      if (pr.d > limite) est.foraCont++; else if (pr.d < limite - 20) est.foraCont = 0;
    }
    var foraAgora = est.foraCont >= 2 || (est.sim && pr.d > limite);
    if (foraAgora && !est.fora) bipe();
    est.fora = foraAgora;

    // progresso (só conta quando perto da rota)
    var along = pr.along;
    if (pr.d < 250) {
      est.historico.push({ t: agora, a: along });
      est.historico = est.historico.filter(function (h) { return agora - h.t < 40 * 60000; });
      if (along > est.maxAlong) { est.maxAlong = along; store.set('maxAlong', along); }
    }
    var falta = Math.max(0, TOTAL - along);
    $('kmFalta').textContent = fmtKm(falta);
    $('progresso').style.width = (100 * along / TOTAL).toFixed(1) + '%';

    // ritmo medido (últimos 40 min)
    var h0 = est.historico[0];
    if (h0 && agora - h0.t > 10 * 60000 && along - h0.a > 400) {
      var kmh = (along - h0.a) / 1000 / ((agora - h0.t) / 3600000);
      if (kmh > 1.5 && kmh < 8) est.ritmo = kmh;
    }
    var chegada = new Date(agora + falta / 1000 / est.ritmo * 3600000);
    $('eta').textContent = falta < 50 ? 'Chegou' : hora(chegada);
    $('etaRot').textContent = 'chegada · ' + est.ritmo.toFixed(1).replace('.', ',') + ' km/h';

    // linhas feito / falta
    var corte = pr.i + 1;
    linhaFeita.setLatLngs(rota.slice(0, corte).concat([pr.ponto]));
    linhaFalta.setLatLngs([pr.ponto].concat(rota.slice(corte)));

    // alerta fora da rota
    if (est.fora) {
      $('alerta').hidden = false;
      chip('fora', 'Fora da rota');
      pedirDesvio(p);
      var alvo = pr.ponto, viaRuas = est.desvio && est.desvio.coords.length > 1;
      if (viaRuas) {
        // segue o caminho calculado pelas ruas: mira ~40 m à frente no trajeto de volta
        var dc = est.desvio.coords, k0 = 0, dmin = 1e12;
        for (var k = 0; k < dc.length; k++) { var dd = L.latLng(dc[k]).distanceTo(p); if (dd < dmin) { dmin = dd; k0 = k; } }
        var acc2 = 0, k1 = k0;
        while (k1 < dc.length - 1 && acc2 < 40) { acc2 += L.latLng(dc[k1]).distanceTo(dc[k1 + 1]); k1++; }
        alvo = dc[k1];
        var falta2 = k0 === 0 ? L.latLng(p).distanceTo(dc[0]) : 0; for (var k2 = k0; k2 < dc.length - 1; k2++) falta2 += L.latLng(dc[k2]).distanceTo(dc[k2 + 1]);
        $('alertaTit').textContent = 'Fora da rota · volta em ' + fmtDist(falta2);
        $('kmFalta').textContent = fmtKm(falta2 + TOTAL - est.desvio.km);
        $('alertaTxt').textContent = 'Siga a linha laranja pelas ruas' + (est.desvio.ruas.length ? ': ' + est.desvio.ruas.slice(0, 3).join(' → ') : '') + '. Ela leva de volta à Rota da Luz no km ' + fmtKm(est.desvio.km) + '.';
        // se você está fora de qualquer rua (campo, terreno), liga o ponto azul ao início do caminho
        linhaVolta.setLatLngs(L.latLng(dc[0]).distanceTo(p) > 20 && k0 === 0 ? [p, dc[0]] : []);
      } else {
        var r0 = rumo(p, pr.ponto);
        $('alertaTit').textContent = 'Fora da rota · ' + fmtDist(pr.d);
        $('alertaTxt').textContent = (est.desvioMsg || 'A linha azul fica a ' + fmtDist(pr.d) + ' para o ' + pontoCardeal(r0) + '.') + ' Siga a seta' + (head != null ? ' (relativa à direção em que você anda).' : ' (norte para cima).');
        linhaVolta.setLatLngs([p, pr.ponto]);
      }
      var r = rumo(p, alvo);
      $('setaSvg').style.transform = 'rotate(' + ((r - (head != null ? head : 0)) + 360) % 360 + 'deg)';
    } else {
      $('alerta').hidden = true; linhaVolta.setLatLngs([]);
      if (est.desvio || est.desvioMsg) { est.desvio = null; est.desvioMsg = null; linhaDesvio.setLatLngs([]); }
      var voltando = est.historico.length > 3 && est.maxAlong - along > 300 && pr.d < limite;
      if (fraco) chip('ruim', 'GPS fraco ±' + Math.round(acc) + ' m');
      else if (voltando) chip('ruim', 'Sentido contrário?');
      else chip('ok', 'Na rota');
    }

    // próximo passo e apoio
    var kmA = along / 1000;
    var prox = PASSOS.filter(function (s) { return s.km > kmA + 0.03; })[0];
    if (prox) { $('proxDist').textContent = fmtDist((prox.km - kmA) * 1000); $('proxTxt').textContent = prox.t; }
    var apoio = APOIOS.filter(function (q) { return q.km > kmA + 0.05 && q.c !== 'igreja'; })[0];
    var linhaA = $('apoioTxt').parentNode;
    if (kmA >= SECO[0] && kmA < SECO[1]) {
      linhaA.className = 'linha-prox apoio alerta-agua';
      $('apoioDist').textContent = fmtDist((SECO[1] - kmA) * 1000);
      $('apoioTxt').textContent = 'Trecho sem comércio. Economize água; próximo apoio no km 20,9 (Pinda).';
    } else if (apoio) {
      linhaA.className = 'linha-prox apoio';
      $('apoioDist').textContent = fmtDist((apoio.km - kmA) * 1000);
      $('apoioTxt').textContent = apoio.n + ' · ' + (CAT[apoio.c] || {}).nome;
    }

    est.ultimo = p; est.along = along; est.acc = acc;
    if (!$('gaveta').hidden && abaAtual === 'passos') render('passos');
  }

  // ---------- GPS ----------
  var UA = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && 'ontouchend' in document);
  var NAV_INTERNO = /Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp|; wv\)|GSA\//.test(UA);
  var diag = { erro: '-', fixes: 0, ultimoFix: null, precisao: null, modo: '-' };

  function ajudaPermissao() {
    return IOS
      ? 'No iPhone: Ajustes > Privacidade e Segurança > Serviços de Localização (ligado) > Sites do Safari > "Ao Usar o App" e "Localização Precisa" ligada. Depois recarregue esta página.'
      : 'No Android: ligue a Localização do celular (puxe a barra de cima). Depois, no Chrome, toque no ícone ao lado do endereço > Permissões > Localização > Permitir. Recarregue a página.';
  }
  function aoFix(pos) {
    if (est.sim) return;
    var c = pos.coords;
    diag.fixes++; diag.ultimoFix = new Date(); diag.precisao = Math.round(c.accuracy);
    aoPosicionar(c.latitude, c.longitude, c.accuracy, (c.heading != null && !isNaN(c.heading) && c.speed > 0.4) ? c.heading : null);
  }
  var reserva = null;
  function aoErro(err) {
    diag.erro = ['', 'permissão negada', 'posição indisponível', 'demorou demais'][err.code] || String(err.message);
    if (err.code === 1) {
      chip('fora', 'Localização bloqueada');
      avisoFixo('Localização bloqueada', ajudaPermissao());
      return;
    }
    if (!est.ultimo) chip('ruim', 'Procurando sinal…');
    // sem sinal de GPS preciso (ex.: dentro de casa): tenta também a localização aproximada
    if (reserva == null) {
      diag.modo = 'GPS + aproximada';
      reserva = navigator.geolocation.watchPosition(aoFix, function () {}, { enableHighAccuracy: false, maximumAge: 60000, timeout: 60000 });
    }
  }
  function ligarGPS() {
    destravarAudio();
    if (!window.isSecureContext) { avisoFixo('Endereço inseguro', 'Abra pelo link https://drrenatosoliveira-lgtm.github.io/rota-do-romeiro/'); return; }
    if (!('geolocation' in navigator)) { chip('fora', 'Sem GPS'); avisoFixo('Navegador sem GPS', 'Abra o link no Chrome (Android) ou no Safari (iPhone).'); return; }
    if (est.watchId != null) return;
    chip('ruim', 'Procurando GPS…');
    diag.modo = 'GPS';
    // primeira posição rápida (pode ser aproximada) + acompanhamento preciso
    navigator.geolocation.getCurrentPosition(aoFix, aoErro, { enableHighAccuracy: false, maximumAge: 120000, timeout: 15000 });
    est.watchId = navigator.geolocation.watchPosition(aoFix, aoErro, { enableHighAccuracy: true, maximumAge: 5000, timeout: 45000 });
    $('iniciar').hidden = true;
    store.set('gpsLigado', true);
    pedirTelaLigada();
    setTimeout(function () {
      if (!diag.fixes && !est.sim) avisoFixo('Ainda sem localização', 'Vá para perto de uma janela ou para fora de casa e espere um pouco. Se continuar assim: ' + ajudaPermissao());
    }, 25000);
  }
  function avisoFixo(t, s) {
    $('alerta').hidden = false; $('alertaTit').textContent = t; $('alertaTxt').textContent = s;
    $('setaSvg').style.transform = 'rotate(0deg)';
  }
  if (NAV_INTERNO) avisoFixo('Abra no navegador', 'Este link abriu dentro de outro app (WhatsApp/Instagram), que costuma bloquear o GPS. Toque nos 3 pontinhos e escolha "Abrir no ' + (IOS ? 'Safari' : 'Chrome') + '".');
  // se a localização já foi liberada antes, liga sozinho ao abrir
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (p) {
      diag.permissao = p.state;
      if (p.state === 'granted' && store.get('gpsLigado', false)) ligarGPS();
    }).catch(function () {});
  }
  function alertaSimples(t, s) {
    $('alerta').hidden = false; $('alertaTit').textContent = t; $('alertaTxt').textContent = s;
    setTimeout(function () { if (!est.fora) $('alerta').hidden = true; }, 9000);
  }
  $('iniciar').addEventListener('click', ligarGPS);

  // ---------- tela ligada ----------
  var trava = null;
  function pedirTelaLigada() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (w) {
      trava = w; $('bTela').classList.add('ativo'); $('bTela').setAttribute('aria-pressed', 'true');
      w.addEventListener('release', function () { $('bTela').classList.remove('ativo'); $('bTela').setAttribute('aria-pressed', 'false'); });
    }).catch(function () {});
  }
  $('bTela').addEventListener('click', function () {
    if (trava && !trava.released) { trava.release(); trava = null; } else pedirTelaLigada();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && $('bTela').getAttribute('aria-pressed') === 'false' && est.watchId != null && trava) pedirTelaLigada();
  });

  // ---------- seguir ----------
  function setSeguir(v) { est.seguir = v; $('bCentro').classList.toggle('ativo', v); $('bCentro').setAttribute('aria-pressed', String(v)); if (v && est.ultimo) mapa.setView(est.ultimo, Math.max(mapa.getZoom(), 16)); }
  $('bCentro').addEventListener('click', function () { setSeguir(!est.seguir || !est.ultimo ? true : false); if (!est.ultimo) mapa.fitBounds(L.latLngBounds(rota)); });
  mapa.on('dragstart', function () { setSeguir(false); });

  // ---------- enviar posição ----------
  $('bEnviar').addEventListener('click', function () {
    if (!est.ultimo) { alertaSimples('Ainda sem posição', 'Toque em "Começar caminhada" e espere o GPS achar você.'); return; }
    var p = est.ultimo, txt = 'Estou no km ' + fmtKm(est.along) + ' da Rota da Luz (faltam ' + fmtKm(TOTAL - est.along) + ' km até a Basílica). Minha localização: https://maps.google.com/?q=' + p[0].toFixed(5) + ',' + p[1].toFixed(5);
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    location.href = 'https://wa.me/?text=' + encodeURIComponent(txt);
  });

  // ---------- gaveta ----------
  var abaAtual = 'passos';
  function abrir() { $('gaveta').hidden = false; $('veu').hidden = false; render(abaAtual); }
  function fechar() { $('gaveta').hidden = true; $('veu').hidden = true; }
  $('bMais').addEventListener('click', abrir);
  $('bFechar').addEventListener('click', fechar);
  $('veu').addEventListener('click', fechar);
  document.querySelectorAll('.abas button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.abas button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      abaAtual = b.dataset.aba; render(abaAtual);
    });
  });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render(aba) {
    var kmA = (est.along || 0) / 1000, h = '';
    if (aba === 'passos') {
      var ops = [['taubate', 'Catedral de Taubaté', BASE_TOTAL]].concat(Object.keys(PARTIDAS).map(function (k) {
        var P = PARTIDAS[k], l = acumular(P.conn).cum; return [k, P.curto, l[l.length - 1] + BASE_TOTAL - P.joinKm];
      }));
      h = '<div class="bloco"><label for="selPartida">Saindo de</label><select id="selPartida">' + ops.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === partidaKey ? ' selected' : '') + '>' + o[1] + ' · ' + fmtKm(o[2]) + ' km</option>';
      }).join('') + '<option value="aqui"' + (partidaKey === 'aqui' ? ' selected' : '') + '>Onde estou agora (precisa de internet)</option></select>' +
        '<p id="partidaMsg" style="font-size:13px;color:var(--sutil);margin:6px 0 0">Ao trocar, o app recalcula os km até a Basílica.</p></div>' +
        '<ul class="lista">' + PASSOS.map(function (s) {
        return '<li class="' + (s.km < kmA - 0.05 ? 'passou' : '') + '"><div class="km">' + s.km.toFixed(1).replace('.', ',') + '</div><div class="t">' + (s.tag ? '<span class="tag ' + s.tag + '">' + s.tagTxt + '</span>' : '') + esc(s.t) + '</div></li>';
      }).join('') + '</ul>' +
        '<div class="legenda"><span><i style="background:#1f4fbf"></i>falta andar</span><span><i style="background:#8a93ab"></i>já andou</span><span><i style="background:#a0712a"></i>estrada de terra</span><span><i style="background:#d32f2f"></i>Dutra (evite)</span></div>';
    } else if (aba === 'apoio') {
      h = '<p style="font-size:14px;color:var(--sutil);margin:6px 0">Pontos do OpenStreetMap a até 300 m da rota. Pode haver mais comércio do que aparece aqui.</p><ul class="lista">' +
        APOIOS.map(function (q) {
          var c = CAT[q.c] || {};
          return '<li class="' + (q.km < kmA - 0.1 ? 'passou' : '') + '"><div class="km">' + String(q.km).replace('.', ',') + '</div><div class="t"><b>' + esc(q.n) + '</b><span>' + c.nome + (q.d > 80 ? ' · ' + q.d + ' m fora da rota' : ' · na rota') + '</span></div></li>';
        }).join('') + '</ul>';
    } else if (aba === 'sos') {
      h = '<div class="bloco"><h3>Ligue</h3><div class="tel">' +
        [['192', 'SAMU'], ['193', 'Bombeiros'], ['190', 'Polícia Militar'], ['191', 'Polícia Rodoviária Federal']].map(function (t) { return '<a href="tel:' + t[0] + '"><b>' + t[0] + '</b>' + t[1] + '</a>'; }).join('') +
        '</div></div><div class="bloco"><h3>Saúde perto da rota</h3><ul>' +
        APOIOS.filter(function (q) { return q.c === 'saude' || q.c === 'farmacia'; }).map(function (q) { return '<li>km ' + String(q.km).replace('.', ',') + ' · ' + esc(q.n) + '</li>'; }).join('') +
        '</ul></div><div class="bloco"><h3>Se perder o grupo</h3><p>Combinem agora um ponto de encontro em cada cidade' + (function () {
          var e = [['Assaí', 4.2], ['UBS de Pinda', 20.9], ['Paróquia São Benedito', 32.7], ['Padaria Bom Jesus, em Roseira', 42.5]].filter(function (x) { return !PT || x[1] * 1000 > PT.joinKm; });
          return e.length ? ': ' + e.map(function (x) { return x[0] + ' (km ' + kmNovo(x[1]).toFixed(1).replace('.', ',') + ')'; }).join(', ') : '';
        })() + '. Use "Onde estou" para mandar sua posição no WhatsApp.</p></div>';
    } else if (aba === 'dicas') {
      var horas = TOTAL / 1000 / est.ritmo;
      h = (!PT ? '<div class="bloco"><h3>Plano em 2 dias</h3><p><b>Dia 1:</b> Taubaté → Pindamonhangaba, cerca de 25 km, incluindo os 9,4 km de terra.<br><b>Dia 2:</b> Pinda → Basílica, cerca de 27 km pela Estrada Velha.</p><p>Em um dia só são 52 km, de 11 a 13 horas andando. Saia antes do amanhecer.</p></div>' +
        '<div class="bloco"><h3>Água</h3><p>Do km 4,4 ao km 20,9 não há comércio no mapa. Saia do Assaí ou do Auto Posto Águia (km 4,2) com pelo menos 2 litros por pessoa.</p></div>'
        : '<div class="bloco"><h3>Sua caminhada</h3><p>Saindo de ' + esc(PT.nome) + ': ' + fmtKm(TOTAL) + ' km até a Basílica, cerca de ' + Math.round(horas) + ' horas andando a ' + est.ritmo.toFixed(1).replace('.', ',') + ' km/h, sem contar as paradas.</p>' + (SECO[1] > 0 ? '<p><b>Água:</b> até o km ' + fmtKm(SECO[1] * 1000) + ' não há comércio no mapa. Leve pelo menos 2 litros por pessoa.</p>' : '') + '</div>') +
        '<div class="bloco"><h3>Bateria</h3><ul><li>Leve power bank e cabo.</li><li>Abra o app uma vez com internet antes de sair, para ele ficar salvo no celular.</li><li>Brilho baixo; "Tela ligada" só quando precisar olhar o mapa toda hora.</li><li>Sem internet, o mapa mostra só as ruas perto da rota (traço cinza). A linha azul e o GPS continuam funcionando.</li></ul></div>' +
        '<div class="bloco"><h3>Segurança</h3><ul><li>Na Estrada Velha, ande na contramão, de frente para os carros, e em fila.</li><li>Use colete ou fita refletiva e lanterna antes do sol nascer.</li><li>Siga as placas da Rota da Luz; o app é a confirmação.</li></ul></div>';
    } else if (aba === 'teste') {
      var km0 = (est.along || 0) / 1000;
      h = '<div class="bloco"><h3>Simular o percurso</h3><p>Use em casa para conhecer o caminho e testar o alerta. O GPS real fica pausado enquanto a simulação estiver ligada.</p>' +
        '<label for="simKm">Posição: km <b id="simKmTxt">' + km0.toFixed(1).replace('.', ',') + '</b></label><input type="range" id="simKm" min="0" max="' + (TOTAL / 1000).toFixed(1) + '" step="0.1" value="' + km0.toFixed(1) + '">' +
        '<label for="simOff">Desvio lateral: <b id="simOffTxt">0</b> m</label><input type="range" id="simOff" min="0" max="400" step="10" value="0">' +
        '<p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="botao" id="simLiga">' + (est.sim ? 'Atualizar' : 'Ligar simulação') + '</button><button class="botao sec" id="simDesliga">Voltar ao GPS real</button></p></div>' +
        '<div class="bloco"><h3>Ritmo</h3><label for="ritmo">Velocidade para a previsão: <b id="ritmoTxt">' + est.ritmo.toFixed(1).replace('.', ',') + '</b> km/h</label><input type="range" id="ritmo" min="2.5" max="6.5" step="0.1" value="' + est.ritmo.toFixed(1) + '"><p style="font-size:13px;color:var(--sutil)">Depois de 10 minutos andando, o app passa a usar o seu ritmo real.</p></div>' +
        '<div class="bloco"><h3>Diagnóstico do GPS</h3><p style="font-size:14px">' +
        'Aparelho: ' + (IOS ? 'iPhone' : 'Android/outro') + (NAV_INTERNO ? ' · <b style="color:var(--perigo)">navegador interno de app</b>' : '') +
        '<br>Site seguro: ' + (window.isSecureContext ? 'sim' : 'não') +
        '<br>Permissão: ' + (diag.permissao || 'não informada') +
        '<br>GPS ligado: ' + (est.watchId != null ? 'sim (' + diag.modo + ')' : 'não; toque em "Começar caminhada"') +
        '<br>Posições recebidas: ' + diag.fixes + (diag.ultimoFix ? ' · última às ' + hora(diag.ultimoFix) + ' · precisão ±' + diag.precisao + ' m' : '') +
        '<br>Último erro: ' + diag.erro + '</p><p style="font-size:13px;color:var(--sutil)">' + ajudaPermissao() + '</p></div>' +
        '<div class="bloco"><h3>Zerar progresso</h3><p><button class="botao sec" id="zerar">Zerar km percorridos</button></p></div>';
    }
    $('gavCorpo').innerHTML = h;
    if (aba === 'teste') ligarTeste();
    if (aba === 'passos') $('selPartida').addEventListener('change', function () { trocarPartida(this.value); });
  }

  function simAplicar() {
    var km = parseFloat($('simKm').value), off = parseFloat($('simOff').value);
    var p = pontoNoKm(km * 1000), i = Math.min(p[2], rota.length - 2), r = rumo(rota[i], rota[i + 1]);
    var lado = (r + 90) * Math.PI / 180, dlat = off * Math.cos(lado) / 110540, dlon = off * Math.sin(lado) / (111320 * Math.cos(p[0] * Math.PI / 180));
    est.sim = true; est.foraCont = 0;
    aoPosicionar(p[0] + dlat, p[1] + dlon, 10, r);
  }
  function ligarTeste() {
    $('simKm').addEventListener('input', function () { $('simKmTxt').textContent = this.value.replace('.', ','); if (est.sim) simAplicar(); });
    $('simOff').addEventListener('input', function () { $('simOffTxt').textContent = this.value; if (est.sim) simAplicar(); });
    $('simLiga').addEventListener('click', function () { destravarAudio(); setSeguir(true); simAplicar(); $('simLiga').textContent = 'Atualizar'; });
    $('simDesliga').addEventListener('click', function () { est.sim = false; est.historico = []; chip('ruim', 'Esperando GPS…'); if (est.watchId == null) ligarGPS(); });
    $('ritmo').addEventListener('input', function () { est.ritmo = parseFloat(this.value); store.set('ritmo', est.ritmo); $('ritmoTxt').textContent = this.value.replace('.', ','); });
    $('zerar').addEventListener('click', function () { est.maxAlong = 0; store.set('maxAlong', 0); est.historico = []; this.textContent = 'Zerado'; });
  }

  // ---------- troca do ponto de partida ----------
  function trocarPartida(v) {
    var msg = $('partidaMsg');
    if (v !== 'aqui') { store.set('partida', v); store.set('maxAlong', 0); location.reload(); return; }
    if (!('geolocation' in navigator)) { msg.textContent = 'Este celular não liberou o GPS.'; return; }
    msg.textContent = 'Procurando sua posição…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      var s = [pos.coords.latitude, pos.coords.longitude];
      msg.textContent = 'Calculando o caminho a pé até a Rota da Luz…';
      // candidatos: pontos da rota oficial a cada ~300 m, os 40 mais perto de você
      var cands = [], ult = -1e9;
      for (var i = 0; i < base.length; i++) if (baseCum[i] - ult >= 300) { cands.push(i); ult = baseCum[i]; }
      cands.sort(function (a, b) { return L.latLng(base[a]).distanceTo(s) - L.latLng(base[b]).distanceTo(s); });
      cands = cands.slice(0, 40);
      var srv = 'https://routing.openstreetmap.de/routed-foot/';
      var coords = [s].concat(cands.map(function (i) { return base[i]; })).map(function (p) { return p[1].toFixed(6) + ',' + p[0].toFixed(6); }).join(';');
      fetch(srv + 'table/v1/foot/' + coords + '?sources=0&annotations=distance').then(function (r) { return r.json(); }).then(function (t) {
        var ds = t.distances[0].slice(1), melhor = -1, mv = 1e15;
        ds.forEach(function (d, k) { if (d != null && d + BASE_TOTAL - baseCum[cands[k]] < mv) { mv = d + BASE_TOTAL - baseCum[cands[k]]; melhor = cands[k]; } });
        if (melhor < 0) throw new Error('sem caminho');
        var j = base[melhor];
        return fetch(srv + 'route/v1/foot/' + s[1] + ',' + s[0] + ';' + j[1] + ',' + j[0] + '?overview=full&geometries=geojson&steps=true').then(function (r) { return r.json(); }).then(function (r) {
          var rt = r.routes[0], ruas = [];
          rt.legs[0].steps.forEach(function (st) { if (st.name && ruas[ruas.length - 1] !== st.name) ruas.push(st.name); });
          store.set('partidaAqui', {
            nome: 'ponto marcado pelo GPS', curto: 'Onde eu estava', p: s, join: melhor, joinKm: Math.round(baseCum[melhor]),
            conn: rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }),
            passos: [[0, 'Saída do ponto marcado. Caminho a pé até a Rota da Luz: ' + (ruas.slice(0, 8).join(', ') || 'ruas próximas') + '.']],
            aviso: 'Trecho calculado pelo mapa, fora da rota oficial.'
          });
          store.set('partida', 'aqui'); store.set('maxAlong', 0); location.reload();
        });
      }).catch(function () { msg.textContent = 'Não consegui calcular agora (sem internet?). Escolha um dos pontos da lista ou tente de novo.'; });
    }, function () { msg.textContent = 'Não consegui sua posição. Libere a localização e tente de novo.'; }, { enableHighAccuracy: true, timeout: 30000 });
  }
  $('bPartida').addEventListener('click', function () {
    abaAtual = 'passos';
    document.querySelectorAll('.abas button').forEach(function (x) { x.setAttribute('aria-selected', String(x.dataset.aba === 'passos')); });
    abrir();
  });
  $('partidaNome').textContent = NOME_PARTIDA;
  $('proxTxt').textContent = PASSOS[0].t;
  $('marcos').innerHTML = '<span style="left:0">' + esc(NOME_PARTIDA.replace(/^(Catedral|Basílica|Matriz|Centro) de /, '')) + '</span>' +
    CIDADES.filter(function (c) { var f = c[1] * 1000 / TOTAL; return f > 0.15 && f < 0.85; }).map(function (c) { return '<span style="left:' + (100 * c[1] * 1000 / TOTAL).toFixed(1) + '%">' + c[0] + '</span>'; }).join('') +
    '<span style="left:100%">Basílica</span>';

  // primeira tela: apoio inicial
  (function () { var a = APOIOS.filter(function (q) { return q.c !== 'igreja'; })[0]; if (a) { $('apoioDist').textContent = fmtDist(a.km * 1000); $('apoioTxt').textContent = a.n + ' · ' + CAT[a.c].nome; } })();
  $('kmFalta').textContent = fmtKm(TOTAL);

  // ---------- offline ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
