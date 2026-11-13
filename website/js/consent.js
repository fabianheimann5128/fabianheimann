/* Einwilligung und Google-Ads-Messung.
   Das Google-Tag wird erst geladen, nachdem der Besucher zugestimmt hat. Ohne Zustimmung
   werden keine Cookies gesetzt und keine Daten an Google übertragen. */
(() => {
  const AW_ID = 'AW-18573039016';
  const SEND_TO = {
    form: 'AW-18573039016/wDeyCIu-3LcdEKirqJhF',   // Conversion „Anfrage Formular“
    whatsapp: 'AW-18573039016/WqHlCI6-3LcdEKirqJhF', // Conversion „WhatsApp Klick“
  };
  const KEY = 'praxel-einwilligung';
  const privacyUrl = (document.currentScript && document.currentScript.dataset.privacy) || 'datenschutz.html';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Consent Mode: alles ist verweigert, bis der Besucher etwas anderes entscheidet
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = v => { try { localStorage.setItem(KEY, v); } catch (e) { /* ohne Speicher gilt die Wahl nur für diesen Aufruf */ } };

  let granted = false, loaded = false;
  function grant() {
    granted = true;
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
    if (loaded) return;
    loaded = true;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', AW_ID);
  }
  function deny() {
    granted = false;
    gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  }

  // Wird von den Formularen und WhatsApp-Links aufgerufen
  window.pxTrack = name => {
    const to = SEND_TO[name];
    if (granted && to) gtag('event', 'conversion', { send_to: to });
  };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) window.pxTrack('whatsapp');
    if (e.target.closest && e.target.closest('[data-consent-open]')) { e.preventDefault(); show(); }
  });

  let box = null;
  function show() {
    if (box) { box.hidden = false; box.querySelector('button').focus(); return; }
    box = document.createElement('section');
    box.className = 'consent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Einwilligung zur Messung');
    box.innerHTML = '<p class="consent__t">Darf ich messen, ob Anzeigen zu Anfragen führen?</p>'
      + '<p>Dafür nutzt diese Seite Google Ads. Wenn Sie zustimmen, werden Cookies gesetzt und Daten an Google übertragen. Die Seite funktioniert auch ohne Zustimmung. <a href="' + privacyUrl + '">Mehr im Datenschutz</a></p>'
      + '<div class="consent__b"><button type="button" data-c="no">Ablehnen</button><button type="button" data-c="yes">Zustimmen</button></div>';
    box.addEventListener('click', e => {
      const c = e.target.dataset && e.target.dataset.c;
      if (!c) return;
      write(c === 'yes' ? 'ja' : 'nein');
      c === 'yes' ? grant() : deny();
      box.hidden = true;
    });
    document.body.appendChild(box);
  }

  const start = () => { const v = read(); if (v === 'ja') grant(); else if (v !== 'nein') show(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
