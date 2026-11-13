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
- CSS und JS werden mit `?v=NN` eingebunden. Bei Änderungen die Nummer in allen HTML-Dateien erhöhen,
  sonst liefert das CDN alte Dateien.

## Entscheidungen von Fabian

- Zielgruppe: medizinischer Bereich. Start mit Zahnarztpraxen, weitere Fachrichtungen als eigene Seiten
  nach dem Muster `webseite-fuer-…/` (gleicher Aufbau, eigene Texte).
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

- Datenschutzerklärung ist ein ungeprüfter Entwurf, rechtliche Prüfung steht aus.
- Echte Projektbeispiele und Vorher-Nachher folgen, sobald erste Entwürfe für Praxen vorliegen.
- Weitere Fachseiten (Vorschlag: Hausärzte als nächste).
- Hinweis an Fabian bereits gegeben: unaufgeforderte Werbe-E-Mails an Praxen sind in Deutschland rechtlich riskant.
