<?php
// Ladenbuch – Installation und Updates. Einmal aufrufen, danach löscht sich die Datei selbst.
// Ist das Ladenbuch noch nicht eingerichtet, fragt sie Datenbank, Passwort und PIN ab.
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
$dir = __DIR__;
$files = json_decode(base64_decode('__NUTZLAST__'), true);

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function seite(string $titel, string $inhalt): void {
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
        . '<title>' . h($titel) . '</title><style>body{font:17px/1.5 -apple-system,Helvetica,Arial,sans-serif;background:#f6f4f3;color:#1f1b1b;margin:0;padding:24px 16px}'
        . 'main{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;display:grid;gap:14px}h1{margin:0;font-size:24px}label{display:grid;gap:4px;font-weight:600;font-size:15px}'
        . 'input{font:inherit;padding:10px 12px;border:1px solid #ccc;border-radius:10px}fieldset{border:1px solid #e4dfde;border-radius:12px;display:grid;gap:12px;padding:14px}legend{font-weight:700;padding:0 6px}'
        . 'button,.btn{font:inherit;font-weight:700;background:#d7262e;color:#fff;border:0;border-radius:10px;padding:12px 18px;text-decoration:none;text-align:center}.fehler{background:#fbe7e8;color:#9b1c22;padding:12px;border-radius:10px}'
        . '.ok{background:#e2f3e8;color:#1e6b3c;padding:12px;border-radius:10px}small{color:#6b6363;font-weight:400}ol{margin:0;padding-left:22px}</style></head><body><main>'
        . '<h1>' . h($titel) . '</h1>' . $inhalt . '</main></body></html>';
    exit;
}
function dateien_schreiben(string $dir, array $files): int {
    $ok = 0;
    foreach ($files as $name => $b64) {
        $ziel = "$dir/$name";
        if (!is_dir(dirname($ziel))) mkdir(dirname($ziel), 0755, true);
        if (file_put_contents($ziel, base64_decode($b64)) !== false) $ok++;
    }
    return $ok;
}

if (PHP_VERSION_ID < 80100) {
    seite('PHP-Version zu alt', '<p class="fehler">Auf dieser Domain läuft PHP ' . h(PHP_VERSION) . '. Das Ladenbuch braucht PHP 8.1 oder neuer.</p>'
        . '<p>Im KAS unter <b>Domain</b> bei dieser Domain auf Bearbeiten tippen und bei <b>PHP-Version</b> die neueste auswählen (z. B. 8.3). Danach diese Seite neu laden.</p>');
}
$lokal = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$configDatei = dirname($dir) . '/ladenbuch-geheim/config.php';

// Schon eingerichtet: nur die Programmdateien erneuern
if (is_file($configDatei)) {
    $n = dateien_schreiben($dir, $files);
    $weg = @unlink(__FILE__);
    seite('Ladenbuch aktualisiert', '<p class="ok">Fertig ✔ ' . $n . ' Dateien erneuert.</p>'
        . '<p>Auf den Geräten erscheint beim nächsten Öffnen „Neue Version verfügbar“. Einmal auf „Jetzt aktualisieren“ tippen.</p>'
        . '<p>' . ($weg ? 'Diese Update-Datei hat sich selbst gelöscht.' : 'Bitte diese Datei jetzt im FTP löschen.') . '</p><a class="btn" href="./">Zum Ladenbuch</a>');
}

if (!$https && !$lokal) {
    seite('Erst SSL einschalten', '<p class="fehler">Diese Seite ist nicht verschlüsselt. Passwörter sollen nicht unverschlüsselt übertragen werden.</p>'
        . '<p>Bitte im KAS unter <b>SSL-Schutz</b> für diese Domain das Let\'s-Encrypt-Zertifikat einschalten und die Seite dann mit <b>https://</b> öffnen.</p>');
}

$f = fn(string $k, string $vorgabe = '') => trim((string) ($_POST[$k] ?? $vorgabe));
$fehler = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $c = ['db_host' => $f('db_host', 'localhost'), 'db_name' => $f('db_name'), 'db_user' => $f('db_user'), 'db_pass' => (string) ($_POST['db_pass'] ?? '')];
    $pw = (string) ($_POST['pw'] ?? ''); $pin = $f('pin');
    if ($c['db_name'] === '' || $c['db_user'] === '') $fehler = 'Bitte Datenbankname und Benutzer eintragen.';
    elseif (mb_strlen($pw) < 8) $fehler = 'Das Laden-Passwort braucht mindestens 8 Zeichen.';
    elseif ($pw !== (string) ($_POST['pw2'] ?? '')) $fehler = 'Die beiden Laden-Passwörter sind verschieden.';
    elseif (!preg_match('/^\d{4,8}$/', $pin)) $fehler = 'Die PIN braucht 4 bis 8 Ziffern.';
    elseif ($pin !== $f('pin2')) $fehler = 'Die beiden PINs sind verschieden.';
    elseif (!preg_match('/^\d{1,7}$/', $f('erste', '1001')) || (int) $f('erste', '1001') < 1) $fehler = 'Die erste Auftragsnummer muss eine Zahl sein.';
    if (!$fehler) {
        dateien_schreiben($dir, $files);
        require $dir . '/lib.php';
        try {
            $db = lb_pdo($c);
            lb_einrichten($db, $pw, $pin, $f('geschaeft', 'Wettbergen') ?: 'Wettbergen', (int) $f('erste', '1001'));
            lb_config_schreiben($c);
        } catch (PDOException $e) {
            $fehler = 'Die Datenbank meldet einen Fehler. Stimmen Name, Benutzer und Passwort? (' . h($e->getMessage()) . ')';
        } catch (Throwable $e) {
            $fehler = h($e->getMessage());
        }
        if (!$fehler) {
            $weg = @unlink(__FILE__);
            seite('Ladenbuch ist eingerichtet', '<p class="ok">Fertig ✔ Das Ladenbuch läuft.</p>'
                . '<p><b>So kommt das Ladenbuch auf den Home-Bildschirm des iPads:</b></p><ol>'
                . '<li>Diese Adresse in <b>Safari</b> öffnen: <b>' . h($_SERVER['HTTP_HOST'] ?? '') . '</b></li>'
                . '<li>Mit dem Laden-Passwort anmelden und dem Gerät einen Namen geben.</li>'
                . '<li>Auf das Teilen-Symbol tippen, dann <b>„Zum Home-Bildschirm“</b>.</li></ol>'
                . '<p>' . ($weg ? 'Diese Einrichtungsdatei hat sich selbst gelöscht.' : '<b>Bitte diese Datei jetzt im FTP löschen.</b>') . '</p><a class="btn" href="./">Zum Ladenbuch</a>');
        }
    }
}

seite('Ladenbuch einrichten', ($fehler ? '<p class="fehler">' . $fehler . '</p>' : '')
    . '<p>Einmalig ausfüllen. Die Zugangsdaten werden nur auf Ihrem Server gespeichert.</p>'
    . '<form method="post" autocomplete="off">'
    . '<fieldset><legend>Datenbank (aus dem KAS → Datenbanken)</legend>'
    . '<label>Datenbankname<input name="db_name" value="' . h($f('db_name')) . '" placeholder="z. B. d048c098" required></label>'
    . '<label>Benutzername<input name="db_user" value="' . h($f('db_user')) . '" placeholder="meist gleich wie der Datenbankname" required></label>'
    . '<label>Datenbank-Passwort<input name="db_pass" type="password" required></label>'
    . '<label>Server <small>(nur ändern, wenn ALL-INKL etwas anderes angibt)</small><input name="db_host" value="' . h($f('db_host', 'localhost')) . '"></label></fieldset>'
    . '<fieldset><legend>Anmeldung im Laden</legend>'
    . '<label>Laden-Passwort <small>(für alle Geräte im Laden, mindestens 8 Zeichen)</small><input name="pw" type="password" minlength="8" required autocomplete="new-password"></label>'
    . '<label>Laden-Passwort wiederholen<input name="pw2" type="password" minlength="8" required autocomplete="new-password"></label>'
    . '<label>Leitungs-PIN <small>(nur für Sie: Umsatz und Einstellungen, 4–8 Ziffern)</small><input name="pin" type="password" inputmode="numeric" pattern="\d{4,8}" required></label>'
    . '<label>PIN wiederholen<input name="pin2" type="password" inputmode="numeric" pattern="\d{4,8}" required></label></fieldset>'
    . '<fieldset><legend>Geschäft</legend>'
    . '<label>Name des Geschäfts<input name="geschaeft" value="' . h($f('geschaeft', 'Wettbergen')) . '"></label>'
    . '<label>Erste Auftragsnummer <small>(Aufträge heißen dann W-1001, W-1002 …)</small><input name="erste" inputmode="numeric" value="' . h($f('erste', '1001')) . '"></label></fieldset>'
    . '<button type="submit">Ladenbuch einrichten</button></form>');
