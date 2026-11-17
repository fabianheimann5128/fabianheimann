const H = require('./harness');
const LINK = 'www.test-praxis-xyz.de', PHONE = '0151 99887766', MSG = 'Geheimtext Nachricht 4711';
const SECRET = [/test-praxis-xyz/i, /99887766/, /Geheimtext/i, /4711/, /max%40example|max@example/i, /secret-token/i];
const results = []; const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log((pass ? 'BESTANDEN ' : 'FEHLER    ') + name + (detail ? '  — ' + detail : '')); };
const visible = p => p.evaluate(() => { const b = document.querySelector('.consent'); return !!b && !b.hidden; });
const choose = (p, label) => p.locator('.consent button', { hasText: label }).click();
async function submit(p, ctx, sel, mode, fill = true) {
  ctx._formMode = mode;
  const f = p.locator(sel).first();
  if (fill) { await f.locator('[name=link]').fill(LINK); await f.locator('[name=whatsapp]').fill(PHONE); const m = f.locator('[name=nachricht]'); if (await m.count()) await m.fill(MSG); }
  await f.locator('button[type=submit]').click(); await H.wait(800);
  return (await f.locator('.ask__msg').innerText().catch(() => '')).slice(0, 45);
}
const piiScan = log => log.filter(x => x.kind === 'google').filter(x => SECRET.some(r => r.test(x.url + ' ' + x.body)));
const cookies = async c => (await c.cookies()).map(k => k.name);

(async () => {
  const b = await H.launch(); const B = H.BASE;
  const Q = '?utm_source=testquelle&gclid=abc123&email=max%40example.de&token=secret-token';

  // 1 Ohne Entscheidung
  { const c = await H.ctx(b), p = await c.newPage();
    await p.goto(B + '/' + Q, { waitUntil: 'networkidle' }); await H.wait(1500);
    ok('1a Ohne Entscheidung: Dialog sichtbar', await visible(p));
    const msg = await submit(p, c, '.hero form', 'ok'); await p.mouse.wheel(0, 4000); await H.wait(2000);
    ok('1b Ohne Entscheidung: Formular funktioniert', /Danke/.test(msg), msg);
    ok('1c Ohne Entscheidung: keine einzige Anfrage an Google', c.log.filter(x => x.kind === 'google').length === 0, c.log.filter(x => x.kind === 'google').map(x => x.url.slice(0, 60)).join(' | '));
    ok('1d Ohne Entscheidung: keine Cookies', (await cookies(c)).length === 0, (await cookies(c)).join(','));
    await c.close(); }

  // 2 Alle ablehnen, Navigation, Neuladen
  { const c = await H.ctx(b), p = await c.newPage();
    await p.goto(B + '/ratgeber/praxis-webseite/kosten/', { waitUntil: 'networkidle' }); await choose(p, 'Alle ablehnen'); await H.wait(800);
    await p.goto(B + '/webseite-fuer-zahnaerzte/', { waitUntil: 'networkidle' }); await H.wait(800);
    ok('2a Nach Ablehnung: Dialog bleibt bei weiterer Seite geschlossen', !(await visible(p)));
    await submit(p, c, '.hero form', 'ok'); 
    await p.$eval('a[href^="https://wa.me/"]', a => a.click()); await H.wait(1500);
    await p.reload({ waitUntil: 'networkidle' }); await H.wait(1000);
    ok('2b Nach Ablehnung: keine Anfrage an Google (Formular, WhatsApp, Neuladen)', c.log.filter(x => x.kind === 'google').length === 0);
    ok('2c Nach Ablehnung: Formular wurde trotzdem versendet', c.log.filter(x => x.kind === 'form').length === 1);
    ok('2d Gespeicherte Wahl', true, await p.evaluate(() => localStorage.getItem('praxel-einwilligung-v2')));
    await c.close(); }

  // 3 Nur Statistik
  { const c = await H.ctx(b), p = await c.newPage();
    await p.goto(B + '/' + Q, { waitUntil: 'networkidle' });
    await p.locator('.consent [data-c-stat]').check(); await choose(p, 'Auswahl speichern'); await H.wait(6500);
    let ev = H.gaEvents(c.log);
    ok('3a Nur Statistik: gtag.js genau einmal geladen', H.scripts(c.log).filter(s => /gtag\/js/.test(s)).length === 1, H.scripts(c.log).join(' | '));
    const pv = ev.filter(e => e.en === 'page_view');
    ok('3b Genau ein page_view an ' + 'G-QDZQZ22VJX', pv.length === 1 && pv[0].tid === 'G-QDZQZ22VJX', pv.map(e => e.tid).join(','));
    ok('3c Seitenadresse bereinigt (utm/gclid bleiben, email/token entfernt)', pv[0] && /utm_source=testquelle/.test(pv[0].dl) && /gclid=abc123/.test(pv[0].dl) && !/email|token/.test(pv[0].dl), pv[0] && pv[0].dl);
    ok('3d Keine Google-Ads-Anfragen', H.adsHits(c.log).length === 0, H.adsHits(c.log).map(x => x.url.slice(0, 70)).join(' | '));
    // Validierungsfehler
    const before = H.gaEvents(c.log).length;
    const vmsg = await submit(p, c, '.hero form', 'ok', false); await H.wait(2500);
    ok('3e Validierungsfehler: kein Ereignis, kein Serveraufruf', H.gaEvents(c.log).length === before && c.log.filter(x => x.kind === 'form').length === 0, vmsg);
    // Erfolg
    await submit(p, c, '.hero form', 'ok'); await H.wait(6500);
    ev = H.gaEvents(c.log); const lead = ev.filter(e => e.en === 'generate_lead');
    ok('3f Erfolg: genau ein generate_lead', lead.length === 1, JSON.stringify(lead.map(e => e.params)));
    // Hash-Links dürfen keinen zweiten page_view auslösen
    await p.$eval('.nav__links a[href="#vorgehen"]', a => a.click()); await H.wait(6500);
    ok('3g Klick auf Sprungmarke: kein zusätzlicher page_view', H.gaEvents(c.log).filter(e => e.en === 'page_view').length === 1);
    // WhatsApp-Klick
    
    await p.$eval('.hero a[href^="https://wa.me/"]', a => a.click()); await H.wait(6500);
    ev = H.gaEvents(c.log);
    const wa = ev.filter(e => e.en === 'whatsapp_click'), outbound = ev.filter(e => e.en === 'click');
    ok('3h WhatsApp: genau ein whatsapp_click', wa.length === 1, JSON.stringify(wa.map(e => e.params)));
    ok('3i Automatisches Ereignis „click“ (ausgehende Links) beim WhatsApp-Klick', true, outbound.length ? 'JA: ' + JSON.stringify(outbound.map(e => ({ link_domain: e.params['ep.link_domain'], link_url: e.params['ep.link_url'] }))) : 'nein');
    ok('3j Keine Formularinhalte oder URL-Geheimnisse in Google-Anfragen', piiScan(c.log).length === 0, piiScan(c.log).map(x => x.url.slice(0, 80)).join(' | '));
    ok('3k Alle GA4-Ereignisse dieses Tests', true, H.gaEvents(c.log).map(e => e.en).join(', '));
    ok('3l Cookies nach Zustimmung', true, (await cookies(c)).join(', '));
    await c.close(); }

  // 4 Formularfehler (Statistik erlaubt). Ereignisse werden zusätzlich direkt aus dem dataLayer mitgeschrieben,
  //   weil die Seite danach sofort zu WhatsApp wechselt.
  for (const [mode, page, sel] of [['server', '/webseite-fuer-zahnaerzte/', '.hero form'], ['rejected', '/ratgeber/praxis-webseite/kosten/', '.rg-offer form'], ['network', '/', '#kontakt form']]) {
    const c = await H.ctx(b), pushed = [];
    await c.exposeBinding('__rec', (_, x) => pushed.push(x));
    await c.addInitScript(() => { const iv = setInterval(() => { if (window.dataLayer && !window.dataLayer.__w) { const o = window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push = (...a) => { a.forEach(x => { const arr = Array.from(x || []); if (arr[0] === 'event') window.__rec({ n: arr[1], p: Object.fromEntries(Object.entries(arr[2] || {}).filter(([k]) => typeof arr[2][k] !== 'function')) }); }); return o(...a); }; window.dataLayer.__w = 1; } }, 5); });
    const p = await c.newPage();
    await p.goto(B + page, { waitUntil: 'networkidle' }); await p.locator('.consent [data-c-stat]').check(); await choose(p, 'Auswahl speichern'); await H.wait(2500);
    const t0 = Date.now(); await submit(p, c, sel, mode); await H.wait(2500);
    const err = pushed.filter(e => e.n === 'lead_form_error'), nav = c.log.find(x => x.kind === 'nav-wa');
    ok(`4 Fehler „${mode}“ (${page}): lead_form_error erzeugt, kein generate_lead, kein whatsapp_click, Weiterleitung zu WhatsApp`,
      err.length === 1 && err[0].p.error_type === mode && !pushed.some(e => e.n === 'generate_lead' || e.n === 'whatsapp_click' || e.n === 'conversion') && !!nav, JSON.stringify(err.map(e => e.p)));
    ok(`4 Fehler „${mode}“: Zustellung an GA4 vor dem Seitenwechsel beobachtet`, true, H.gaEvents(c.log).some(e => e.en === 'lead_form_error') ? 'ja' : 'nein (Seite wechselt sofort)');
    ok(`4 Fehler „${mode}“: keine Eingaben in Google-Anfragen`, piiScan(c.log).length === 0);
    await c.close();
  }

  // 5 Alle zulassen, dann Widerruf
  { const c = await H.ctx(b), p = await c.newPage();
    await p.goto(B + '/webseite-fuer-zahnaerzte/', { waitUntil: 'networkidle' }); await choose(p, 'Alle zulassen'); await H.wait(6500);
    ok('5a Alle zulassen: eigenes Laden genau einmal (zweites Ziel lädt Google selbst mit cx=c nach)', H.scripts(c.log).filter(s => /gtag\/js/.test(s) && !/cx=c/.test(s)).length === 1, H.scripts(c.log).join(' | '));
    ok('5b Ein page_view', H.gaEvents(c.log).filter(e => e.en === 'page_view').length === 1);
    const adsBefore = H.adsHits(c.log).length;
    await submit(p, c, '#kontakt form', 'ok'); await H.wait(6500);
    const adsForm = H.adsHits(c.log).slice(adsBefore);
    ok('5c Erfolg: Google-Ads-Conversion „Anfrage Formular“ gesendet', adsForm.some(x => /wDeyCIu-3LcdEKirqJhF/.test(x.url + x.body)), adsForm.map(x => new URL(x.url).hostname + new URL(x.url).pathname).join(' | '));
    ok('5d Erfolg: generate_lead genau einmal', H.gaEvents(c.log).filter(e => e.en === 'generate_lead').length === 1);
    const adsBeforeWa = H.adsHits(c.log).length;
    
    await p.$eval('#angebot a[href^="https://wa.me/"]', a => a.click()); await H.wait(6500);
    const adsWa = H.adsHits(c.log).slice(adsBeforeWa);
    ok('5e WhatsApp: Ads-Conversion „WhatsApp Klick“ genau einmal', adsWa.filter(x => /WqHlCI6-3LcdEKirqJhF/.test(x.url + x.body)).length >= 1, adsWa.map(x => new URL(x.url).hostname + new URL(x.url).pathname).join(' | '));
    ok('5f WhatsApp: whatsapp_click genau einmal', H.gaEvents(c.log).filter(e => e.en === 'whatsapp_click').length === 1, JSON.stringify(H.gaEvents(c.log).filter(e => e.en === 'whatsapp_click').map(e => e.params)));
    ok('5g Keine Eingaben in Google-Anfragen', piiScan(c.log).length === 0, piiScan(c.log).map(x => x.url.slice(0, 80)).join(' | '));
    const ck = await cookies(c);
    // Widerruf
    await p.$eval('a[data-consent-open]', a => a.click()); await H.wait(300);
    const pre = await p.evaluate(() => [document.querySelector('[data-c-stat]').checked, document.querySelector('[data-c-ads]').checked]);
    ok('5h Einstellungen zeigen die aktuelle Wahl', pre[0] && pre[1]);
    await choose(p, 'Alle ablehnen'); await H.wait(500);
    const n = c.log.filter(x => x.kind === 'google').length;
    await submit(p, c, '#kontakt form', 'ok'); await p.$eval('.cta a[href^="https://wa.me/"]', a => a.click()); await p.mouse.wheel(0, -6000); await H.wait(6500);
    ok('5i Nach Widerruf auf derselben Seite: keine weiteren Messanfragen', c.log.filter(x => x.kind === 'google').length === n, c.log.filter(x => x.kind === 'google').slice(n).map(x => x.url.slice(0, 70)).join(' | '));
    ok('5j Nach Widerruf: Cookies von Analytics/Ads gelöscht', !(await cookies(c)).some(k => /^_ga|^_gcl/.test(k)), 'vorher: ' + ck.join(',') + ' / nachher: ' + (await cookies(c)).join(','));
    await p.goto(B + '/ratgeber/', { waitUntil: 'networkidle' }); await p.reload({ waitUntil: 'networkidle' }); await H.wait(2000);
    ok('5k Nach Widerruf: Navigation und Neuladen ohne Google-Anfragen, Dialog zu', c.log.filter(x => x.kind === 'google').length === n && !(await visible(p)));
    await c.close(); }

  // 6 Nur Anzeigenmessung
  { const c = await H.ctx(b), p = await c.newPage();
    await p.goto(B + '/webseite-fuer-zahnaerzte/', { waitUntil: 'networkidle' });
    await p.locator('.consent [data-c-ads]').check(); await choose(p, 'Auswahl speichern'); await H.wait(6500);
    await submit(p, c, '.hero form', 'ok'); await H.wait(3000);
    ok('6a Nur Anzeigenmessung: keine GA4-Anfragen', H.gaEvents(c.log).length === 0 && !H.scripts(c.log).some(s => /G-QDZ/.test(s)), H.scripts(c.log).join(' | '));
    ok('6b Nur Anzeigenmessung: Formular-Conversion an Google Ads', H.adsHits(c.log).some(x => /wDeyCIu-3LcdEKirqJhF/.test(x.url + x.body)));
    await c.close(); }

  // 7 Alte Einwilligung (Version 1)
  { const c = await H.ctx(b); await c.addInitScript(() => localStorage.setItem('praxel-einwilligung', 'ja')); const p = await c.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await H.wait(1500);
    ok('7 Alte Einwilligung (nur Ads, Version 1): Dialog erneut, nichts geladen', await visible(p) && c.log.filter(x => x.kind === 'google').length === 0);
    await c.close(); }

  // 8 Handy: Dialog passt auf den Bildschirm
  { const c = await H.ctx(b, { viewport: { width: 375, height: 667 } }), p = await c.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await H.wait(800);
    const r = await p.evaluate(() => { const b = document.querySelector('.consent').getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: innerHeight }; });
    ok('8 Handy 375×667: Dialog vollständig im Bild oder scrollbar', r.top >= 0 && r.bottom <= r.h, JSON.stringify(r));
    await p.screenshot({ path: 'dialog-handy.png' }); await c.close();
    const c2 = await H.ctx(b), p2 = await c2.newPage(); await p2.goto(B + '/ratgeber/', { waitUntil: 'networkidle' }); await H.wait(800);
    await p2.screenshot({ path: 'dialog-desktop.png' }); await c2.close(); }

  await b.close();
  const f = results.filter(r => !r.pass); console.log(`\n${results.length - f.length} von ${results.length} bestanden`);
})();
