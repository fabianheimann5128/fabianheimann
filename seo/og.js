// Erzeugt Vorschaubilder fürs Teilen (1200 × 630) für alle Seiten im Register mit "og_bild".
// Aufruf im Repository-Wurzelverzeichnis: node seo/og.js [--alle]
// Ohne --alle werden nur fehlende Bilder erzeugt. Entwürfe landen ebenfalls in website/img/og/.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo/seiten.json'), 'utf8'));
const font = n => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'website/fonts', n)).toString('base64');
const X = '<svg viewBox="0 0 22 20"><path d="M0 0h5.6L22 20h-5.6z"/><path d="M16.4 0H22l-7.4 9L11.8 5.6z"/><path d="M7.4 11l2.8 3.4L5.6 20H0z"/></svg>';
const alle = process.argv.includes('--alle');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const s of reg.seiten.filter(s => s.og_bild && s.og)) {
    const ziel = path.join(ROOT, 'website/img/og', s.og + '.png');
    if (!alle && fs.existsSync(ziel)) continue;
    await p.setContent(`<style>
      @font-face{font-family:D;src:url(${font('funnel-display.woff2')});font-weight:300 800}
      @font-face{font-family:M;src:url(${font('mono.woff2')});font-weight:100 800}
      body{margin:0;width:1200px;height:630px;background:radial-gradient(120% 90% at 85% 0%,#2a1712 0%,#0c0b0a 58%);color:#ece5d8;font-family:D;position:relative;overflow:hidden}
      .in{position:absolute;left:80px;right:230px;top:70px;bottom:70px;display:flex;flex-direction:column;justify-content:space-between}
      .eb{font:500 22px M;letter-spacing:.14em;text-transform:uppercase;color:rgba(236,229,216,.7)}
      h1{margin:0;font-size:78px;font-weight:500;line-height:1.03;letter-spacing:-.035em;text-wrap:balance} em{font-style:normal;color:#ff3d1f}
      .logo{font-size:46px;font-weight:600;letter-spacing:-.035em;display:flex;align-items:baseline} .logo svg{width:.585em;height:.532em;margin:0 .035em 0 .05em;fill:#ff3d1f}
      .th{position:absolute;inset:0}</style>
      <svg class="th" viewBox="0 0 1200 630"><path d="M1050 -10 L1050 300 Q1050 380 1120 420 Q1180 455 1130 520 Q1090 570 1100 640" fill="none" stroke="#ff3d1f" stroke-width="4" stroke-linecap="round" style="filter:drop-shadow(0 0 14px #ff3d1f)"/></svg>
      <div class="in"><div class="eb">${s.og_bild.eyebrow}</div><h1>${s.og_bild.text}</h1><div class="logo">Pra${X}el</div></div>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: ziel }); console.log('Bild:', path.relative(ROOT, ziel));
  }
  await b.close();
})();
