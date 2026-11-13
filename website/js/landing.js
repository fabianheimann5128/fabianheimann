/* Landingpage-System – „Der rote Faden“ auf hellem Grund. Ohne Abhängigkeiten. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = '#ff3d1f';
  let vw = innerWidth, vh = innerHeight, sy = scrollY, time = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  /* ---------- Überschriften Wort für Wort ---------- */
  function splitWords(el, counter = { i: 0 }) {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'), wi = document.createElement('span');
          w.className = 'w'; wi.className = 'wi'; wi.style.setProperty('--i', counter.i++); wi.textContent = part;
          w.append(wi); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n, counter);
    });
  }
  $$('[data-split]').forEach(el => { el.setAttribute('aria-label', el.textContent.trim()); splitWords(el); });
  $$('.foot__mark span').forEach((s, i) => s.style.setProperty('--i', i));

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: .15 });
  $$('[data-reveal], [data-split]:not(.lp-hero__title), .pain, .deal, .foot__mark').forEach(el => io.observe(el));
  requestAnimationFrame(() => requestAnimationFrame(() => { $('.lp-hero').classList.add('loaded'); $('.lp-hero__title').classList.add('is-in'); }));

  /* ---------- Der Faden über die ganze Seite ---------- */
  const page = $('.page'), svg = $('.thread'), path = $('.thread__path'), tip = $('.thread__tip');
  const knots = $$('[data-knot]');
  let L = 0, ys = [], drawn = 0;
  function buildThread() {
    const W = page.clientWidth, H = page.offsetHeight, pr = page.getBoundingClientRect();
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pts = knots.map(k => { const r = k.getBoundingClientRect(); return [r.left - pr.left, r.top - pr.top, k.hasAttribute('data-loop')]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1, loop] = pts[i], dx = x1 - x0, dy = y1 - y0, h = dy * .5;
      if (Math.abs(dx) > 2 && dy < Math.abs(dx) * .7) {
        const ym = (y0 + y1) / 2, r = Math.min(dy / 2, Math.abs(dx) / 2, 56), sx = Math.sign(dx);
        d += `L${x0} ${ym - r}Q${x0} ${ym} ${x0 + sx * r} ${ym}L${x1 - sx * r} ${ym}Q${x1} ${ym} ${x1} ${ym + r}L${x1} ${y1}`;
      } else d += `C${x0} ${y0 + h} ${x1} ${y1 - h} ${x1} ${y1}`;
      if (loop && W > 860) { // eine kleine Schlaufe im Faden
        const r = 30;
        d += `c0 ${r * 1.3} ${r * 2} ${r * 1.3} ${r * 2} 0c0 ${-r * 1.7} ${-r * 2} ${-r * 1.7} ${-r * 2} ${r * .5}`;
        pts[i][1] += r * .5;
      }
    }
    path.setAttribute('d', d);
    L = path.getTotalLength(); path.style.strokeDasharray = `${L} ${L}`;
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

  /* ---------- Hero: der Faden hängt durch und bildet ein Lächeln ---------- */
  const hero = $('.lp-hero'), heroInner = $('.lp-hero__inner'), rope = $('.lp-hero__rope'), rctx = rope.getContext('2d');
  const N = 46; let rp = [], rest = 0, rw = 0, rh = 0, A, B, mouse = { x: -999, y: -999 }, heroOn = true;
  function initRope() {
    rw = hero.clientWidth; rh = hero.clientHeight;
    rope.width = rw * dpr; rope.height = rh * dpr; rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const kr = $('.knot--pin-b').getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const ar = $('.knot--pin-a').getBoundingClientRect();
    B = { x: kr.left - hr.left, y: kr.top - hr.top }; A = { x: ar.left - hr.left, y: ar.top - hr.top };
    rest = Math.hypot(B.x - A.x, B.y - A.y) * (vw < 860 ? 1.12 : 1.42) / (N - 1);
    rp = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1), x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t + Math.sin(t * Math.PI) * (B.x - A.x) * .3;
      return { x, y, px: x, py: y };
    });
  }
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
  function stepRope() {
    if (!reduced) {
      for (let i = 1; i < N - 1; i++) {
        const p = rp[i], vx = (p.x - p.px) * .97, vy = (p.y - p.py) * .97;
        p.px = p.x; p.py = p.y;
        p.x += vx + Math.sin(time * .6 + i * .2) * .04; p.y += vy + .32;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > .01) { const f = (1 - dist / 140) * 2.6; p.x += dx / dist * f; p.y += dy / dist * f; }
      }
      for (let k = 0; k < 12; k++) {
        rp[0].x = A.x; rp[0].y = A.y; rp[N - 1].x = B.x; rp[N - 1].y = B.y;
        for (let i = 0; i < N - 1; i++) {
          const a = rp[i], b = rp[i + 1], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1, diff = (dist - rest) / dist * .5;
          if (i > 0) { a.x += dx * diff; a.y += dy * diff; }
          if (i < N - 2) { b.x -= dx * diff; b.y -= dy * diff; }
        }
      }
    }
    rctx.clearRect(0, 0, rw, rh);
    rctx.beginPath(); rctx.moveTo(rp[0].x, rp[0].y);
    for (let i = 1; i < N - 1; i++) rctx.quadraticCurveTo(rp[i].x, rp[i].y, (rp[i].x + rp[i + 1].x) / 2, (rp[i].y + rp[i + 1].y) / 2);
    rctx.lineTo(rp[N - 1].x, rp[N - 1].y);
    rctx.lineCap = 'round'; rctx.strokeStyle = RED; rctx.lineWidth = 2.2; rctx.stroke();
    rctx.fillStyle = RED;
    for (const q of [A, B]) { rctx.beginPath(); rctx.arc(q.x, q.y, 6, 0, Math.PI * 2); rctx.fill(); }
  }

  /* ---------- Beispielentwurf: Ansicht wechselt mit dem Schritt ---------- */
  const dsteps = $$('.dstep'), screens = $$('.screen'), url = $('.mock__bar span');
  let dOn = -1;
  function drawDemo() {
    let best = 0, bd = 1e9;
    dsteps.forEach((s, i) => { const r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * .55); if (d < bd) { bd = d; best = i; } });
    if (best !== dOn) {
      dOn = best;
      dsteps.forEach((s, i) => s.classList.toggle('on', i === best));
      screens.forEach((s, i) => s.classList.toggle('on', i === best));
      if (url && screens[best]) url.textContent = screens[best].dataset.url || url.textContent;
    }
  }

  /* ---------- Kontakt: der Faden wird zur Fläche ---------- */
  const cta = $('.cta'), fill = $('.cta__fill');
  function drawCta() {
    const r = cta.getBoundingClientRect();
    if (reduced || r.top > vh) { fill.style.clipPath = reduced ? 'none' : 'circle(0px at 50% 0px)'; return; }
    const p = clamp((vh * .62 - r.top) / (vh * .62));
    fill.style.clipPath = p >= 1 ? 'none' : `circle(${p * p * Math.hypot(vw / 2, r.height) * 1.05 + (p > 0 ? 6 : 0)}px at 50% 0px)`;
  }

  /* ---------- Navigation ---------- */
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
  function measure() { vw = innerWidth; vh = innerHeight; pw = page.clientWidth; initRope(); buildThread(); }
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
      heroInner.style.transform = `translate3d(0,${hp * -60}px,0)`; heroInner.style.opacity = 1 - hp * 1.2;
    }
    drawThread(); drawDemo(); drawCta(); drawNav();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
