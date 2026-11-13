<?php
/**
 * Nimmt Anfragen von den Formularen entgegen (Link zur Webseite + E-Mail-Adresse)
 * und schickt sie als E-Mail an Praxel. Antwortet mit JSON.
 */
declare(strict_types=1);

$empfaenger = 'fabian@praxel-deutschland.de';
$absender   = 'fabian@praxel-deutschland.de';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, array $daten): never {
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    antwort(405, ['ok' => false, 'fehler' => 'Nur POST ist erlaubt.']);
}

$roh = file_get_contents('php://input', false, null, 0, 20000) ?: '';
$daten = json_decode($roh, true);
if (!is_array($daten)) {
    $daten = $_POST;
}

// Eine Zeile, ohne Steuerzeichen: schützt vor eingeschleusten Mail-Kopfzeilen
$feld = static function (string $name, int $max) use ($daten): string {
    $wert = is_string($daten[$name] ?? null) ? $daten[$name] : '';
    $wert = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $wert) ?? '';
    return mb_substr(trim($wert), 0, $max);
};
$text = static function (string $name, int $max) use ($daten): string {
    $wert = is_string($daten[$name] ?? null) ? $daten[$name] : '';
    $wert = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', ' ', $wert) ?? '';
    return mb_substr(trim($wert), 0, $max);
};

// Unsichtbares Feld: füllt es jemand aus, war es ein Bot. Wir tun so, als wäre alles gut.
if ($feld('website2', 200) !== '') {
    antwort(200, ['ok' => true]);
}

$link      = $feld('link', 300);
$email     = $feld('email', 200);
$nachricht = $text('nachricht', 2000);
$seite     = $feld('seite', 200);

if ($link === '' || !preg_match('/^[^\s@]+\.[^\s@]{2,}/u', preg_replace('~^https?://~i', '', $link) ?? '')) {
    antwort(422, ['ok' => false, 'fehler' => 'Bitte tragen Sie den Link zu Ihrer Webseite ein.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort(422, ['ok' => false, 'fehler' => 'Bitte tragen Sie eine gültige E-Mail-Adresse ein.']);
}

$betreff = 'Neue Anfrage: Entwurf für ' . $link;
$inhalt  = "Neue Anfrage über die Webseite\n\n"
         . "Link zur Webseite: {$link}\n"
         . "E-Mail-Adresse:    {$email}\n"
         . "Seite:             {$seite}\n"
         . "Zeitpunkt:         " . date('d.m.Y H:i') . "\n\n"
         . ($nachricht !== '' ? "Nachricht:\n{$nachricht}\n" : "Keine Nachricht.\n");
$kopf = [
    'From'         => "Praxel Webseite <{$absender}>",
    'Reply-To'     => $email,
    'Content-Type' => 'text/plain; charset=utf-8',
];

$gesendet = @mail($empfaenger, '=?UTF-8?B?' . base64_encode($betreff) . '?=', $inhalt, $kopf);
if (!$gesendet) {
    antwort(500, ['ok' => false, 'fehler' => 'Die Anfrage konnte nicht gesendet werden.']);
}
antwort(200, ['ok' => true]);
