/* Beispielentwurf „Zahnmedizin Lindenhain“ */
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const $ = (s, r = document) => r.querySelector(s);

  // Einblenden
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-r]').forEach(el => io.observe(el));

  // Kopfzeile
  const top = $('.top');
  const onScroll = () => {
    top.classList.toggle('stuck', scrollY > 30);
    $$('[data-parallax]').forEach(el => { const r = el.getBoundingClientRect(); el.style.setProperty('--py', (r.top / innerHeight * -4).toFixed(2) + '%'); });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Sprechzeiten: heute geöffnet?
  const hours = { 1: [8, 18], 2: [8, 18], 3: [8, 13], 4: [8, 19], 5: [8, 14] };
  const names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const now = new Date(), day = now.getDay(), h = now.getHours() + now.getMinutes() / 60, today = hours[day];
  const status = $('[data-status]'), label = $('span', status);
  if (today && h >= today[0] && h < today[1]) label.textContent = `Heute geöffnet bis ${today[1]} Uhr`;
  else {
    status.classList.add('closed');
    if (today && h < today[0]) label.textContent = `Heute geöffnet ab ${today[0]} Uhr`;
    else { let d = day; do { d = (d + 1) % 7; } while (!hours[d]); label.textContent = `Wieder geöffnet am ${names[d]} ab ${hours[d][0]} Uhr`; }
  }
  const row = $(`tr[data-day="${day}"]`); if (row) row.classList.add('today');

  // Leistungen
  const tabs = $$('[data-svc]'), panels = $$('.panel');
  const show = i => {
    tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i));
    panels.forEach((p, k) => p.classList.toggle('on', k === i));
  };
  tabs.forEach((t, i) => { t.addEventListener('click', () => show(i)); t.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) show(i); }); });
  // Für die Vorführung von außen: Leistung wechseln
  window.demoShowService = show;

  // Formulare senden im Beispiel nichts
  $$('[data-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); $('.done', f).hidden = false; }));
})();
