#!/usr/bin/env python3
"""Erzeugt Ratgeber-Seiten, Leistungsseiten, die Ratgeber-Übersicht und die Sitemap aus seo/seiten.json.

Aufruf (im Repository-Wurzelverzeichnis):
  python3 seo/build.py                      schreibt veröffentlichte Seiten nach website/, Entwürfe nach entwuerfe/
  python3 seo/build.py --vorschau ZIEL      kopiert website/ nach ZIEL und schreibt dort alle Seiten (auch Entwürfe)

Handgepflegt und NICHT erzeugt: website/index.html, website/webseite-fuer-zahnaerzte/index.html,
website/impressum.html, website/datenschutz.html. Diese Seiten stehen trotzdem im Register (für Keywords,
Verlinkung und Sitemap), mit "erzeugt": false.
"""
import html, json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEO = ROOT / 'seo'
REG = json.loads((SEO / 'seiten.json').read_text())
CFG = REG['einstellungen']
BASE = CFG['domain']
V = CFG['version']
WA = CFG['whatsapp_link']
WA_NR = CFG['whatsapp_nummer']

args = sys.argv[1:]
VORSCHAU = pathlib.Path(args[args.index('--vorschau') + 1]).resolve() if '--vorschau' in args else None
OUT = VORSCHAU or ROOT / 'website'
if VORSCHAU:
    if VORSCHAU.exists(): shutil.rmtree(VORSCHAU)
    shutil.copytree(ROOT / 'website', VORSCHAU)
    for bild in (ROOT / 'entwuerfe' / 'img-og').glob('*.png'):  # Vorschaubilder der Entwürfe
        shutil.copy(bild, VORSCHAU / 'img' / 'og' / bild.name)

SEITEN = {p['url']: p for p in REG['seiten']}
def sichtbar(p): return p['status'] == 'live' or VORSCHAU is not None
def live(url): return url in SEITEN and sichtbar(SEITEN[url])

X = '<svg class="brand-x" viewBox="0 0 22 20" aria-hidden="true"><path d="M0 0h5.6L22 20h-5.6z"/><path d="M16.4 0H22l-7.4 9L11.8 5.6z"/><path d="M7.4 11l2.8 3.4L5.6 20H0z"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230c0b0a'/%3E%3Cg transform='translate(5 6)' fill='%23ff3d1f'%3E%3Cpath d='M0 0h5.6L22 20h-5.6z'/%3E%3Cpath d='M16.4 0H22l-7.4 9L11.8 5.6z'/%3E%3Cpath d='M7.4 11l2.8 3.4L5.6 20H0z'/%3E%3C/g%3E%3C/svg%3E"
SOC = (SEO / 'bausteine' / 'social.html').read_text().strip()
THREAD = '<svg class="thread" aria-hidden="true"><path class="thread__path" fill="none"/><circle class="thread__tip" r="5"/></svg>'
PERSON = {"@type": "Person", "@id": BASE + "/#fabian-heimann", "name": "Fabian Heimann", "jobTitle": "Inhaber von Praxel", "url": BASE + "/"}
ORG = {"@type": "Organization", "@id": BASE + "/#praxel", "name": "Praxel", "url": BASE + "/"}
MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
de_datum = lambda d: f"{int(d[8:10])}. {MONATE[int(d[5:7]) - 1]} {d[:4]}"
e = lambda s: html.escape(s, quote=True)
def strip(s): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s))).strip()

# ---------------------------------------------------------------- gemeinsame Bausteine
def head(p, ld, css, body_class, nav_html):
    pub = p.get('date')
    art = (f'<meta property="article:published_time" content="{pub}">\n<meta property="article:author" content="Fabian Heimann">\n'
           if p['typ'] == 'ratgeber' and pub else '')
    return f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(p['title'])}</title>
<meta name="description" content="{e(p['desc'])}">
<meta name="robots" content="index, follow">
<meta name="author" content="Fabian Heimann">
<link rel="canonical" href="{BASE}{p['url']}">
<meta property="og:url" content="{BASE}{p['url']}">
<meta property="og:type" content="{p.get('ogtype', 'article' if p['typ'] == 'ratgeber' else 'website')}">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="Praxel">
<meta property="og:title" content="{e(p['og_title'])}">
<meta property="og:description" content="{e(p['desc'])}">
<meta property="og:image" content="{BASE}/img/og/{p['og']}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
{art}<meta name="theme-color" content="#0c0b0a">
<link rel="preload" href="/fonts/funnel-display.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/funnel-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="{ICON}">
{''.join(f'<link rel="stylesheet" href="/css/{c}.css?v={V}">' + chr(10) for c in css)}<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
</script>
</head>
<body class="{body_class}">
<a class="skip" href="#inhalt">Zum Inhalt springen</a>

{nav_html}
'''

LOGO = f'<a class="nav__logo" href="/"><span class="sr-only">Praxel, zur Startseite</span><span class="nav__word" aria-hidden="true">Pra{X}el</span></a>'
def nav_ratgeber(p):
    cur = lambda u: ' aria-current="page"' if p['url'] == u else ''
    return f'''<header class="nav" data-theme="dark">
  {LOGO}
  <nav class="nav__links" aria-label="Hauptnavigation">
    <a href="/ratgeber/"{cur('/ratgeber/')}>Ratgeber</a>
    <a href="/ratgeber/webseiten-selbstcheck/"{cur('/ratgeber/webseiten-selbstcheck/')}>Selbstcheck</a>
    <a href="{'/webseite-fuer-arztpraxen/' if live('/webseite-fuer-arztpraxen/') else '/webseite-fuer-zahnaerzte/'}">Webseiten für Praxen</a>
  </nav>
  <a class="nav__cta" href="#entwurf"><span>Kostenloser Entwurf</span></a>
</header>'''

def form(prefix, stack=False, btn='btn--red'):
    msg = (f'<label class="ask__f"><span>Was soll besser werden? (freiwillig)</span><textarea name="nachricht" id="{prefix}-msg" rows="2"></textarea></label>\n            ' if stack else '')
    return f'''<form class="ask{' ask--stack' if stack else ''}" data-lead data-endpoint="/anfrage.php" data-wa="{WA_NR}" novalidate>
            <label class="ask__f"><span>Link zu Ihrer jetzigen Webseite</span><input type="text" name="link" id="{prefix}-link" inputmode="url" autocomplete="url" placeholder="www.ihre-praxis.de" required></label>
            <label class="ask__f"><span>Ihre WhatsApp-Nummer</span><input type="tel" name="whatsapp" id="{prefix}-wa" inputmode="tel" autocomplete="tel" placeholder="0151 2345678" required></label>
            {msg}<input class="ask__hp" type="text" name="website2" id="{prefix}-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <button class="btn {btn}" type="submit"><span>Kostenlosen Entwurf anfordern</span>{ARROW}</button>
            <p class="ask__msg" role="status" hidden></p>
          </form>'''

def offer(o):
    if not o: return ''
    if o['art'] == 'entwurf':
        return f'''<aside class="rg-offer" aria-label="Kostenloser Entwurf">
        <p class="eyebrow">Kostenloser Entwurf</p>
        <p class="rg-offer__t">{o['titel']}</p>
        <p>{o['text']}</p>
        {form('m')}
        <p class="ask__alt">Ich melde mich per WhatsApp. Sie können mir den Link auch <a class="link" href="{WA}" target="_blank" rel="noopener">direkt dort schicken</a>.</p>
      </aside>'''
    return f'''<aside class="rg-offer" aria-label="{e(o['eyebrow'])}">
        <p class="eyebrow">{o['eyebrow']}</p>
        <p class="rg-offer__t">{o['titel']}</p>
        <p>{o['text']}</p>
        <a class="btn btn--red" href="{o['href']}"><span>{o['label']}</span>{ARROW}</a>
      </aside>'''

def cta(title, lead, sid='entwurf', knot='<i class="knot knot--rg-end" data-knot></i>'):
    return f'''
  <section class="cta" id="{sid}" data-theme="red" aria-labelledby="h-{sid}">
    {knot}
    <div class="cta__fill">
      <div class="wrap cta__grid">
        <div class="cta__copy">
          <p class="eyebrow">Hier endet der Faden. Und hier beginnt Ihr Entwurf.</p>
          <h2 class="cta__title" id="h-{sid}">{title}</h2>
          <p class="lead">{lead}</p>
          <a class="btn btn--ink btn--wa" href="{WA}" target="_blank" rel="noopener"><span>Link per WhatsApp schicken</span>{ARROW}</a>
          <ol class="offer">
            <li><b>Der Entwurf ist kostenlos</b><span>Sie sehen Ihre neue Startseite, ohne etwas zu bezahlen.</span></li>
            <li><b>Das Gespräch ist unverbindlich</b><span>Wir sprechen nur, wenn Ihnen der Entwurf gefällt, und auch dann entscheiden Sie frei.</span></li>
            <li><b>Ein Ansprechpartner</b><span>Sie schreiben und sprechen von Anfang an direkt mit mir.</span></li>
          </ol>
        </div>
        <div class="form">
          <p class="form__alt">Oder gleich hier eintragen</p>
          {form('c', stack=True, btn='btn--ink')}
        </div>
      </div>
    </div>
  </section>
</main>
'''

def foot(js, cta_anchor):
    branchen = ''.join(f'<a href="{b["url"]}">{b["label"]}</a>' for b in REG['branchen'] if live(b['url']) or not b.get('generiert', True))
    return f'''
<footer class="foot" data-theme="dark">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__intro">
        <p class="foot__line">Webseiten, Automatisierungen und Software für Praxen und Kliniken.</p>
        {SOC}
      </div>
      <nav class="foot__cols" aria-label="Fußnavigation">
        <div class="foot__col"><p class="foot__h">Webseiten für</p>{branchen}</div>
        <div class="foot__col"><p class="foot__h">Ratgeber</p><a href="/ratgeber/">Alle Beiträge</a><a href="/ratgeber/webseiten-selbstcheck/">Webseiten-Selbstcheck</a><a href="/ratgeber/praxis-webseite/">Praxis-Webseite</a><a href="/ratgeber/personalsuche/">Personalsuche</a><a href="/ratgeber/online-terminvergabe/">Empfang und Termine</a></div>
        <div class="foot__col"><p class="foot__h">Praxel</p><a href="/">Startseite</a><a href="/#leistungen">Leistungen</a><a href="/#ueber">Über mich</a><a href="{cta_anchor}">Kostenloser Entwurf</a></div>
      </nav>
    </div>
    <p class="foot__mark" aria-hidden="true"><span>P</span><span>r</span><span>a</span><span>{X}</span><span>e</span><span>l</span><span class="foot__dot"></span></p>
    <div class="foot__base">
      <p>© <span data-year>2026</span> Praxel · Fabian Heimann, Berlin</p>
      <p><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a><a href="#" data-consent-open>Cookie-Einstellungen</a></p>
      <a class="foot__up" href="#top">Zurück zum Anfang des Fadens <span aria-hidden="true">↑</span></a>
    </div>
  </div>
</footer>

<script src="/js/{js}.js?v={V}" defer></script>
<script src="/js/consent.js?v={V}" data-privacy="/datenschutz.html" defer></script>
</body>
</html>
'''

def crumbs_ld(items):
    items = [x for i, x in enumerate(items) if x[1] or i == len(items) - 1]
    return {"@type": "BreadcrumbList", "itemListElement": [dict({"@type": "ListItem", "position": i + 1, "name": n}, **({"item": BASE + u} if u else {})) for i, (n, u) in enumerate(items)]}
def crumbs_html(items):
    # Zwischenstufen, deren Seite (noch) nicht veröffentlicht ist, werden ohne Link gezeigt
    return '<nav aria-label="Brotkrumen"><ol class="crumbs">' + ''.join(
        f'<li><a href="{u}">{n}</a></li>' if u and (live(u) or u in ('/', '/ratgeber/')) else f'<li>{n}</li>' for n, u in items[:-1]) + '</ol></nav>'
def faq_ld(url, qa):
    return {"@type": "FAQPage", "@id": BASE + url + "#fragen", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in qa]}
def karte(url):
    p = SEITEN.get(url)
    k = (p or {}).get('karte') or REG['karten_extern'][url]
    return f'<a href="{url}"><b>{k["titel"]}</b><span>{k["text"]}</span></a>'

# ---------------------------------------------------------------- Ratgeber-Beitrag
def ratgeber(p):
    body = (SEO / 'inhalte' / p['inhalt']).read_text().replace('{{OFFER}}', offer(p.get('offer')))
    toc = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    faqs = re.findall(r'<h3 class="q">(.*?)</h3>\s*<p>(.*?)</p>', body, re.S)
    words = len(strip(re.sub(r'<aside.*?</aside>', '', body, flags=re.S)).split())
    graph = [{"@type": p.get('ldtype', 'Article'), "@id": BASE + p['url'] + "#beitrag", "headline": strip(p['h1']), "description": p['desc'], "inLanguage": "de",
              "datePublished": p['date'], "dateModified": p.get('geaendert', p['date']), "author": PERSON, "publisher": ORG,
              "mainEntityOfPage": BASE + p['url'], "image": BASE + "/img/og/" + p['og'] + ".png",
              "audience": {"@type": "Audience", "audienceType": p.get('zielgruppe', CFG['zielgruppe_ratgeber'])}},
             crumbs_ld(p['crumbs'])]
    if faqs: graph.append(faq_ld(p['url'], faqs))
    more = ''.join(karte(u) for u in p['more'] if live(u) or not u.startswith('/ratgeber/'))
    stand = p.get('geaendert', p['date'])
    datum = f'<time datetime="{p["date"]}">{de_datum(p["date"])}</time>' + (f' · aktualisiert <time datetime="{stand}">{de_datum(stand)}</time>' if stand != p['date'] else '')
    return head(p, {"@context": "https://schema.org", "@graph": graph}, ['style', 'landing', 'ratgeber'], 'rg', nav_ratgeber(p)) + f'''
<main class="page" id="inhalt">
  {THREAD}

  <section class="rg-hero" id="top" data-theme="dark">
    <i class="knot knot--rg-start" data-knot></i><i class="knot knot--rg-fall" data-knot></i>
    <div class="wrap">
      {crumbs_html(p['crumbs'])}
      <h1>{p['h1']}</h1>
      <p class="lead">{p['lead']}</p>
      <p class="byline"><img src="/img/fabian-heimann.webp" alt="" width="56" height="56"><span><b>Fabian Heimann</b>Inhaber von Praxel · {datum} · {max(1, round(words / 200))} Minuten Lesezeit</span></p>
    </div>
  </section>

  <section class="rg-body" data-theme="light">
    <div class="wrap rg-grid">
      <nav class="toc" aria-label="Inhalt dieses Beitrags">
        <p>Inhalt</p>
        <ol>{''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc)}</ol>
      </nav>
      <article class="prose">
        <i class="knot knot--rg-a" data-knot></i><i class="knot knot--rg-b" data-knot></i>
{body}
        <div class="author">
          <img src="/img/fabian-heimann.webp" alt="Fabian Heimann" width="80" height="80" loading="lazy">
          <p><b>Fabian Heimann</b>{CFG['autor_kurz']}</p>
        </div>
        <nav class="more" aria-label="Weiterlesen">
          <p>Weiterlesen</p>
          {more}
        </nav>
      </article>
    </div>
  </section>
''' + cta(p['cta_title'], p['cta_lead']) + foot('ratgeber', '#entwurf')

# ---------------------------------------------------------------- Ratgeber-Übersicht
def uebersicht(p):
    reihe = {c['id']: i for i, c in enumerate(REG['cluster'])}
    beitraege = sorted([q for q in REG['seiten'] if q['typ'] == 'ratgeber' and sichtbar(q)],
                       key=lambda q: (reihe.get(q.get('cluster'), 99), (q.get('uebersicht') or {}).get('rang', 50)))
    gruppen = []
    nr = 0
    for c in REG['cluster']:
        teile = [q for q in beitraege if q.get('cluster') == c['id'] and q.get('uebersicht')]
        teile.sort(key=lambda q: q['uebersicht'].get('rang', 50))
        if not teile: continue
        if c['id'] == 'einstieg':
            karten = '\n          '.join(f'<a class="card card--dark" href="{q["url"]}"><p class="eyebrow">{q["uebersicht"]["eyebrow"]}</p><h3>{q["karte"]["titel"]}</h3><p>{q["uebersicht"]["text"]}</p><span class="card__go">Zum Selbstcheck →</span></a>' for q in teile)
            eyebrow = 'Zum Einstieg'
        else:
            nr += 1
            karten = '\n          '.join(f'<a class="card" href="{q["url"]}"><p class="eyebrow">{q["uebersicht"]["eyebrow"]}</p><h3>{q["karte"]["titel"]}</h3><p>{q["uebersicht"]["text"]}</p><span class="card__go">Beitrag lesen →</span></a>' for q in teile)
            eyebrow = f'Thema {nr:02d}'
        gruppen.append(f'''      <div class="rg-list__group">
        <header>
          <p class="eyebrow">{eyebrow}</p>
          <h2>{c['titel']}</h2>
          <p>{c['text']}</p>
        </header>
        <div class="cards">
          {karten}
        </div>
      </div>''')
    offen = [c.get('folgt_text', c['titel']) for c in REG['cluster'] if c.get('folgt') and not any(q.get('cluster') == c['id'] for q in beitraege)]
    hinweis = f'      <p class="note-s">Weitere Beiträge zu {" und ".join(offen)} folgen.</p>' if offen else ''
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "@id": BASE + p['url'], "name": strip(p['og_title']), "description": p['desc'], "inLanguage": "de", "publisher": ORG,
         "hasPart": [{"@type": "Article", "headline": q['karte']['titel'], "url": BASE + q['url']} for q in beitraege]},
        crumbs_ld([('Startseite', '/'), ('Ratgeber', None)])]}
    return head(p, ld, ['style', 'landing', 'ratgeber'], 'rg', nav_ratgeber(p)) + f'''
<main class="page" id="inhalt">
  {THREAD}

  <section class="rg-hero" id="top" data-theme="dark">
    <i class="knot knot--rg-start" data-knot></i><i class="knot knot--rg-fall" data-knot></i>
    <div class="wrap">
      <p class="eyebrow">{p['eyebrow']}</p>
      <h1>{p['h1']}</h1>
      <p class="lead">{p['lead']}</p>
    </div>
  </section>

  <section class="rg-body" data-theme="light">
    <i class="knot knot--rg-edge" data-knot></i><i class="knot knot--rg-edge2" data-knot></i>
    <div class="wrap rg-list">
{chr(10).join(gruppen)}
{hinweis}
    </div>
  </section>
''' + cta(p['cta_title'], p['cta_lead']) + foot('ratgeber', '#entwurf')

# ---------------------------------------------------------------- Leistungsseite (Gerüst der Zahnarzt-Seite)
def rows(items, reveal=True):
    r = ' data-reveal' if reveal else ''
    return ''.join(f'\n          <li{r}><b>{b}</b><span>{s}</span></li>' for b, s in items)

def leistung(p):
    c = json.loads((SEO / 'inhalte' / p['inhalt']).read_text())
    w = c['wort']  # grammatische Bausteine: ihre_akk, ihrer_dat, plural, beispiel_url
    faq = c['faq']
    ratgeber_links = [u for u in c['weiterlesen'] if live(u)]
    weitere = [b for b in REG['branchen'] if b['url'] != p['url'] and (live(b['url']) or not b.get('generiert', True))]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Service", "@id": BASE + p['url'] + "#leistung", "name": strip(c['service']['name']), "serviceType": c['service']['typ'],
         "description": p['desc'], "url": BASE + p['url'], "areaServed": {"@type": "Country", "name": "Deutschland"},
         "audience": {"@type": "BusinessAudience", "audienceType": c['service']['zielgruppe']},
         "provider": {"@type": "Organization", "@id": BASE + "/#praxel", "name": "Praxel", "url": BASE + "/",
                      "founder": {"@type": "Person", "name": "Fabian Heimann"}, "address": {"@type": "PostalAddress", "addressLocality": "Berlin", "addressCountry": "DE"}}},
        faq_ld(p['url'], faq)]}
    nav = f'''<header class="nav" data-theme="dark">
  {LOGO}
  <nav class="nav__links" aria-label="Seitennavigation">
    <a href="#einfach">So einfach</a>
    <a href="#worauf">Worauf es ankommt</a>
    <a href="#angebot">Angebot</a>
    <a href="#ablauf">Ablauf</a>
    <a href="#fragen">Fragen</a>
  </nav>
  <a class="nav__cta" href="#top"><span>Kostenloser Entwurf</span></a>
</header>

<a class="sticky-cta" href="#top">Kostenlosen Entwurf anfordern</a>'''
    tangle = ''.join(f'\n          <p class="tangle__item">{t}</p>' for t in c['probleme']['punkte'])
    fach = ''.join(f'\n        <p data-reveal>{t}</p>' for t in c['worauf']['absaetze'])
    weiter_html = ''
    if ratgeber_links or weitere:
        rl = ''.join(f'\n          <li data-reveal><b><a class="link" href="{u}">{(SEITEN[u].get("karte") or {}).get("titel")}</a></b><span>{(SEITEN[u].get("karte") or {}).get("text")}</span></li>' for u in ratgeber_links)
        wl = ''.join(f'<a href="{b["url"]}">{b["label"]}</a>' for b in weitere)
        teil_rg = (f'''<ul class="rows">{rl}
        </ul>
        <p class="eyebrow lp-more__h" data-reveal>Webseiten auch für</p>''' if ratgeber_links else '<p class="eyebrow lp-more__h" data-reveal>Webseiten auch für</p>')
        lead_rg = ('Im Ratgeber erkläre ich ausführlicher, worauf es ankommt. Ohne Anmeldung, für Inhaber und Leitung geschrieben.' if ratgeber_links
                   else 'Praxel baut Webseiten für den Gesundheitsbereich. Jede dieser Seiten ist auf die Besonderheiten des jeweiligen Bereichs zugeschnitten.')
        weiter_html = f'''
  <!-- ============ Weiterlesen ============ -->
  <section class="lp-sec" data-theme="light" aria-labelledby="h-weiter">
    <i class="knot knot--c knot--top" data-knot></i>
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>Zum Weiterlesen</p>
        <h2 class="h2" id="h-weiter" data-split>{c['weiterlesen_titel']}</h2>
        <p class="lead" data-reveal>{lead_rg}</p>
      </header>
      <div class="split__body">
        {teil_rg}
        <p class="lp-more" data-reveal>{wl}</p>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>
'''
    faq_html = ''.join(f'\n        <details class="qa" name="faq"><summary>{q}<i></i></summary><div class="qa__a"><p>{a}</p></div></details>' for q, a in faq)
    return head(p, ld, ['style', 'landing'], 'lp', nav) + f'''

<main class="page" id="inhalt">
  {THREAD}

  <!-- ============ Hero ============ -->
  <section class="hero" id="top" data-theme="dark">
    <canvas class="hero__rope" aria-hidden="true"></canvas>
    <i class="knot knot--hero" data-knot></i>
    <div class="hero__inner">
      <p class="eyebrow hero__eyebrow"><span>{c['hero']['eyebrow']}</span></p>
      <h1 class="hero__title" data-split>{c['hero']['h1']}</h1>
      <p class="hero__lead">{c['hero']['lead']}</p>
      <div class="hero__form">
        <form class="ask" data-lead data-endpoint="/anfrage.php" data-wa="{WA_NR}" novalidate>
          <label class="ask__f"><span>Link zu Ihrer jetzigen Webseite</span><input type="text" name="link" id="h-link" inputmode="url" autocomplete="url" placeholder="{w['beispiel_url']}" required></label>
          <label class="ask__f"><span>Ihre WhatsApp-Nummer</span><input type="tel" name="whatsapp" id="h-wa" inputmode="tel" autocomplete="tel" placeholder="0151 2345678" required></label>
          <input class="ask__hp" type="text" name="website2" id="h-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn--red" type="submit"><span>Kostenlosen Entwurf anfordern</span>{ARROW}</button>
          <p class="ask__msg" role="status" hidden></p>
        </form>
        <p class="ask__alt">Ich melde mich per WhatsApp bei Ihnen. Sie können mir den Link auch <a class="link" href="{WA}" target="_blank" rel="noopener">direkt dort schicken</a>.</p>
        <p class="hero__terms">Entwurf in drei Tagen<i></i>kostenlos<i></i>Gespräch unverbindlich</p>
      </div>
    </div>
  </section>

  <!-- ============ So einfach ist es ============ -->
  <section class="lp-sec easy" id="einfach" data-theme="light" aria-labelledby="h-einfach">
    <i class="knot knot--c knot--top" data-knot></i>
    <div class="wrap split">
      <div class="easy__left">
        <header class="easy__head">
          <p class="eyebrow" data-reveal>So einfach ist es</p>
          <h2 class="h2" id="h-einfach" data-split>Ein Link genügt. <em>Den Rest mache ich.</em></h2>
          <p class="lead" data-reveal>Sie schicken mir per WhatsApp die Adresse Ihrer jetzigen Webseite. Ich sehe sie mir genau an und baue daraus kostenlos einen Entwurf Ihrer neuen Startseite, mit Ihren Inhalten, Ihren Farben und Ihren Bildern. Sie erhalten ihn innerhalb von drei Tagen.</p>
        </header>
        <p class="eyebrow easy__label" data-reveal>Was ich mir an Ihrer Seite ansehe</p>
        <ul class="rows">{rows(c['pruefpunkte'])}
        </ul>
        <p class="note-s" data-reveal>Aus diesen Punkten entsteht Ihr Entwurf. Sie sehen ihn am Bildschirm und auf dem Handy.</p>
      </div>
      <div class="split__body">
        <div class="phone" aria-label="Beispielhafter Ablauf als Chatverlauf">
          <div class="phone__top"><img src="/img/fabian-heimann.webp" alt="" width="80" height="80" loading="lazy"><div><b>Fabian Heimann</b><span>Praxel · Webseiten für {w['plural']}</span></div></div>
          <ol class="chat">
            <li class="chat__msg chat__msg--me"><p>Guten Tag Herr Heimann, hier ist unsere Seite:</p><p class="chat__url">{w['beispiel_url']}</p></li>
            <li class="chat__msg"><p>Vielen Dank. Ich sehe sie mir an und melde mich innerhalb von drei Tagen mit einem Entwurf für Ihre neue Startseite.</p></li>
            <li class="chat__msg chat__msg--card"><p>Ihr Entwurf ist fertig:</p><div class="chat__card"><i></i><div><b>Entwurf: Ihre neue Startseite</b><span>Ansehen am Bildschirm und auf dem Handy</span></div></div></li>
            <li class="chat__msg chat__msg--me"><p>Das gefällt uns. Wie geht es weiter?</p></li>
            <li class="chat__msg"><p>Das freut mich. Dann sprechen wir unverbindlich darüber. Wann passt es Ihnen?</p></li>
          </ol>
          <p class="phone__note">Beispielhafter Ablauf</p>
        </div>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Warum kostenlos ============ -->
  <section class="lp-sec free" id="kostenlos" data-theme="dark" aria-labelledby="h-frei">
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>Eine berechtigte Frage</p>
        <h2 class="h2" id="h-frei" data-split>Warum ist der Entwurf <em>kostenlos?</em></h2>
      </header>
      <div class="split__body free__text">
        <p class="free__big" data-reveal>Weil Sie erst sehen sollten, was ich kann, bevor wir über einen Auftrag sprechen.</p>
        <p data-reveal>Ein Gespräch über Möglichkeiten sagt wenig. Ein Entwurf, der auf {w['ihre_akk']} zugeschnitten ist, zeigt Ihnen genau, was Sie bekommen würden. Deshalb gehe ich in Vorleistung und nicht Sie.</p>
        <p data-reveal>Gefällt Ihnen der Entwurf, haben wir eine gute Grundlage für ein Gespräch. Gefällt er Ihnen nicht, haben Sie nichts verloren. Ob daraus ein Auftrag wird, entscheiden allein Sie.</p>
        <p class="free__sign" data-reveal><img src="/img/fabian-heimann.webp" alt="" width="80" height="80" loading="lazy"><span><b>Fabian Heimann</b>Inhaber von Praxel</span></p>
      </div>
    </div>
    <i class="knot knot--c knot--low" data-knot></i>
    <i class="knot knot--pin" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Alltag: der Faden verknotet sich ============ -->
  <section class="tangle" data-theme="dark" aria-labelledby="h-alltag">
    <i class="knot knot--pin" data-knot style="top:0"></i>
    <div class="tangle__pin">
      <canvas class="tangle__canvas" aria-hidden="true"></canvas>
      <div class="tangle__inner">
        <p class="eyebrow" id="h-alltag">Kommt Ihnen etwas davon bekannt vor?</p>
        <div class="tangle__stage">{tangle}
          <div class="tangle__item tangle__item--end">
            <p>{c['probleme']['ende']}</p>
            <p class="tangle__resolve">Das lässt sich <em>ändern.</em></p>
          </div>
        </div>
        <p class="tangle__count" aria-hidden="true"><b>01</b> / 03</p>
      </div>
    </div>
    <i class="knot knot--pin" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Warum die Webseite zählt ============ -->
  <section class="lp-sec" data-theme="light" aria-labelledby="h-warum">
    <i class="knot knot--c knot--top" data-knot></i>
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>Warum die Webseite zählt</p>
        <h2 class="h2" id="h-warum" data-split>{c['warum']['h2']}</h2>
        <p class="lead" data-reveal>{c['warum']['lead']}</p>
      </header>
      <div class="split__body">
        <ul class="rows">{rows(c['warum']['punkte'])}
        </ul>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Worauf es ankommt ============ -->
  <section class="lp-sec" id="worauf" data-theme="dark" aria-labelledby="h-worauf">
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>{c['worauf']['eyebrow']}</p>
        <h2 class="h2" id="h-worauf" data-split>{c['worauf']['h2']}</h2>
      </header>
      <div class="split__body free__text">{fach}
        <p class="note-s flat" data-reveal>{c['worauf']['hinweis']}</p>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Angebot ============ -->
  <section class="lp-sec" id="angebot" data-theme="light" aria-labelledby="h-angebot">
    <i class="knot knot--c knot--top" data-knot></i>
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>Das Angebot</p>
        <h2 class="h2" id="h-angebot" data-split>Der Entwurf ist kostenlos. <em>Das Gespräch ist unverbindlich.</em></h2>
        <p class="lead" data-reveal>Eine neue Webseite ist Vertrauenssache. Deshalb sehen Sie zuerst, was Sie bekommen würden, und müssen sich zu nichts verpflichten.</p>
        <a class="btn btn--ink" href="{WA}" target="_blank" rel="noopener" data-reveal><span>Link per WhatsApp schicken</span>{ARROW}</a>
      </header>
      <div class="split__body">
        <p class="eyebrow" style="margin-bottom:1.2rem">{c['angebot']['titel']}</p>
        <ul class="checks">{''.join(f'{chr(10)}          <li data-reveal>{x}</li>' for x in c['angebot']['punkte'])}
        </ul>
        <p class="note-s flat">Hosting und Domain sind laufende Kosten Ihres Anbieters und nicht Teil des Festpreises. Ihre bestehende Domain kann bleiben.</p>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Später mehr ============ -->
  <section class="lp-sec" data-theme="dark" aria-labelledby="h-danach">
    <div class="wrap split">
      <header class="split__head">
        <p class="eyebrow" data-reveal>Wenn Sie später mehr möchten</p>
        <h2 class="h2" id="h-danach" data-split>Die Webseite ist der Grundstein. <em>Abläufe lassen sich anschließen.</em></h2>
        <p class="lead" data-reveal>{c['spaeter']['lead']}</p>
      </header>
      <div class="split__body">
        <ul class="rows">{rows(c['spaeter']['punkte'])}
        </ul>
        <p class="note-s" data-reveal>{c['spaeter']['hinweis']}</p>
      </div>
    </div>
    <i class="knot knot--c" data-knot style="top:100%"></i>
  </section>
{weiter_html}
  <!-- ============ Ablauf ============ -->
  <section class="process" id="ablauf" data-theme="dark">
    <div class="wrap process__grid">
      <header class="process__head">
        <p class="eyebrow" data-reveal>Ablauf</p>
        <h2 class="h2" data-split>Drei Schritte, und Ihr Aufwand <em>bleibt klein.</em></h2>
        <p class="lead" data-reveal>Sie müssen nichts vorbereiten und sich zu nichts verpflichten.</p>
      </header>
      <ol class="steps">
        <li class="step"><i class="knot" data-knot></i><i class="step__dot"></i><span class="step__no" aria-hidden="true">1</span>
          <h3 class="h3">Sie schicken mir Ihren Link</h3><p>Eine kurze WhatsApp-Nachricht mit der Adresse Ihrer jetzigen Webseite genügt. Wenn Sie mögen, schreiben Sie dazu, was Sie stört.</p></li>
        <li class="step"><i class="knot" data-knot></i><i class="step__dot"></i><span class="step__no" aria-hidden="true">2</span>
          <h3 class="h3">Sie erhalten Ihren Entwurf</h3><p>Innerhalb von drei Tagen entsteht aus Ihren vorhandenen Inhalten kostenlos eine neue Startseite. Sie sehen sie am Bildschirm und auf dem Handy und können sie im Team zeigen.</p></li>
        <li class="step"><i class="knot" data-knot></i><i class="step__dot"></i><span class="step__no" aria-hidden="true">3</span>
          <h3 class="h3">Wir sprechen, wenn er Ihnen gefällt</h3><p>Nur dann treffen wir uns zu einem unverbindlichen Gespräch. Sie erfahren, was die gesamte Seite kostet, und entscheiden in Ruhe.</p><i class="knot knot--steps" data-knot></i></li>
      </ol>
    </div>
    <i class="knot knot--edge" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Wer dahintersteht ============ -->
  <section class="about" data-theme="light" aria-labelledby="h-wer">
    <div class="wrap">
      <h2 class="eyebrow" id="h-wer">Wer dahintersteht</h2>
      <div class="about__top">
        <figure class="about__photo">
          <picture><source srcset="/img/fabian-heimann.webp" type="image/webp"><img src="/img/fabian-heimann.jpg" alt="Porträt von Fabian Heimann" width="900" height="900" loading="lazy"></picture>
          <figcaption>Fabian Heimann<i></i>Inhaber<i></i>Berlin</figcaption>
        </figure>
        <div>
          <p class="about__say">Hinter Praxel stehe ich, Fabian Heimann. Als inhabergeführte Agentur für den Gesundheitsbereich entwickle ich Webseiten, Automatisierungen und Software, hier für {w['plural']}. Sie sprechen von der ersten Nachricht bis zum Start direkt mit mir, ohne Weiterleitungen und ohne wechselnde Zuständigkeiten.</p>
          <p class="who__more"><a class="link" href="/">Mehr über mich und meine Arbeit</a></p>
        </div>
      </div>
    </div>
    <i class="knot knot--edge" data-knot style="top:100%"></i>
  </section>

  <!-- ============ Fragen ============ -->
  <section class="faq" id="fragen" data-theme="dark">
    <div class="wrap faq__grid">
      <header class="faq__head">
        <p class="eyebrow" data-reveal>Fragen</p>
        <h2 class="h2" data-split>{c['faq_titel']}</h2>
        <p class="lead" data-reveal>Ihre Frage fehlt? Schreiben Sie sie einfach <a class="link" href="#kontakt">mit in die Anfrage</a>.</p>
      </header>
      <div class="faq__list">{faq_html}
      </div>
    </div>
    <i class="knot knot--edge knot--low" data-knot></i>
    <i class="knot knot--end" data-knot style="top:100%"></i>
  </section>
''' + cta('Darf ich Ihnen Ihre neue Seite <em>zeigen?</em>', c['cta_lead'], sid='kontakt', knot='') + foot('landing', '#kontakt')

# ---------------------------------------------------------------- Sitemap
def sitemap():
    eintraege = [q for q in REG['seiten'] if q['status'] == 'live' and q.get('index', True)]
    zeilen = []
    for q in eintraege:
        lm = q.get('geaendert') or q.get('date')
        zeilen.append(f'  <url><loc>{BASE}{q["url"]}</loc>' + (f'<lastmod>{lm}</lastmod>' if lm else '') + '</url>')
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(zeilen) + '\n</urlset>\n'

# ---------------------------------------------------------------- Schreiben
def entschaerfen(s):
    """Beim Veröffentlichen: Links auf Seiten, die im Register noch Entwurf sind, werden zu normalem Text.
    So kann ein veröffentlichter Beitrag nie ins Leere verlinken, auch wenn Entwürfe schon im Text erwähnt sind."""
    if VORSCHAU: return s
    def ersetze(m):
        ziel = m.group(2).split('#')[0]
        return m.group(3) if ziel in SEITEN and not live(ziel) else m.group(0)
    return re.sub(r'<a ([^>]*?)href="(/[^"]*)"[^>]*>(.*?)</a>', ersetze, s, flags=re.S)
def schreiben(url, s):
    d = OUT / url.strip('/'); d.mkdir(parents=True, exist_ok=True); (d / 'index.html').write_text(entschaerfen(re.sub(r'\n[ \t]+\n', '\n', s)))
def entwurf_ablegen(url, s):
    f = ROOT / 'entwuerfe' / (url.strip('/').replace('/', '--') + '.html'); f.parent.mkdir(exist_ok=True); f.write_text(s)

RENDER = {'ratgeber': ratgeber, 'uebersicht': uebersicht, 'leistung': leistung}
for p in REG['seiten']:
    if not p.get('erzeugt', True): continue
    s = RENDER[p['typ']](p)
    if sichtbar(p): schreiben(p['url'], s)
    else: entwurf_ablegen(p['url'], s)
    print(('VORSCHAU ' if p['status'] != 'live' else '') + p['url'])
(OUT / 'sitemap.xml').write_text(sitemap())
print('Sitemap:', sitemap().count('<loc>'), 'Adressen', '| Ziel:', OUT)
