// Hilfen: Browser starten, Google-Anfragen mitschneiden und abfangen, GA4-Anfragen zerlegen.
const { chromium } = require('playwright');
const GOOGLE = /(google-analytics\.com|googletagmanager\.com|googleadservices\.com|doubleclick\.net|google\.com|google\.de|googlesyndication\.com|gstatic\.com)/;
exports.BASE = process.env.BASE || 'http://localhost:8770';
exports.launch = () => chromium.launch();
exports.ctx = async (b, opts = {}) => {
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const log = [];
  await c.route('**/*', async route => {
    const r = route.request(), u = r.url();
    // WhatsApp wird wie in echt verlassen (Seite entlädt), aber nur mit einer leeren Ersatzseite beantwortet.
    if (/wa\.me\//.test(u) && r.resourceType() === 'document') { log.push({ kind: 'nav-wa', url: u }); return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa</title>' }); }
    if (/\/anfrage\.php$/.test(new URL(u).pathname)) {
      const mode = c._formMode || 'ok'; log.push({ kind: 'form', mode, body: r.postData() });
      if (mode === 'network') return route.abort('failed');
      if (mode === 'server') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"fehler":"x"}' });
      if (mode === 'rejected') return route.fulfill({ status: 422, contentType: 'application/json', body: '{"ok":false,"fehler":"x"}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    if (GOOGLE.test(new URL(u).hostname)) {
      log.push({ kind: 'google', url: u, method: r.method(), type: r.resourceType(), body: r.postData() || '' });
      // Nur das Skript selbst darf laden. Jede Messanfrage wird hier beendet und erreicht Google nicht.
      if (/googletagmanager\.com\/gtag\/(js|destination)/.test(u)) return route.continue();
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  });
  c.log = log;
  return c;
};
// GA4: eine Anfrage kann mehrere Ereignisse enthalten (je Zeile im Body).
exports.gaEvents = log => {
  const out = [];
  log.filter(x => x.kind === 'google' && /\/g\/collect/.test(x.url)).forEach(x => {
    const u = new URL(x.url), shared = Object.fromEntries(u.searchParams);
    const lines = (x.body || '').split('\n').filter(Boolean);
    const evs = lines.length ? lines.map(l => ({ ...shared, ...Object.fromEntries(new URLSearchParams(l)) })) : [shared];
    evs.forEach(e => out.push({ en: e.en, params: Object.fromEntries(Object.entries(e).filter(([k]) => /^(ep|epn)\./.test(k))), dl: e.dl, dr: e.dr, tid: e.tid, gcs: e.gcs, raw: e }));
  });
  return out;
};
exports.adsHits = log => log.filter(x => x.kind === 'google' && !/googletagmanager|google-analytics/.test(x.url));
exports.scripts = log => log.filter(x => x.kind === 'google' && /googletagmanager\.com\/gtag/.test(x.url)).map(x => x.url.replace(/^https:\/\/www\.googletagmanager\.com/, ''));
exports.wait = ms => new Promise(r => setTimeout(r, ms));
