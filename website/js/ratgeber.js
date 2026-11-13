/* Ratgeber: Faden am Rand der Lesefläche, Navigation, Formular, Selbstcheck.
   Faden-, Navigations- und Formularlogik stammen aus landing.js. Änderungen dort hier nachziehen. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vw = innerWidth, vh = innerHeight, sy = scrollY;

  $$('.foot__mark span').forEach((s, i) => s.style.setProperty('--i', i));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .1 });
  $$('.foot__mark').forEach(el => io.observe(el));

  /* ---------- Der Faden ---------- */
  const page = $('.page'), svg = $('.thread'), path = $('.thread__path'), tip = $('.thread__tip');
  const knots = $$('[data-knot]');
  let L = 0, ys = [], drawn = 0, pw = 0, ph = 0;
  function buildThread() {
    if (!svg || knots.length < 2) return;
    const W = page.clientWidth, H = page.offsetHeight, pr = page.getBoundingClientRect();
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pts = knots.map(k => { const r = k.getBoundingClientRect(); return [r.left - pr.left, r.top - pr.top]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], h = (y1 - y0) * .5, dx = x1 - x0, dy = y1 - y0;
      if (Math.abs(dx) > 2 && dy < Math.abs(dx) * .7) {
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
    if (!L) return;
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

  /* ---------- Navigation: Farbe und Ein-/Ausblenden ---------- */
  const nav = $('.nav'), themed = $$('main [data-theme], .foot');
  let lastY = scrollY;
  function drawNav() {
    let theme = 'dark';
    for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 36 && r.bottom > 36) { theme = s.dataset.theme; break; } }
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
    nav.classList.toggle('stuck', scrollY > 40);
    const y = scrollY;
    if (Math.abs(y - lastY) > 6) { nav.classList.toggle('hide', y > lastY && y > vh * .6); lastY = y; }
  }

  /* ---------- Formular (wie auf der Fachseite) ---------- */
  $$('[data-lead]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form), g = k => (f.get(k) || '').trim(), msg = $('.ask__msg', form), btn = $('button', form);
    const say = (t, ok) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle('ok', !!ok); };
    if (!g('link') || g('whatsapp').replace(/\D/g, '').length < 6) { say('Bitte tragen Sie den Link zu Ihrer Webseite und Ihre WhatsApp-Nummer ein.'); (g('link') ? form.elements.whatsapp : form.elements.link).focus(); return; }
    btn.disabled = true;
    try {
      const res = await fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ link: g('link'), whatsapp: g('whatsapp'), nachricht: g('nachricht'), website2: g('website2'), seite: location.pathname }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.fehler || 'Fehler');
      form.reset();
      if (window.pxTrack) window.pxTrack('form');
      say('Danke, Ihr Link ist angekommen. Ich melde mich per WhatsApp, und Sie erhalten Ihren Entwurf innerhalb von drei Tagen.', true);
    } catch (err) {
      const text = `Hallo Herr Heimann, hier ist der Link zu unserer Praxis-Webseite: ${g('link')}${g('nachricht') ? '\n\n' + g('nachricht') : ''}`;
      say('Das hat gerade nicht geklappt. Es öffnet sich WhatsApp mit der vorbereiteten Nachricht, bitte senden Sie sie dort ab.');
      if (window.pxTrack) window.pxTrack('whatsapp');
      location.href = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(text)}`;
    }
    btn.disabled = false;
  }));
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Selbstcheck: abgehakte Punkte zählen (nichts wird gespeichert oder übertragen) ---------- */
  const score = $('[data-score]');
  if (score) {
    const boxes = $$('.check input'), num = $('b', score), verdict = $('[data-verdict]');
    const update = () => {
      const n = boxes.filter(b => b.checked).length, t = boxes.length;
      num.textContent = `${n} von ${t}`;
      if (verdict) verdict.textContent = n === 0 ? 'Haken Sie ab, was auf Ihre Webseite zutrifft.'
        : n >= t - 2 ? 'Ihre Webseite steht gut da. Sehen Sie sich die offenen Punkte einzeln an.'
        : n >= t * .6 ? 'Eine solide Grundlage mit einigen Lücken. Oft lässt sich das durch Überarbeiten lösen.'
        : 'Hier fehlt einiges. Ein Neuanfang ist dann meist der kürzere Weg als viele einzelne Korrekturen.';
    };
    boxes.forEach(b => b.addEventListener('change', update));
    update();
  }

  /* ---------- Takt ---------- */
  function measure() { vw = innerWidth; vh = innerHeight; pw = page.clientWidth; ph = page.offsetHeight; buildThread(); }
  let rT; const remeasure = () => { clearTimeout(rT); rT = setTimeout(measure, 120); };
  addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(page);
  document.fonts && document.fonts.ready.then(measure);
  measure();
  function frame() {
    if (innerWidth !== vw || innerHeight !== vh || page.clientWidth !== pw || page.offsetHeight !== ph) measure();
    sy = reduced ? scrollY : sy + (scrollY - sy) * .16;
    if (Math.abs(scrollY - sy) < .05) sy = scrollY;
    drawThread(); drawNav();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
