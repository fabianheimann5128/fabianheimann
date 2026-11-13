/* Landingpage-System – „Der rote Faden“ auf hellem Grund. Aus main.js abgeleitet, ohne Abhängigkeiten. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = '#ff3d1f', GLOW = 0; // auf hellem Grund ohne Leuchten

  let vw = innerWidth, vh = innerHeight, sy = scrollY, time = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  /* ---------- Wörter aufteilen (Überschriften & Lesetext) ---------- */
  function splitWords(el, cls, counter = { i: 0 }) {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          if (cls === 'w') {
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi'; wi.style.setProperty('--i', counter.i++); wi.textContent = part;
            w.append(wi);
          } else { w.className = cls; w.textContent = part; }
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n, cls, counter);
    });
  }
  $$('[data-split]').forEach(el => { el.setAttribute('aria-label', el.textContent); splitWords(el, 'w'); });
  $$('[data-words]').forEach(el => splitWords(el, 'wd'));
  $$('.foot__mark span').forEach((s, i) => s.style.setProperty('--i', i));

  /* ---------- Einblenden beim Sichtbarwerden ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: .15 });
  $$('[data-reveal], [data-split]:not(.hero__title), .service, .foot__mark').forEach(el => io.observe(el));
  const stepIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting || e.boundingClientRect.top < 0)),
    { rootMargin: '0px 0px -38% 0px' });
  $$('.step').forEach(el => stepIO.observe(el));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('.hero').classList.add('loaded'); $('.hero__title').classList.add('is-in');
  }));

  /* ---------- Der Faden über die ganze Seite ---------- */
  const page = $('.page'), svg = $('.thread'), path = $('.thread__path'), tip = $('.thread__tip');
  const knots = $$('[data-knot]');
  let L = 0, ys = [], drawn = 0;
  function buildThread() {
    const W = page.clientWidth, H = page.offsetHeight, pr = page.getBoundingClientRect();
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pts = knots.map(k => { const r = k.getBoundingClientRect(); return [r.left - pr.left, r.top - pr.top]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], h = (y1 - y0) * .5;
      const dx = x1 - x0, dy = y1 - y0;
      if (Math.abs(dx) > 2 && dy < Math.abs(dx) * .7) { // wenig Höhe, viel Weg: der Faden biegt sauber um die Ecke
        const ym = (y0 + y1) / 2, r = Math.min(dy / 2, Math.abs(dx) / 2, 56), sx = Math.sign(dx);
        d += `L${x0} ${ym - r}Q${x0} ${ym} ${x0 + sx * r} ${ym}L${x1 - sx * r} ${ym}Q${x1} ${ym} ${x1} ${ym + r}L${x1} ${y1}`;
      } else d += `C${x0} ${y0 + h} ${x1} ${y1 - h} ${x1} ${y1}`;
    }
    path.setAttribute('d', d);
    L = path.getTotalLength();
    path.style.strokeDasharray = `${L} ${L}`;
    const n = Math.ceil(L / 8); ys = new Float32Array(n + 1);
    let m = -1e9;
    for (let i = 0; i <= n; i++) { m = Math.max(m, path.getPointAtLength(i / n * L).y); ys[i] = m; }
  }
  function drawThread() {
    const target = sy + vh * .62;
    let lo = 0, hi = ys.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ys[mid] <= target) lo = mid; else hi = mid - 1; }
    const len = ys[0] > target ? 0 : lo / (ys.length - 1) * L;
    drawn = reduced ? len : drawn + (len - drawn) * .18;
    path.style.strokeDashoffset = L - drawn;
    const p = path.getPointAtLength(drawn);
    tip.setAttribute('cx', p.x); tip.setAttribute('cy', p.y);
    tip.style.opacity = drawn > 2 && drawn < L - 2 ? 1 : 0;
  }

  /* ---------- 01 · Hero: Faden als Seil (Verlet) ---------- */
  const hero = $('.hero'), heroInner = $('.hero__inner'), rope = $('.hero__rope'), rctx = rope.getContext('2d');
  const N = 54; let rp = [], rest = 0, rw = 0, rh = 0, A, B, mouse = { x: -999, y: -999 }, heroOn = true;
  function initRope() {
    rw = hero.clientWidth; rh = hero.clientHeight;
    rope.width = rw * dpr; rope.height = rh * dpr; rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const kr = $('.knot--hero').getBoundingClientRect(), hr = hero.getBoundingClientRect();
    A = { x: rw * (vw < 860 ? 1.02 : .9), y: -30 }; B = { x: kr.left - hr.left, y: rh + 2 };
    rest = Math.hypot(B.x - A.x, B.y - A.y) * 1.16 / (N - 1);
    rp = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1), x = A.x + (B.x - A.x) * t + Math.sin(t * Math.PI) * rw * .12, y = A.y + (B.y - A.y) * t;
      return { x, y, px: x, py: y };
    });
  }
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
  function stepRope() {
    if (!reduced) {
      for (let i = 1; i < N - 3; i++) {
        const p = rp[i], vx = (p.x - p.px) * .965, vy = (p.y - p.py) * .965;
        p.px = p.x; p.py = p.y;
        p.x += vx + Math.sin(time * .7 + i * .22) * .07 + Math.sin(time * .23 + i * .09) * .05;
        p.y += vy + Math.cos(time * .5 + i * .17) * .03;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.hypot(dx, dy);
        if (dist < 150 && dist > .01) { const f = (1 - dist / 150) * 2.4; p.x += dx / dist * f; p.y += dy / dist * f; }
      }
      for (let k = 0; k < 10; k++) {
        rp[0].x = A.x; rp[0].y = A.y;
        for (let e = 1; e <= 3; e++) { rp[N - e].x = B.x; rp[N - e].y = B.y - (e - 1) * rest; } // läuft senkrecht aus, damit der Übergang passt
        for (let i = 0; i < N - 1; i++) {
          const a = rp[i], b = rp[i + 1], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1, diff = (dist - rest) / dist * .5;
          if (i > 0 && i < N - 3) { a.x += dx * diff; a.y += dy * diff; }
          if (i < N - 4) { b.x -= dx * diff; b.y -= dy * diff; }
        }
      }
    }
    rctx.clearRect(0, 0, rw, rh);
    rctx.beginPath(); rctx.moveTo(rp[0].x, rp[0].y);
    for (let i = 1; i < N - 1; i++) rctx.quadraticCurveTo(rp[i].x, rp[i].y, (rp[i].x + rp[i + 1].x) / 2, (rp[i].y + rp[i + 1].y) / 2);
    rctx.lineTo(rp[N - 1].x, rp[N - 1].y);
    rctx.lineCap = 'round'; rctx.strokeStyle = RED;
    rctx.shadowColor = RED; rctx.shadowBlur = GLOW; rctx.lineWidth = 2; rctx.stroke();
    rctx.shadowBlur = 0;
  }

  /* ---------- 02 · Alltag: der Faden verknotet sich ---------- */
  const tSec = $('.tangle'), tCan = $('.tangle__canvas'), tctx = tCan.getContext('2d');
  const tItems = $$('.tangle__item'), tCount = $('.tangle__count'), tNum = $('b', tCount);
  let tw = 0, th = 0, tcx = 0, tp = 0, tIdx = -1;
  function initTangle() {
    const pin = $('.tangle__pin'); tw = pin.clientWidth; th = pin.clientHeight;
    tCan.width = tw * dpr; tCan.height = th * dpr; tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tcx = $('.knot--pin').getBoundingClientRect().left;
  }
  function drawTangle() {
    const r = tSec.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    const live = clamp(-r.top / Math.max(1, r.height - th));
    tp = reduced ? live : tp + (live - tp) * .16;
    const p = tp;
    const n = tItems.length - 1, idx = p > .84 ? n : Math.min(n - 1, Math.floor(p / .84 * n));
    if (idx !== tIdx) {
      tIdx = idx;
      tItems.forEach((el, i) => { el.classList.toggle('on', i === idx); el.classList.toggle('past', i < idx); });
      tNum.textContent = '0' + Math.min(idx + 1, n); tCount.style.opacity = idx === n ? 0 : 1;
    }
    const a = smooth(0, .8, p), amp = (.25 + a * .75) * (1 - smooth(.83, .96, p));
    const R = amp * Math.min(tw * .2, 250), T = reduced ? 0 : time, M = 520, TAU = Math.PI * 2;
    tctx.clearRect(0, 0, tw, th);
    tctx.beginPath();
    for (let i = 0; i <= M; i++) {
      const t = i / M, env = Math.pow(Math.sin(Math.PI * t), 1.4);
      const x = tcx + R * env * (Math.sin(t * TAU * 3 + T * .3) + a * .75 * Math.sin(t * TAU * 7 + 1.3 - T * .22) + a * a * .45 * Math.sin(t * TAU * 13 + 4 + T * .15));
      const y = t * th + R * env * (.5 * Math.cos(t * TAU * 4 + .5 + T * .25) + a * .5 * Math.cos(t * TAU * 9 + 2 - T * .2) + a * a * .32 * Math.cos(t * TAU * 17 + T * .1));
      i ? tctx.lineTo(x, y) : tctx.moveTo(x, y);
    }
    tctx.lineJoin = tctx.lineCap = 'round'; tctx.strokeStyle = RED; tctx.lineWidth = 2;
    tctx.shadowColor = RED; tctx.shadowBlur = GLOW; tctx.stroke(); tctx.shadowBlur = 0;
  }

  /* ---------- Beispielentwurf: die Seite geht groß auf und scrollt mit ---------- */
  const stage = $('.stage'), sTrack = $('.stage__track'), sPin = $('.stage__pin'), sFrame = $('.stage__frame'), sSite = $('.stage__site');
  const sUi = $('.stage__ui'), sNo = $('.stage__no'), sTitle = $('.stage__cap b'), sText = $('.stage__cap p'), sClose = $('.stage__close');
  let sMax = 0, sInner = 0, sIdx = -1, sOpen = false, tour = [];
  const siteWin = () => { try { return sSite.contentWindow && sSite.contentWindow.document ? sSite.contentWindow : null; } catch (e) { return null; } };
  function initStage() {
    const w = siteWin(); sMax = 0; tour = [];
    if (w && w.document.body) {
      sMax = Math.max(0, w.document.documentElement.scrollHeight - sSite.clientHeight);
      tour = [...w.document.querySelectorAll('[data-tour]')].map(el => {
        const [t, p] = el.dataset.tour.split('|');
        return { y: el.getBoundingClientRect().top + w.scrollY, t, p };
      });
    }
    if (w && !w.__escBound) { w.__escBound = true; w.addEventListener('keydown', e => { if (e.key === 'Escape' && sOpen) openStage(false); }); }
    sTrack.style.height = sPin.offsetHeight + vh * .9 + sMax * .55 + vh * .3 + 'px';
  }
  sSite.addEventListener('load', () => measure());
  function drawStage() {
    if (sOpen) return;
    const r = sTrack.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    const total = r.height - sPin.offsetHeight, y = clamp(-r.top, 0, total);
    const o = clamp((vh * .55 - r.top) / (vh * 1.45)), e = o * o * (3 - 2 * o); // öffnet sich schon beim Hereinscrollen
    sFrame.style.transform = `scale(${(.62 + .38 * e).toFixed(4)})`;
    sFrame.style.borderRadius = ((1 - e) * 28).toFixed(1) + 'px';
    const tp = clamp((y - vh * .9) / Math.max(1, total - vh * 1.2)), target = tp * sMax;
    sInner = reduced ? target : sInner + (target - sInner) * .2;
    const w = siteWin();
    if (w) w.scrollTo({ top: sInner, behavior: 'instant' });
    sUi.classList.toggle('on', e > .97);
    let idx = 0;
    tour.forEach((t, i) => { if (t.y <= sInner + sSite.clientHeight * .5) idx = i; });
    if (tour.length && idx !== sIdx) { sIdx = idx; sNo.textContent = '0' + (idx + 1); sTitle.textContent = tour[idx].t; sText.textContent = tour[idx].p; }
  }
  function openStage(open) {
    sOpen = open; stage.classList.toggle('is-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    sClose.hidden = !open;
    if (open) { sFrame.style.transform = 'none'; sFrame.style.borderRadius = '0'; sClose.focus(); }
    else { const w = siteWin(); if (!w || !/index\.html$/.test(w.location.pathname)) sSite.src = sSite.getAttribute('src'); } // nach dem Durchklicken zurück zur Startseite
  }
  $('[data-stage-open]').addEventListener('click', () => openStage(true));
  sClose.addEventListener('click', () => openStage(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && sOpen) openStage(false); });

  /* ---------- 08 · Kontakt: der Faden wird zur Fläche ---------- */
  const cta = $('.cta'), fill = $('.cta__fill');
  function drawCta() {
    const r = cta.getBoundingClientRect();
    if (reduced || r.top > vh) { fill.style.clipPath = reduced ? 'none' : 'circle(0px at 50% 0px)'; return; }
    const p = clamp((vh * .62 - r.top) / (vh * .62));
    fill.style.clipPath = p >= 1 ? 'none' : `circle(${p * p * Math.hypot(vw / 2, r.height) * 1.05 + (p > 0 ? 6 : 0)}px at 50% 0px)`;
  }

  /* ---------- Navigation: Farbe und Ein-/Ausblenden ---------- */
  const nav = $('.nav'), themed = $$('main [data-theme], .foot');
  let lastY = scrollY;
  function drawNav() {
    let theme = 'light';
    for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 36 && r.bottom > 36) { theme = s.dataset.theme; break; } }
    if (theme === 'red' && fill.style.clipPath !== 'none') theme = 'light';
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
    const y = scrollY;
    if (Math.abs(y - lastY) > 6) { nav.classList.toggle('hide', y > lastY && y > vh * .6); lastY = y; }
  }

  /* ---------- Formular ---------- */
  const form = $('.form'), err = $('.form__error');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form), g = k => (f.get(k) || '').trim();
    if (!g('name') || !g('praxis') || !/^\S+@\S+\.\S+$/.test(g('email'))) { err.hidden = false; (form.querySelector(':invalid') || form.elements.praxis).focus(); return; }
    err.hidden = true;
    const body = `Hallo Fabian,\n\nich möchte einen Entwurf für unsere Webseite anfragen.\n\nPraxis: ${g('praxis')}\nAktuelle Webseite: ${g('webseite') || 'keine Angabe'}\n\n${g('nachricht')}\n\nViele Grüße\n${g('name')}\n${g('email')}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(form.dataset.subject + ' – ' + g('praxis'))}&body=${encodeURIComponent(body)}`;
  });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Takt ---------- */
  let pw = 0;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    pw = page.clientWidth; initStage(); initTangle(); initRope(); buildThread();
  }
  let rT; const remeasure = () => { clearTimeout(rT); rT = setTimeout(measure, 120); };
  addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(page);
  document.fonts && document.fonts.ready.then(measure);
  measure();

  function frame(t) {
    time = t / 1000;
    if (innerWidth !== vw || innerHeight !== vh || page.clientWidth !== pw) measure();
    sy = reduced ? scrollY : sy + (scrollY - sy) * .16;
    if (Math.abs(scrollY - sy) < .05) sy = scrollY;
    if (heroOn) {
      stepRope();
      const hp = clamp(sy / vh);
      heroInner.style.transform = `translate3d(0,${hp * -80}px,0)`; heroInner.style.opacity = 1 - hp * 1.3;
    }
    drawThread(); drawTangle(); drawStage(); drawCta(); drawNav();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
