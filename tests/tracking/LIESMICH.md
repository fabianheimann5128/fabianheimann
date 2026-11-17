# Test der Einwilligung und Messung

Prüft `website/js/consent.js` und die Formularlogik mit dem echten Google-Skript in Chromium (Playwright).
Jede Anfrage an Google-Server wird mitgeschrieben und im Browser beendet, bevor sie Google erreicht. Die
Formularantworten von `anfrage.php` werden simuliert. Es entstehen also weder Daten in Analytics/Ads noch E-Mails.

Voraussetzung: Playwright, Zugriff auf `www.googletagmanager.com`.

Lokal (Seite aus `website/` bereitstellen):

    cd website && python3 -m http.server 8770
    node tests/tracking/tests.js

Gegen die Live-Seite:

    BASE=https://praxel-deutschland.de node tests/tracking/tests.js

Hinweis: GA4 bündelt Ereignisse und sendet sie nach etwa fünf Sekunden; die Tests warten entsprechend.
