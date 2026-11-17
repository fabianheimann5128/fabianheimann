/* Einwilligung, Google Analytics 4 und Google-Ads-Messung.

   Grundsätze
   - Vor einer Einwilligung wird kein Google-Skript geladen und nichts an Google gesendet
     (kein Consent-Mode-„advanced“ mit cookielosen Pings).
   - Zwei getrennte Zwecke: Statistik (GA4) und Anzeigenmessung (Google Ads). Jeder Zweck wird nur
     konfiguriert, wenn er gewählt wurde, und nur einmal pro Seitenaufruf (keine doppelten Seitenaufrufe).
   - Widerruf: Consent Mode wird auf „denied“ gesetzt, GA4 über ga-disable abgeschaltet, eigene Cookies
     werden gelöscht, und es werden keine weiteren Ereignisse gesendet.
   - Keine Formularinhalte, Telefonnummern oder Links an Google. Fremde Abfrageparameter werden vor dem
     Laden aus der Adresse entfernt (erlaubt bleiben nur Kampagnen- und Klick-IDs).

   Ereignisse (nur mit Einwilligung „Statistik“, Ziel nur GA4):
     generate_lead     Formular vom Server bestätigt      contact_method=form,     contact_location=…
     whatsapp_click    Klick auf einen WhatsApp-Link      contact_method=whatsapp, contact_location=…
     lead_form_error   Versand fehlgeschlagen             contact_method=form,     contact_location=…, error_type=network|server|rejected
   Google-Ads-Conversions (nur mit Einwilligung „Anzeigenmessung“, Ziel nur Google Ads):
     „Anfrage Formular“ bei generate_lead, „WhatsApp Klick“ bei whatsapp_click. */
(() => {
  const GA_ID = 'G-QDZQZ22VJX';
  const AW_ID = 'AW-18573039016';
  const AW_SEND_TO = {
    form: AW_ID + '/wDeyCIu-3LcdEKirqJhF',     // Conversion „Anfrage Formular“
    whatsapp: AW_ID + '/WqHlCI6-3LcdEKirqJhF', // Conversion „WhatsApp Klick“
  };
  const KEY = 'praxel-einwilligung-v2';
  const OLD_KEY = 'praxel-einwilligung'; // Version 1 kannte nur Google Ads, deshalb wird neu gefragt
  const VERSION = 2;
  const privacyUrl = (document.currentScript && document.currentScript.dataset.privacy) || 'datenschutz.html';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Grundzustand: alles verweigert. Das Skript von Google ist zu diesem Zeitpunkt nicht geladen.
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  gtag('set', 'ads_data_redaction', true);
  window['ga-disable-' + GA_ID] = true;

  /* ---------- Gespeicherte Entscheidung ---------- */
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION && typeof v.stat === 'boolean' && typeof v.ads === 'boolean' ? v : null;
    } catch (e) { return null; }
  };
  const write = c => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, stat: c.stat, ads: c.ads, datum: new Date().toISOString().slice(0, 10) }));
      localStorage.removeItem(OLD_KEY);
    } catch (e) { /* ohne Speicher gilt die Wahl nur für diesen Aufruf */ }
  };

  /* ---------- Datensparsame Adressen ---------- */
  // Google liest die Seitenadresse direkt aus der Adresszeile. Deshalb werden fremde Abfrageparameter
  // dort entfernt, bevor ein Google-Skript lädt. Erhalten bleiben Kampagnen- und Anzeigenkennungen.
  // Die Seite selbst wertet keine Abfrageparameter aus.
  const KEEP = /^(utm_(source|medium|campaign|term|content|id)|gclid|gbraid|wbraid)$/;
  function cleanAddressBar() {
    try {
      const u = new URL(location.href);
      const drop = [...u.searchParams.keys()].filter(k => !KEEP.test(k));
      if (!drop.length) return;
      drop.forEach(k => u.searchParams.delete(k));
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) { /* ohne History-API bleibt die Adresse unverändert */ }
  }

  /* ---------- Laden und Konfigurieren ---------- */
  const state = { stat: false, ads: false };
  let scriptLoaded = false;
  const configured = {};
  function loadScript(id) {
    if (scriptLoaded) return;
    scriptLoaded = true;
    cleanAddressBar();
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    gtag('js', new Date());
  }
  function dropCookies(re) {
    const host = location.hostname, parts = host.split('.');
    const domains = ['', host, '.' + host, parts.length > 1 ? '.' + parts.slice(-2).join('.') : ''];
    document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => re.test(n)).forEach(n => {
      domains.forEach(d => { document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); });
    });
  }
  function apply(c) {
    const was = { stat: state.stat, ads: state.ads };
    state.stat = !!c.stat; state.ads = !!c.ads;
    window['ga-disable-' + GA_ID] = !state.stat;
    gtag('consent', 'update', {
      analytics_storage: state.stat ? 'granted' : 'denied',
      ad_storage: state.ads ? 'granted' : 'denied',
      ad_user_data: state.ads ? 'granted' : 'denied',
      ad_personalization: 'denied', // keine personalisierte Werbung, kein Remarketing
    });
    if (state.stat || state.ads) loadScript(state.stat ? GA_ID : AW_ID);
    if (state.stat && !configured.ga) {
      configured.ga = true;
      gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    }
    if (state.ads && !configured.aw) {
      configured.aw = true;
      gtag('config', AW_ID, { allow_ad_personalization_signals: false });
    }
    if (was.stat && !state.stat) dropCookies(/^_ga(_|$)/);
    if (was.ads && !state.ads) dropCookies(/^(_gcl_|_gac_)/);
  }

  /* ---------- Ereignisse ---------- */
  // Bereich der Seite, aus dem ein Kontakt kommt. Nur feste Werte aus dem Seitenaufbau, nie Eingaben.
  function area(el) {
    if (!el || !el.closest) return 'other';
    if (el.closest('.rg-offer')) return 'article_offer';
    if (el.closest('.cta')) return 'closing_cta';
    if (el.closest('.hero')) return 'hero';
    const s = el.closest('section[id]');
    const id = s ? s.id.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) : '';
    return id || 'other';
  }
  const ERR = ['network', 'server', 'rejected'];
  // Aufruf aus den Formularen: pxTrack('form', formular) nach bestätigtem Versand,
  // pxTrack('form_error', formular, art, weiter) bei Fehlschlag. „weiter“ wird aufgerufen, sobald Google das
  // Ereignis angenommen hat (höchstens nach gut einer Sekunde), damit die Weiterleitung es nicht abschneidet.
  // WhatsApp-Klicks erfasst dieses Skript selbst.
  window.pxTrack = (name, el, detail, next) => {
    let called = false;
    const done = () => { if (!called && typeof next === 'function') { called = true; next(); } };
    const where = area(el);
    if (name === 'form') {
      if (state.ads) gtag('event', 'conversion', { send_to: AW_SEND_TO.form });
      if (state.stat) gtag('event', 'generate_lead', { send_to: GA_ID, contact_method: 'form', contact_location: where });
    } else if (name === 'whatsapp') {
      if (state.ads) gtag('event', 'conversion', { send_to: AW_SEND_TO.whatsapp });
      if (state.stat) gtag('event', 'whatsapp_click', { send_to: GA_ID, contact_method: 'whatsapp', contact_location: where });
    } else if (name === 'form_error') {
      if (state.stat) {
        gtag('event', 'lead_form_error', { send_to: GA_ID, contact_method: 'form', contact_location: where, error_type: ERR.includes(detail) ? detail : 'server', event_callback: done, event_timeout: 1000 });
        setTimeout(done, 1200);
      }
    }
    if (!(name === 'form_error' && state.stat)) done();
  };
  document.addEventListener('click', e => {
    const t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;
    const a = t.closest('a[href^="https://wa.me/"]');
    if (a) window.pxTrack('whatsapp', a);
    if (t.closest('[data-consent-open]')) { e.preventDefault(); show(); }
  });

  /* ---------- Dialog ---------- */
  let box = null;
  function show(first) {
    if (!box) {
      box = document.createElement('section');
      box.className = 'consent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'consent-t');
      box.innerHTML = '<p class="consent__t" id="consent-t">Darf ich messen, wie diese Seite genutzt wird?</p>'
        + '<p>Die Seite funktioniert vollständig ohne Messung. Sie entscheiden für jeden Zweck einzeln, und Sie können Ihre Wahl jederzeit unter „Cookie-Einstellungen“ unten auf jeder Seite ändern.</p>'
        + '<label class="consent__o"><input type="checkbox" data-c-stat><span><b>Statistik mit Google Analytics</b>'
        + 'Zeigt mir, wie Besucher auf die Seite kommen, welche Seiten sie lesen und ob sie das Formular oder WhatsApp nutzen. Dafür werden Cookies gesetzt und Nutzungsdaten an Google übertragen.</span></label>'
        + '<label class="consent__o"><input type="checkbox" data-c-ads><span><b>Anzeigenmessung mit Google Ads</b>'
        + 'Zeigt mir, ob ein Klick auf eine meiner Anzeigen zu einer Anfrage führt. Dafür werden Cookies gesetzt und Daten an Google übertragen. Keine personalisierte Werbung.</span></label>'
        + '<p class="consent__n">Google kann Daten auch in die USA übermitteln. <a href="' + privacyUrl + '">Mehr im Datenschutz</a></p>'
        + '<div class="consent__b"><button type="button" data-c="none">Alle ablehnen</button><button type="button" data-c="all">Alle zulassen</button><button type="button" data-c="save" class="consent__save">Auswahl speichern</button></div>';
      box.addEventListener('click', e => {
        const c = e.target.dataset && e.target.dataset.c;
        if (!c) return;
        const choice = c === 'all' ? { stat: true, ads: true } : c === 'none' ? { stat: false, ads: false }
          : { stat: box.querySelector('[data-c-stat]').checked, ads: box.querySelector('[data-c-ads]').checked };
        write(choice); apply(choice);
        box.hidden = true;
      });
      document.body.appendChild(box);
    }
    box.querySelector('[data-c-stat]').checked = state.stat;
    box.querySelector('[data-c-ads]').checked = state.ads;
    box.hidden = false;
    if (!first) box.querySelector('input').focus();
  }

  const start = () => {
    const v = read();
    if (v) apply(v); else show(true);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
