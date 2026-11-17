#!/usr/bin/env python3
"""SEO-Prüfung für alle Seiten im Register (seo/seiten.json).

Aufruf:
  python3 seo/pruefen.py                 prüft website/ (veröffentlichte Seiten)
  python3 seo/pruefen.py --dir ORDNER    prüft eine Vorschau (z. B. aus build.py --vorschau), inkl. Entwürfe

Fehler (FEHLER) brechen mit Exit-Code 1 ab, Warnungen (WARNUNG) und Hinweise (INFO) nicht.
Regeln und Schwellen: siehe seo/LIESMICH.md. Die Werte sind Faustregeln, keine Google-Signale.
"""
import html, json, pathlib, re, sys
from collections import defaultdict
from html.parser import HTMLParser
from urllib.parse import urljoin

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = json.loads((ROOT / 'seo' / 'seiten.json').read_text())
KW = json.loads((ROOT / 'seo' / 'keyword-recherche.json').read_text())
BASE = REG['einstellungen']['domain']
args = sys.argv[1:]
DIR = pathlib.Path(args[args.index('--dir') + 1]).resolve() if '--dir' in args else ROOT / 'website'
VORSCHAU = '--dir' in args
GEMESSEN = {k['keyword']: k for k in KW['gemessen']['keywords']}

meldungen = []
def melde(stufe, url, text): meldungen.append((stufe, url, text))

def datei(url):
    p = DIR / url.lstrip('/')
    return p / 'index.html' if url.endswith('/') else p

class Seite(HTMLParser):
    """Liest Kopf, Überschriften, Links, Bilder und den sichtbaren Haupttext (ohne Navigation und Footer)."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.ids, self.imgs, self.heads, self.ld = {}, [], set(), [], [], []
        self.title = ''; self.canonical = None
        self._stack = []; self._in = None; self._buf = []; self.text = []; self.body_links = []
        self._skip = 0; self._h = None
    def handle_starttag(self, tag, a):
        a = dict(a)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'meta':
            k = a.get('name') or a.get('property')
            if k: self.meta[k] = a.get('content', '')
        elif tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href')
        elif tag == 'title': self._in = 'title'
        elif tag == 'script' and a.get('type') == 'application/ld+json': self._in = 'ld'; self._buf = []
        elif tag in ('script', 'style'): self._skip += 1
        elif tag in ('header', 'footer') and 'nav' in (a.get('class') or '') or tag == 'footer': self._skip += 1; self._stack.append(('skip', tag))
        elif tag == 'a' and a.get('href'):
            self.links.append(a['href'])
            if not self._skip: self.body_links.append(a['href'])
        elif tag == 'img': self.imgs.append(a)
        if re.fullmatch(r'h[1-6]', tag): self._h = [int(tag[1]), '']
    def handle_endtag(self, tag):
        if tag == 'title': self._in = None
        elif tag == 'script' and self._in == 'ld': self.ld.append(''.join(self._buf)); self._in = None
        elif tag in ('script', 'style'): self._skip = max(0, self._skip - 1)
        elif self._stack and self._stack[-1] == ('skip', tag): self._stack.pop(); self._skip -= 1
        if self._h and tag == f'h{self._h[0]}':
            if not self._skip: self.heads.append((self._h[0], re.sub(r'\s+', ' ', self._h[1]).strip()))
            self._h = None
    def handle_data(self, d):
        if self._in == 'title': self.title += d
        elif self._in == 'ld': self._buf.append(d)
        elif not self._skip:
            self.text.append(d)
            if self._h: self._h[1] += d

def lesen(url):
    f = datei(url)
    if not f.exists(): return None
    s = Seite(); s.feed(f.read_text()); s.plain = re.sub(r'\s+', ' ', ' '.join(s.text)).strip()
    s.raw = f.read_text(); return s

def kw_im(text, kw):
    """Jeder Wortstamm des Keywords (5 Zeichen) kommt im Text vor, auch innerhalb zusammengesetzter Wörter
    (Zahnarztpraxis enthält arztpraxis). Website, Webseite und Homepage gelten als gleichwertig."""
    t = text.lower()
    gleich = {'websi': ('websi', 'webse', 'homep'), 'webse': ('websi', 'webse', 'homep'), 'homep': ('websi', 'webse', 'homep'),
              'praxi': ('praxi', 'praxe')}
    teile = [re.sub(r'[^a-zäöüß0-9]', '', w)[:5] for w in kw.lower().split() if len(w) >= 3]
    return all(any(v in t for v in gleich.get(x, (x,))) for x in teile)

# ------------------------------------------------------------ Seiten einlesen
seiten = {}
for p in REG['seiten']:
    if p['status'] != 'live' and not VORSCHAU: continue
    s = lesen(p['url'])
    if s is None:
        melde('FEHLER', p['url'], 'Datei fehlt'); continue
    seiten[p['url']] = (p, s)

titel, beschr = defaultdict(list), defaultdict(list)
eingehend = defaultdict(set); eingehend_text = defaultdict(set)

for url, (p, s) in seiten.items():
    idx = p.get('index', True)
    if not idx: continue
    t = html.unescape(s.title.strip()); d = s.meta.get('description', '')
    titel[t].append(url); beschr[d].append(url)
    # Titel und Beschreibung
    if not 30 <= len(t) <= 60: melde('WARNUNG', url, f'Titel hat {len(t)} Zeichen (30–60): „{t}“')
    if not 120 <= len(d) <= 160: melde('WARNUNG', url, f'Beschreibung hat {len(d)} Zeichen (120–160)')
    if d and t and d.lower().startswith(t.split('|')[0].strip().lower()[:40]): melde('WARNUNG', url, 'Beschreibung wiederholt den Titel')
    # Robots, canonical, Open Graph
    if 'noindex' in s.meta.get('robots', ''): melde('FEHLER', url, 'noindex auf einer Seite, die indexiert werden soll')
    if s.canonical != BASE + url: melde('FEHLER', url, f'canonical zeigt auf {s.canonical}')
    if s.meta.get('og:url') not in (None, BASE + url): melde('WARNUNG', url, 'og:url weicht vom canonical ab')
    for k in ('og:title', 'og:description', 'og:image'):
        if not s.meta.get(k): melde('WARNUNG', url, f'{k} fehlt')
    img = s.meta.get('og:image', '')
    if img.startswith(BASE) and not (DIR / img[len(BASE):].lstrip('/')).exists(): melde('FEHLER', url, f'Vorschaubild fehlt: {img}')
    # Überschriften
    h1 = [h for h in s.heads if h[0] == 1]
    if len(h1) != 1: melde('FEHLER', url, f'{len(h1)} H1 statt genau einer')
    for (a, _), (b, txt) in zip(s.heads, s.heads[1:]):
        if b > a + 1: melde('WARNUNG', url, f'Überschriftenebene springt von H{a} auf H{b} („{txt[:40]}“)')
    # Bilder
    for im in s.imgs:
        if 'alt' not in im: melde('FEHLER', url, f'Bild ohne alt: {im.get("src")}')
    # Strukturierte Daten
    for blob in s.ld:
        try: data = json.loads(blob)
        except Exception as ex: melde('FEHLER', url, f'JSON-LD ungültig: {ex}'); continue
        for g in data.get('@graph', [data]):
            if g.get('@type') == 'FAQPage':
                for q in g['mainEntity']:
                    if q['name'] not in s.plain: melde('FEHLER', url, f'FAQ-Frage nicht sichtbar: {q["name"][:50]}')
            for k, v in g.items():
                if k in ('url', 'mainEntityOfPage', 'image', 'item') and isinstance(v, str) and not v.startswith('http'): melde('FEHLER', url, f'relative URL in JSON-LD: {k}')
    # Keyword-Platzierung
    kw = (p.get('keyword') or {}).get('haupt')
    if kw and p.get('erzeugt', True) is not False:
        h1t = h1[0][1] if h1 else ''
        anfang = ' '.join(s.plain.split()[:120])
        fehlt = [n for n, txt in (('Titel', t), ('H1', h1t), ('ersten 120 Wörtern', anfang)) if not kw_im(txt, kw)]
        if fehlt: melde('WARNUNG', url, f'Hauptkeyword „{kw}“ fehlt in: {", ".join(fehlt)}')
    # Umfang
    worte = len(s.plain.split())
    mindest = {'leistung': 800, 'ratgeber': 900}.get(p['typ'])
    if mindest and worte < mindest and p['url'] != '/ratgeber/webseiten-selbstcheck/': melde('WARNUNG', url, f'nur {worte} Wörter (Richtwert {mindest})')
    # Links sammeln (relative Links werden gegen die Seitenadresse aufgelöst)
    def aufloesen(h):
        if h.startswith(BASE): h = h[len(BASE):]
        if h.startswith(('#', 'http', 'mailto:', 'tel:', 'data:', 'javascript:')) or not h: return None
        return urljoin(url, h)
    s.links = [aufloesen(h) or h for h in s.links]; s.body_links = [aufloesen(h) or h for h in s.body_links]
    for quelle, ziel_liste in (('alle', s.links), ('text', s.body_links)):
        for h in ziel_liste:
            if h.startswith('#') or not h.startswith('/'): continue
            ziel = h.split('#')[0]
            (eingehend if quelle == 'alle' else eingehend_text)[ziel].add(url)
    for h in set(s.links):
        if '#' in h and h.split('#')[0] in ('', url) and len(h.split('#')[1]) > 0 and h.split('#')[1] not in s.ids: melde('FEHLER', url, f'Sprungziel fehlt: #{h.split("#")[1]}')
        if h.startswith('/'):
            z = h.split('#')[0]
            if not datei(z).exists(): melde('FEHLER', url, f'interner Link ins Leere: {h}')

# Gleiche Titel/Beschreibungen
for t, us in titel.items():
    if len(us) > 1: melde('FEHLER', ', '.join(us), f'gleicher Titel „{t}“')
for d, us in beschr.items():
    if len(us) > 1: melde('FEHLER', ', '.join(us), 'gleiche Beschreibung')

# Kannibalisierung: ein Hauptkeyword pro Seite
haupt = defaultdict(list)
for p in REG['seiten']:
    k = (p.get('keyword') or {}).get('haupt')
    if k: haupt[k].append(p['url'])
for k, us in haupt.items():
    if len(us) > 1: melde('FEHLER', ', '.join(us), f'Hauptkeyword doppelt vergeben: „{k}“')
for p in REG['seiten']:
    for n in (p.get('keyword') or {}).get('neben', []):
        if n in haupt and p['url'] not in haupt[n]: melde('WARNUNG', p['url'], f'Nebenkeyword „{n}“ ist Hauptkeyword von {haupt[n][0]}')

# Interne Verlinkung: mindestens 3 Seiten verlinken jede Seite, mindestens 1 davon im Text
for url, (p, s) in seiten.items():
    if not p.get('index', True) or url == '/': continue
    alle = eingehend[url] - {url}; text = eingehend_text[url] - {url}
    if len(alle) < 3: melde('WARNUNG', url, f'nur {len(alle)} Seiten verlinken hierher (Richtwert 3)')
    if not text and p['typ'] in ('ratgeber', 'leistung'): melde('WARNUNG', url, 'kein Link aus dem Text einer anderen Seite (nur Navigation/Footer)')

# Eigenständigkeit der Leistungsseiten (5-Wort-Folgen im Haupttext)
def folgen(t):
    w = re.findall(r'[\wäöüß]+', t.lower()); return {' '.join(w[i:i + 5]) for i in range(len(w) - 4)}
lp = {u: folgen(s.plain) for u, (p, s) in seiten.items() if p['typ'] == 'leistung'}
for u, f in lp.items():
    andere = set().union(*(g for v, g in lp.items() if v != u)) if len(lp) > 1 else set()
    eigen = 100 * len(f - andere) / max(1, len(f))
    stufe = 'FEHLER' if eigen < 30 else 'WARNUNG' if eigen < 40 else 'INFO'
    melde(stufe, u, f'Eigenständiger Inhalt gegenüber den anderen Leistungsseiten: {eigen:.0f} % (Schwelle 40 %)')

# Rechtsprüfung offen, aber veröffentlicht
for p in REG['seiten']:
    if p.get('rechtspruefung') == 'offen' and p['status'] == 'live': melde('FEHLER', p['url'], 'veröffentlicht, obwohl die Rechtsprüfung offen ist')

# Sitemap
sm = (DIR / 'sitemap.xml').read_text() if (DIR / 'sitemap.xml').exists() else ''
locs = set(re.findall(r'<loc>(.*?)</loc>', sm))
for p in REG['seiten']:
    soll = p['status'] == 'live' and p.get('index', True)
    ist = BASE + p['url'] in locs
    if soll and not ist: melde('FEHLER', p['url'], 'fehlt in der Sitemap')
    if not soll and ist: melde('FEHLER', p['url'], 'steht in der Sitemap, soll aber nicht')

# Keyword-Daten
for p in REG['seiten']:
    k = (p.get('keyword') or {}).get('haupt')
    if not k or p['typ'] in ('kern', 'recht'): continue
    if k in GEMESSEN: melde('INFO', p['url'], f'Hauptkeyword gemessen: „{k}“ {GEMESSEN[k]["min"]}–{GEMESSEN[k]["max"]}/Monat')
    else: melde('INFO', p['url'], f'Hauptkeyword ungemessen: „{k}“ (im Keyword-Planer prüfen)')

# ------------------------------------------------------------ Ausgabe
reihen = {'FEHLER': 0, 'WARNUNG': 1, 'INFO': 2}
for st, u, t in sorted(meldungen, key=lambda m: (reihen[m[0]], m[1])):
    if st == 'INFO' and '--alles' not in args and 'Eigenständig' not in t: continue
    print(f'{st:8} {u}  {t}')
n = {st: sum(1 for m in meldungen if m[0] == st) for st in reihen}
print(f"\n{len(seiten)} Seiten geprüft ({DIR}): {n['FEHLER']} Fehler, {n['WARNUNG']} Warnungen, {n['INFO']} Hinweise (alle mit --alles)")
sys.exit(1 if n['FEHLER'] else 0)
