# SEO-System von Praxel

Alle Ratgeber-Beiträge, Branchen-Leistungsseiten, die Ratgeber-Übersicht und die Sitemap entstehen aus
diesem Ordner. Ziel: Seiten, die für Menschen geschrieben sind und für Google sauber aufgebaut, ohne
doppelte Inhalte und ohne Seiten, die nur für Suchbegriffe existieren.

## Bausteine

| Datei | Zweck |
|---|---|
| `seiten.json` | Register aller Seiten: Adresse, Typ, Status (`live`/`entwurf`), Cluster, Hauptkeyword, Titel, Beschreibung, Verlinkung. Einzige Quelle für Metadaten. |
| `keyword-recherche.json` | Gemessene Keywords (Keyword-Planer, mit Quelle und Datum) und ungemessene Kandidaten je Seite. Keine Zahlen erfinden. |
| `inhalte/ratgeber/*.html` | Text der Beiträge. `{{OFFER}}` markiert die Stelle für das Angebot in der Mitte. Fragen am Ende als `<h3 class="q">` + ein `<p>`. |
| `inhalte/leistungen/*.json` | Inhalte der Branchenseiten (Probleme, Prüfpunkte, Fachwissen, Fragen …). |
| `build.py` | Erzeugt die Seiten. Handgepflegt bleiben `index.html`, die Zahnarzt-Seite, Impressum, Datenschutz. |
| `pruefen.py` | Prüft alle Regeln unten und bricht bei Fehlern ab. |
| `og.js` | Erzeugt Vorschaubilder fürs Teilen aus `og_bild` im Register. |
| `bausteine/social.html` | Instagram- und YouTube-Links für den Footer. |

## Ablauf für eine neue Seite

1. **Keyword prüfen:** Steht der Begriff in `keyword-recherche.json`? Wenn nicht, als ungemessen eintragen und
   möglichst im Keyword-Planer messen. Hauptkeyword darf noch keiner anderen Seite gehören.
2. **Suchabsicht prüfen:** Sucht hier ein Praxisinhaber oder eine Leitung? Patienten- oder Jobsuchende sind nicht die Zielgruppe.
3. **Eintrag in `seiten.json`** mit `status: "entwurf"`, Titel (30–60 Zeichen), Beschreibung (120–160, kein Abklatsch
   des Titels), H1, Einleitung, Cluster, `more` (drei Beiträge zum Weiterlesen), `og` und `og_bild`.
4. **Text schreiben** in `inhalte/…`: Hauptkeyword natürlich in Titel, H1 und am Anfang; Ich-Perspektive, „Sie“,
   keine erfundenen Zahlen, Rechtsthemen mit Hinweis „keine Rechtsberatung“. Mindestens ein Link aus dem Text auf
   die Übersichtsseite des Themas und einer auf eine Leistungsseite.
5. **Bauen und prüfen:**
   ```
   node seo/og.js
   python3 seo/build.py --vorschau /pfad/zur/vorschau
   python3 seo/pruefen.py --dir /pfad/zur/vorschau
   ```
6. **Vorschau an Fabian** (Desktop und Handy), auf OK warten.
7. **Veröffentlichen:** Status auf `live`, bei geänderten Seiten `geaendert` setzen, dann
   `python3 seo/build.py && python3 seo/pruefen.py` (muss ohne Fehler durchlaufen), committen, pushen,
   live prüfen. Bei geänderten CSS/JS die `version` in `seiten.json` und `?v=` in den handgepflegten Seiten erhöhen.

## Was die Prüfung sicherstellt

- Titel 30–60 Zeichen, Beschreibung 120–160 Zeichen, beide eindeutig; Beschreibung wiederholt nicht den Titel
- genau eine H1, keine übersprungene Überschriftenebene, alle Bilder mit `alt`
- `canonical` = eigene Adresse, kein `noindex`, Open-Graph-Angaben und Vorschaubild vorhanden
- strukturierte Daten gültig, jede FAQ-Frage auch sichtbar auf der Seite
- Hauptkeyword (Wortstämme, auch in Komposita) in Titel, H1 und am Anfang des Textes
- keine Kannibalisierung: jedes Hauptkeyword nur einer Seite zugeordnet
- jede Seite von mindestens drei anderen Seiten verlinkt, mindestens einmal aus dem Text
- keine internen Links ins Leere, keine fehlenden Sprungziele
- Branchenseiten untereinander zu mindestens 40 % eigenständig (unter 30 % Fehler), Grundlage: Googles Regeln gegen
  massenhaft erzeugte, gleichförmige Seiten
- Richtwerte für den Umfang: Leistungsseite 800 Wörter, Beitrag 900
- Sitemap enthält genau die veröffentlichten, indexierbaren Seiten
- nichts mit offener Rechtsprüfung ist veröffentlicht

Sicherung im Generator: Beim Veröffentlichen werden Links auf Seiten, die noch Entwurf sind, automatisch zu
normalem Text. Ein veröffentlichter Beitrag verlinkt so nie ins Leere.

Die Schwellen sind Faustregeln aus der Praxis, keine Google-Signale. Google gibt für Wortzahl und Keyword-Dichte
keine Werte vor. Maßgeblich für Erfolg sind die Daten aus der Search Console.

## Quellen für die Regeln

Ausgewertet wurden die Anleitungen aus dem offenen Paket [claude-seo](https://github.com/AgriciDaniel/claude-seo)
(Abschnitte Programmatic SEO, Content, Page, Schema, Cluster) und [seo-skill](https://github.com/aevans-eng/seo-skill)
für statische Seiten. Übernommen wurden nur die Regeln, nicht der Code.

## Auswertung nach der Veröffentlichung

- Search Console: Leistung → Suchanfragen je Seite, nach 4–8 Wochen. Begriffe, für die eine Seite erscheint, aber
  kaum geklickt wird, sind Kandidaten für bessere Titel und Beschreibungen.
- GA4: `generate_lead` und `whatsapp_click` nach Seite und `contact_location`.
- Ungemessene Keywords aus `keyword-recherche.json` im Keyword-Planer messen und das Register nachziehen.
