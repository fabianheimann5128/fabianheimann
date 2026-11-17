# Praxel – Projektstand und Arbeitsregeln

Praxel ist die inhabergeführte Agentur von Fabian Heimann (Berlin): Webseiten, Automatisierungen und
Software für Arztpraxen und Kliniken. Dieses Repository enthält die Webseite.

## Live

- Domain: https://praxel-deutschland.de/ (Hostinger, Konto-Benutzer `u161214364`)
- Auslieferung: Hostinger zieht den Branch `claude/gallant-darwin-9ud3a2` automatisch.
  **Jeder Push auf diesen Branch geht sofort live.**
- Die Seite liegt in `website/`. Die `.htaccess` im Repository-Wurzelverzeichnis bedient sie unter der
  Hauptadresse und sperrt `.git`, `README.md` und `.gitignore`.

## Aufbau

- `website/index.html` – Hauptseite (dunkel, „Der rote Faden“), nutzt `css/style.css`, `css/landing.css`, `js/main.js`
- `website/webseite-fuer-zahnaerzte/index.html` – Fachseite für Zahnarztpraxen, nutzt zusätzlich `js/landing.js`
- `website/js/landing.js` – abgeleitet aus `main.js` (gleiche Faden-, Seil-, Knoten- und Formularlogik,
  ohne waagerechte Strecke und Wort-für-Wort-Text, dafür Chatverlauf und mitlaufender Handy-Button).
  Änderungen an gemeinsamer Logik in beiden Dateien nachziehen.
- `website/js/consent.js` – Einwilligung und Google-Ads-Messung
- `website/anfrage.php` – nimmt Formularanfragen an, mailt an `fabian@praxel-deutschland.de`
- `website/impressum.html`, `website/datenschutz.html`, `robots.txt`, `sitemap.xml`
- `website/ratgeber/` – Ratgeber für Inhaber und Praxismanager von Arzt- und Zahnarztpraxen (nicht für Patienten).
  Nutzt zusätzlich `css/ratgeber.css` und `js/ratgeber.js` (Faden-, Navigations- und Formularlogik aus `landing.js`).
- `website/webseite-fuer-<branche>/` – Branchen-Leistungsseiten im Gerüst der Zahnarzt-Seite (nutzen `landing.js`).
- **`seo/` – SEO-System (siehe `seo/LIESMICH.md`).** Ratgeber, Branchenseiten (außer Zahnarzt), Ratgeber-Übersicht und
  `sitemap.xml` werden NUR über `python3 seo/build.py` erzeugt, nie von Hand bearbeitet. Register aller Seiten mit
  Keyword-Zuordnung: `seo/seiten.json`. Keyword-Daten: `seo/keyword-recherche.json`. Vor jedem Push
  `python3 seo/pruefen.py` (muss ohne Fehler durchlaufen). Vorschau mit Entwürfen: `seo/build.py --vorschau ORDNER`.
  Vorschaubilder: `node seo/og.js` → `website/img/og/`.
- `entwuerfe/` – unveröffentlichte Seiten, von `seo/build.py` erzeugt (wird nicht ausgeliefert).
- CSS und JS werden mit `?v=NN` eingebunden. Bei Änderungen die Nummer erhöhen: `version` in `seo/seiten.json`
  (erzeugte Seiten) und `?v=` in den handgepflegten Seiten (index, Zahnarzt, Impressum, Datenschutz).

## Entscheidungen von Fabian

- Zielgruppe: Gesundheitsbereich. Branchenseiten nach dem Muster `webseite-fuer-…/` (gleicher Aufbau, eigene Texte,
  mindestens 40 % eigenständig): Zahnärzte (live, Anzeigenziel), Arztpraxen, Hausärzte, MVZ, Physiotherapie,
  Apotheken, Schönheitskliniken, Privatkliniken (Entwürfe vom 17.11.2026, auf Fabians Wunsch). Apotheken ist ein
  Test-Segment: keine Apotheken-Inhalte im Praxis-Ratgeber.
- Angebot: Praxis nennt den Link zur jetzigen Webseite und die WhatsApp-Nummer, erhält innerhalb von
  drei Tagen kostenlos einen Entwurf der neuen Startseite; Gespräch nur bei Gefallen, unverbindlich.
- Kontakt läuft über WhatsApp (+49 152 28064893), nicht über E-Mail-Formulare.
- Farbschema: dunkel mit leuchtendem rotem Faden, helle Abschnitte dazwischen. Schrift: Funnel Display /
  Funnel Sans, lokal eingebunden. Kein Wechsel in Serifenschrift.
- Logo: Wortmarke „Praxel“, das x als roter Kreuzstich. Kein einzelnes Buchstaben-Signet.
- Ansprache „Sie“, Ich-Perspektive, kein erfundenes Team.
- Keine erfundenen Referenzen, Zahlen, Testimonials, Abschlüsse oder Erfahrungsjahre.
  OLYMP nicht als Referenz verwenden. Keine eingebettete Beispiel-Praxisseite.
- Arbeitsweise KI-gestützt darf genannt werden.

## Ratgeber und digitale Produkte (Strategie, freigegeben am 13.11.2026)

- Vier Themen: Praxis-Webseite, Patientengewinnung, Personalsuche, Empfang und Termine. Adressen nach dem Muster
  `/ratgeber/<thema>/<beitrag>/`, Übersichtsseiten je Thema unter `/ratgeber/<thema>/` (kommen ab Welle 2).
- Jeder Beitrag: mittig genau EIN Angebot (Entwurf mit Formular, Selbstcheck oder Produkt), am Ende immer das
  Formular für den kostenlosen Entwurf. Der Entwurf bleibt Hauptziel.
- Die Fachseite `/webseite-fuer-zahnaerzte/` bleibt frei von Ratgeber- und Produktlinks (Ziel der Anzeigen, eine
  einzige Conversion). Der Ratgeber ist von der Hauptseite aus verlinkt.
- Seit 17.11.2026 richtet sich der Ratgeber an Arzt- UND Zahnarztpraxen (MFA und ZFA), weil die gemessene
  Nachfrage überwiegend „Arztpraxis“ nennt. Neue Adressen gab es dafür nicht.
- Welle 1 (live): Übersicht, Webseiten-Selbstcheck (offen, ohne E-Mail-Abfrage), Kosten, Relaunch, Karriereseite.
- Welle 2: Übersichtsseite Praxis-Webseite („Was eine gute Zahnarzt-Webseite leisten muss“), Übersichtsseite
  Personalsuche („ZFA finden“), Foto-Leitfaden (kostenlos als Beitrag). Brotkrumen-Zwischenstufen sind verlinkt.
- Footer (seit Welle 2): benannte Spalten (`.foot__cols`, Stil in `style.css`). Ratgeber-Seiten und Hauptseite:
  Angebot / Ratgeber / Praxel. Fachseite: „Auf dieser Seite“ / Praxel, bewusst ohne Ratgeber-Spalte.
- Welle 3: Neue Patienten gewinnen (Übersicht), Google-Bewertungen, Google-Unternehmensprofil. Fertige Entwürfe
  liegen unveröffentlicht in `entwuerfe/welle-3/` (siehe `entwuerfe/LIESMICH.md`); rechtliche Durchsicht steht aus.
  Welle 4: Online-Terminvergabe (Übersicht), Telefon entlasten, dazu ZFA-Stellenanzeige: live seit 16.11.2026
  (Themengruppe „Empfang und Termine“ unter `/ratgeber/online-terminvergabe/`). Welle 5: Pflichtangaben, Werberecht
  (Rechtsbeiträge vorher anwaltlich gegenlesen lassen; Pflichtangaben erst nach Prüfung der eigenen Datenschutzerklärung).
- Produkte: zuerst ZFA-Recruiting-Kit (79–99 €, Bruttopreis anzeigen, Verkauf nur an Praxen, Start per Bestellung auf
  Rechnung). Später, erst bei Besuchern: Google-Kit (Unternehmensprofil + Bewertungen), Empfang entlasten
  (zahnarztspezifisch), Leistungstexte-Baukasten zuletzt. Kein Newsletter-Produkt. Noch kein Shop, keine Bezahlfunktion.
  Rechts- und Steuerfragen klärt Fabian vor dem Verkauf mit Anwalt und Steuerberater.
- Vor jedem ersten Push einer neuen Seite: Vorschau (Desktop und Handy) zeigen und auf Fabians OK warten.
- Kein Keyword-Tool vorhanden, keine Suchvolumina erfinden. Google Search Console ist seit 13.11.2026 für die Domain
  verifiziert, die Sitemap ist eingereicht (10 Seiten erkannt).
- Von X und Pinterest wurde abgeraten. Fabian hat Instagram und YouTube angelegt (16.11.2026).

## Messung und Einwilligung (seit 17.11.2026)

- Alles steckt in `website/js/consent.js` (eingebunden auf jeder Seite). Kein Google Tag Manager.
- GA4: Mess-ID `G-QDZQZ22VJX` (Property „Praxel Deutschland“, Stream „Praxel Deutschland – Website“).
  Google Ads: `AW-18573039016`. Beide über ein gemeinsames `gtag.js`, das erst nach Einwilligung lädt.
- Einwilligung getrennt nach „Statistik“ (GA4) und „Anzeigenmessung“ (Ads). Gespeichert in `localStorage`
  unter `praxel-einwilligung-v2` als `{v:2, stat, ads, datum}`. Der alte Schlüssel `praxel-einwilligung` (nur Ads)
  wird ignoriert und gelöscht, Besucher werden neu gefragt. Ändern/Widerruf über jedes `[data-consent-open]`.
- Consent Mode nur als Grundzustand „denied“; kein Laden vor Einwilligung (keine cookielosen Pings).
  `ad_personalization` bleibt immer „denied“, Google-Signale und Werbepersonalisierung sind in der GA4-Konfiguration aus.
  Widerruf: `ga-disable-G-…`, Consent-Update „denied“, Cookies `_ga*`, `_gcl_*` werden gelöscht.
- Vor dem Laden entfernt `consent.js` fremde Abfrageparameter aus der Adresszeile (erlaubt: `utm_*`, `gclid`,
  `gbraid`, `wbraid`), weil GA4 die Adresse direkt aus der Adresszeile liest; `page_location` in der Konfiguration
  wurde für den ersten Seitenaufruf ignoriert (Test 17.11.2026).
- Ereignisse (nur GA4, `send_to` gesetzt): `generate_lead` (Formular vom Server bestätigt), `whatsapp_click`
  (Klick auf `a[href^="https://wa.me/"]`), `lead_form_error` (`error_type` = network | server | rejected).
  Parameter: `contact_method` (form | whatsapp), `contact_location` (hero | article_offer | closing_cta | Abschnitts-ID).
  Ads-Conversions „Anfrage Formular“ und „WhatsApp Klick“ laufen parallel nur mit Einwilligung „Anzeigenmessung“.
- Formulare (`main.js`, `landing.js`, `ratgeber.js`): `pxTrack('form', form)` nur nach `ok:true` vom Server.
  Bei Fehlschlag `pxTrack('form_error', form, art, weiter)` und danach automatische Weiterleitung zu WhatsApp; diese
  Weiterleitung zählt NICHT als WhatsApp-Klick (bis 17.11.2026 wurde sie fälschlich als Ads-Conversion gezählt).
- Tests: Playwright-Suite mit abgefangenen Google-Anfragen (keine Testdaten bei Google). Netzwerk der Umgebung
  erlaubt dafür `www.googletagmanager.com`.

## Google Ads

- Konto-ID des Tags: `AW-18573039016`
- Conversions: „Anfrage Formular“ (`…/wDeyCIu-3LcdEKirqJhF`), „WhatsApp Klick“ (`…/WqHlCI6-3LcdEKirqJhF`),
  beide primär, je 1 €, Zielvorhaben als Kontostandard.
- Das Tag lädt erst nach Zustimmung im Einwilligungsdialog. Tag Assistant hat beide Conversions bestätigt.
- Geplante Kampagne: „Praxel | Suche | Zahnarzt-Webseite | DE“, 15 €/Tag, Klicks maximieren mit Limit 3 €,
  nur Google Suche, Deutschland (Präsenz), Mo–Fr 7–20 Uhr, Wortgruppen- und genau passende Keywords.
- Stand 13.11.2026: Kampagne liegt lokal im Google Ads Editor, noch nicht hochgeladen. Der Editor meldet für
  die Anzeige „Nicht funktionierendes Ziel“. Vermutung: gespeicherter Fehlabruf von vor dem Livegang der
  Domain (registriert und online am selben Vormittag). Serverseitig keine Fehler, Googles Prüftool erreicht
  die Seite. Plan: einen Tag warten, Anzeige im Editor neu importieren, erneut prüfen. Bleibt der Fehler,
  Hostinger-CDN testweise abschalten (nur mit Fabians Freigabe).
- Vor dem Upload: „kosten“ und „preise“ aus den ausschließenden Keywords entfernen, Standortoption „Präsenz“ setzen.
- Zwei alte Entwürfe im Webkonto bleiben auf Fabians Wunsch unangetastet.

## Offen

- Erledigt am 13.11.2026: www-Weiterleitung (301) in der `.htaccess`, Kontrast der roten Abschluss-Überschrift
  (dunkle Schrift mit heller Unterstreichung), Logo-Beschriftung (`.sr-only` + `.nav__word`), Beschreibung und
  strukturierte Daten der Hauptseite. Lighthouse mobil: Ratgeber-Beitrag Barrierefreiheit 100, SEO überall 100.
- Erledigt am 16.11.2026: restliche Lighthouse-Hinweise (Akzentrot auf hellem Grund jetzt `#e8300f`, `.phone__note`
  heller, Faden-Knoten liegt im letzten `li` statt direkt im `ol.steps`), Seitentitel gekürzt (alle höchstens 60 Zeichen).
- Soziale Profile (seit 16.11.2026): Instagram `praxel.deutschland`, YouTube `@PraxelDeutschland`. Verlinkt im Footer
  (`.foot__social`) auf Hauptseite und Ratgeber-Seiten und als `sameAs` in den strukturierten Daten der Hauptseite.
  Auf der Fachseite bewusst nicht (Ziel der Anzeigen).
- Geplanter Webseiten-Preis laut Fabian: 999 € (Stand 13.11.2026, noch nicht veröffentlicht). Texte dürfen nicht
  nahelegen, sein Preis liege im vierstelligen Bereich. Keine Aussagen zu Umsatzsteuer oder Leistungsumfang erfinden.
- Datenschutzerklärung ist ein ungeprüfter Entwurf, rechtliche Prüfung steht aus.
- Echte Projektbeispiele und Vorher-Nachher folgen, sobald erste Entwürfe für Praxen vorliegen.
- Weitere Fachseiten (Vorschlag: Hausärzte als nächste).
- Hinweis an Fabian bereits gegeben: unaufgeforderte Werbe-E-Mails an Praxen sind in Deutschland rechtlich riskant.
