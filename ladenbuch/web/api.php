<?php
// Ladenbuch-Server: Anmeldung, Abgleich von Kunden und Aufträgen, Nummernvergabe, Leitungsbereich.
// Antwortet immer mit JSON. Die Geräte halten alle Daten zusätzlich lokal, damit der Laden auch offline weiterläuft.
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

// Für die spätere iPad-App (Capacitor), die von einer eigenen Herkunft aus anfragt
$herkunft = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($herkunft, ['capacitor://localhost', 'https://localhost', 'ionic://localhost'], true)) {
    header("Access-Control-Allow-Origin: $herkunft");
    header('Access-Control-Allow-Headers: Content-Type, X-Ladenbuch-Token');
    header('Access-Control-Allow-Methods: GET, POST');
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;

function antwort(array $daten, int $code = 200): never {
    http_response_code($code);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}
function fehler(string $text, int $code = 400): never { antwort(['fehler' => $text], $code); }
function eingabe(): array {
    $roh = file_get_contents('php://input') ?: '';
    if (strlen($roh) > 8_000_000) fehler('Zu viele Daten auf einmal.', 413);
    $d = json_decode($roh, true);
    return is_array($d) ? $d : [];
}
function jetzt(): string { return gmdate('Y-m-d H:i:s'); }

// Zu viele Fehlversuche: Sperre für 15 Minuten je Gerät/IP und Art
function sperre_pruefen(PDO $db, string $art): string {
    $schluessel = $art . ':' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    $s = $db->prepare('SELECT versuche, bis FROM lb_sperre WHERE schluessel = ?');
    $s->execute([$schluessel]);
    $z = $s->fetch();
    if ($z && $z['bis'] > jetzt() && (int) $z['versuche'] >= 8) fehler('Zu viele Fehlversuche. Bitte 15 Minuten warten.', 429);
    return $schluessel;
}
function fehlversuch(PDO $db, string $schluessel): void {
    $bis = gmdate('Y-m-d H:i:s', time() + 900);
    $db->prepare('INSERT INTO lb_sperre (schluessel, versuche, bis) VALUES (?, 1, ?)
        ON DUPLICATE KEY UPDATE versuche = IF(bis < ?, 1, versuche + 1), bis = VALUES(bis)')->execute([$schluessel, $bis, jetzt()]);
}

$c = lb_config();
if (!$c) fehler('Das Ladenbuch ist noch nicht eingerichtet.', 503);
try { $db = lb_pdo($c); } catch (PDOException $e) { fehler('Datenbank nicht erreichbar.', 503); }
if ((int) lb_wert($db, 'schema', '0') < LB_SCHEMA) lb_schema($db);

$a = $_GET['a'] ?? '';
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';

if ($a === 'status') antwort(['ok' => true, 'version' => LB_VERSION]);

if ($a === 'login') {
    if (!$post) fehler('Nur POST.', 405);
    $e = eingabe();
    $k = sperre_pruefen($db, 'login');
    $geraet = mb_substr(trim((string) ($e['geraet'] ?? '')), 0, 60) ?: 'Gerät';
    // Welches Passwort passt, bestimmt den Zugang: Laden (Kasse, Theke) oder Werkstatt (nur Sammler)
    $pw = (string) ($e['passwort'] ?? '');
    $werkstatt = (string) lb_wert($db, 'werkstatt_hash', '');
    $rolle = password_verify($pw, (string) lb_wert($db, 'laden_hash', '')) ? 'laden' : ($werkstatt !== '' && password_verify($pw, $werkstatt) ? 'werkstatt' : '');
    if ($rolle === '') {
        fehlversuch($db, $k);
        fehler('Passwort stimmt nicht.', 401);
    }
    $token = bin2hex(random_bytes(32));
    $db->prepare('INSERT INTO lb_sitzungen (token_hash, geraet, erstellt, zuletzt, rolle) VALUES (?, ?, ?, ?, ?)')
        ->execute([hash('sha256', $token), $geraet, jetzt(), jetzt(), $rolle]);
    antwort(['token' => $token, 'geraet' => $geraet, 'rolle' => $rolle]);
}

// Ab hier nur mit Anmeldung
$token = (string) ($_SERVER['HTTP_X_LADENBUCH_TOKEN'] ?? '');
$s = $db->prepare('SELECT * FROM lb_sitzungen WHERE token_hash = ?');
$s->execute([hash('sha256', $token)]);
$sitzung = $token !== '' ? $s->fetch() : false;
if (!$sitzung) fehler('Bitte neu anmelden.', 401);
// Ein Jahr ohne Nutzung: Gerät muss sich neu anmelden
if ($sitzung['zuletzt'] < gmdate('Y-m-d H:i:s', time() - 365 * 86400)) {
    $db->prepare('DELETE FROM lb_sitzungen WHERE token_hash = ?')->execute([$sitzung['token_hash']]);
    fehler('Bitte neu anmelden.', 401);
}
if ($sitzung['zuletzt'] < gmdate('Y-m-d H:i:s', time() - 300)) {
    $db->prepare('UPDATE lb_sitzungen SET zuletzt = ? WHERE token_hash = ?')->execute([jetzt(), $sitzung['token_hash']]);
}
$geraet = $sitzung['geraet'];
$rolle = $sitzung['rolle'] ?? 'laden';
$werkstatt = $rolle === 'werkstatt';
// Die Werkstatt darf nur Sammler sehen und bearbeiten – keine Kunden, keine Kasse, keine Leitung
if ($werkstatt && !in_array($a, ['abmelden', 'sync', 'push', 'foto', 'kontakt'], true)) fehler('Nicht für den Werkstatt-Zugang.', 403);
$leitung = $sitzung['leitung_bis'] !== null && $sitzung['leitung_bis'] > jetzt();

switch ($a) {
    case 'abmelden':
        $db->prepare('DELETE FROM lb_sitzungen WHERE token_hash = ?')->execute([$sitzung['token_hash']]);
        antwort(['ok' => true]);

    // Alles, was sich seit dem letzten Abgleich geändert hat
    case 'sync':
        $seit = max(0, (int) ($_GET['seit'] ?? 0));
        $s = $db->prepare('SELECT typ, id, rev, daten FROM lb_daten WHERE rev > ?' . ($werkstatt ? " AND typ IN ('auftrag', 'mitarbeiter')" : '') . ' ORDER BY rev LIMIT 5000');
        $s->execute([$seit]);
        $zeilen = $s->fetchAll();
        $rev = $seit;
        $aus = [];
        foreach ($zeilen as $z) { $rev = max($rev, (int) $z['rev']); $aus[] = ['typ' => $z['typ'], 'id' => $z['id'], 'daten' => json_decode($z['daten'], true)]; }
        $s = $db->query("SELECT wert FROM lb_zaehler WHERE name = 'rev'");
        $stand = (int) ($s->fetchColumn() ?: 0);
        if (function_exists('ob_gzhandler') && str_contains($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip')) ob_start('ob_gzhandler');
        antwort(['rev' => $rev, 'daten' => $aus, 'mehr' => count($zeilen) === 5000, 'stand' => $stand,
            'geschaefte' => json_decode((string) lb_wert($db, 'geschaefte', '{"W":"Wettbergen"}'), true), 'geraet' => $geraet, 'rolle' => $rolle]);

    // Änderungen vom Gerät übernehmen; die letzte Änderung gewinnt
    case 'push':
        if (!$post) fehler('Nur POST.', 405);
        $liste = eingabe()['aenderungen'] ?? [];
        if (!is_array($liste) || count($liste) > 2000) fehler('Ungültige Änderungen.');
        $db->beginTransaction();
        $ins = $db->prepare('INSERT INTO lb_daten (typ, id, rev, daten, geaendert, geraet) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rev = VALUES(rev), daten = VALUES(daten), geaendert = VALUES(geaendert), geraet = VALUES(geraet)');
        $log = $db->prepare('INSERT INTO lb_verlauf (zeit, geraet, typ, id, daten) VALUES (?, ?, ?, ?, ?)');
        foreach ($liste as $x) {
            $typ = $x['typ'] ?? ''; $id = (string) ($x['id'] ?? '');
            if (!in_array($typ, ['kunde', 'auftrag', 'ticket', 'mitarbeiter'], true) || !preg_match('/^[A-Z0-9-]{2,32}$/', $id) || !is_array($x['daten'] ?? null)) {
                $db->rollBack(); fehler('Ungültiger Datensatz.');
            }
            if ($werkstatt) {
                // Werkstatt: nur Teile, Zählung und Bearbeitungsstand eines bestehenden Auftrags übernehmen
                if ($typ !== 'auftrag') { $db->rollBack(); fehler('Nicht für den Werkstatt-Zugang.', 403); }
                $alt = $db->prepare("SELECT daten FROM lb_daten WHERE typ = 'auftrag' AND id = ? FOR UPDATE");
                $alt->execute([$id]);
                $bisher = json_decode((string) ($alt->fetchColumn() ?: ''), true);
                if (!is_array($bisher)) { $db->rollBack(); fehler("Auftrag $id gibt es nicht.", 404); }
                foreach (['items', 'zaehlung'] as $feld) if (array_key_exists($feld, $x['daten'])) $bisher[$feld] = $x['daten'][$feld];
                if (in_array($x['daten']['status'] ?? '', ['arbeit', 'bereit', 'kundendienst'], true) && in_array($bisher['status'] ?? '', ['arbeit', 'bereit', 'kundendienst'], true)) $bisher['status'] = $x['daten']['status'];
                $x['daten'] = $bisher;
            }
            $json = json_encode($x['daten'], JSON_UNESCAPED_UNICODE);
            if (strlen($json) > 500_000) { $db->rollBack(); fehler("Datensatz $id ist zu groß."); }
            $rev = lb_zaehler($db, 'rev');
            $ins->execute([$typ, $id, $rev, $json, jetzt(), $geraet]);
            $log->execute([jetzt(), $geraet, $typ, $id, $json]);
        }
        $db->commit();
        // Verlauf nur ein halbes Jahr aufheben
        if (random_int(1, 200) === 1) $db->prepare('DELETE FROM lb_verlauf WHERE zeit < ?')->execute([gmdate('Y-m-d H:i:s', time() - 183 * 86400)]);
        antwort(['ok' => true, 'anzahl' => count($liste)]);

    // Nummernblock reservieren, damit Geräte auch offline eindeutige Nummern vergeben
    case 'nummern':
        if (!$post) fehler('Nur POST.', 405);
        $e = eingabe();
        $art = $e['art'] ?? '';
        $g = (string) ($e['geschaeft'] ?? 'W');
        $anzahl = max(1, min(500, (int) ($e['anzahl'] ?? 20)));
        if (!preg_match('/^[A-Z]{1,2}$/', $g)) fehler('Ungültiges Geschäft.');
        $start = ['auftrag' => 1000, 'teil' => 100000, 'kunde' => 1000, 'ticket' => 1000][$art] ?? null;
        if ($start === null) fehler('Ungültige Art.');
        $name = in_array($art, ['kunde', 'ticket'], true) ? $art : "$art:$g";
        $db->beginTransaction();
        $bis = lb_zaehler($db, $name, $anzahl, $start);
        $db->commit();
        antwort(['von' => $bis - $anzahl + 1, 'bis' => $bis]);

    // Fotos zu Reklamationen: liegen außerhalb des Web-Ordners und sind nur mit Anmeldung abrufbar
    case 'foto':
        if ($post) {
            $e = eingabe();
            $bild = base64_decode((string) ($e['daten'] ?? ''), true);
            if ($bild === false || strlen($bild) > 4_000_000 || !str_starts_with($bild, "\xFF\xD8\xFF")) fehler('Ungültiges Foto.');
            $id = gmdate('Y') . '-' . bin2hex(random_bytes(12));
            $ordner = lb_geheim_ordner() . '/fotos/' . substr($id, 0, 4);
            if (!is_dir($ordner) && !mkdir($ordner, 0700, true)) fehler('Fotoordner lässt sich nicht anlegen.', 500);
            if (file_put_contents("$ordner/" . substr($id, 5) . '.jpg', $bild) === false) fehler('Foto lässt sich nicht speichern.', 500);
            antwort(['id' => $id]);
        }
        $id = (string) ($_GET['id'] ?? '');
        if (!preg_match('/^(\d{4})-([0-9a-f]{24})$/', $id, $m)) fehler('Ungültiges Foto.');
        $datei = lb_geheim_ordner() . "/fotos/$m[1]/$m[2].jpg";
        if (!is_file($datei)) fehler('Foto nicht gefunden.', 404);
        header('Content-Type: image/jpeg');
        header('Cache-Control: private, max-age=31536000, immutable');
        header('Content-Length: ' . filesize($datei));
        readfile($datei);
        exit;

    // Telefonnummer zu genau einem Auftrag, z. B. für eine Rückfrage der Werkstatt per WhatsApp; jeder Abruf wird vermerkt
    case 'kontakt':
        $nr = (string) ($_GET['nr'] ?? '');
        if (!preg_match('/^[A-Z]{1,2}-\d{1,7}$/', $nr)) fehler('Ungültiger Auftrag.');
        $s = $db->prepare("SELECT daten FROM lb_daten WHERE typ = 'auftrag' AND id = ?");
        $s->execute([$nr]);
        $auftrag = json_decode((string) ($s->fetchColumn() ?: ''), true);
        if (!is_array($auftrag)) fehler('Auftrag nicht gefunden.', 404);
        $s = $db->prepare("SELECT daten FROM lb_daten WHERE typ = 'kunde' AND id = ?");
        $s->execute([(string) ($auftrag['cust'] ?? '')]);
        $kunde = json_decode((string) ($s->fetchColumn() ?: ''), true);
        $tel = is_array($kunde) ? trim((string) ($kunde['tel'] ?? '')) : '';
        if ($tel === '' || $tel === '–') fehler('Für diesen Auftrag ist keine Telefonnummer hinterlegt.', 404);
        $db->prepare('INSERT INTO lb_verlauf (zeit, geraet, typ, id, daten) VALUES (?, ?, ?, ?, ?)')
            ->execute([jetzt(), $geraet, 'kontakt', $nr, json_encode(['rolle' => $rolle], JSON_UNESCAPED_UNICODE)]);
        antwort(['tel' => $tel, 'vorname' => explode(' ', trim((string) ($kunde['name'] ?? '')))[0]]);

    case 'pin':
        if (!$post) fehler('Nur POST.', 405);
        $k = sperre_pruefen($db, 'pin');
        if (!password_verify((string) (eingabe()['pin'] ?? ''), (string) lb_wert($db, 'pin_hash', ''))) { fehlversuch($db, $k); fehler('PIN falsch.', 401); }
        $db->prepare('UPDATE lb_sitzungen SET leitung_bis = ? WHERE token_hash = ?')->execute([gmdate('Y-m-d H:i:s', time() + 3600), $sitzung['token_hash']]);
        antwort(['ok' => true]);

    case 'sperren':
        $db->prepare('UPDATE lb_sitzungen SET leitung_bis = NULL WHERE token_hash = ?')->execute([$sitzung['token_hash']]);
        antwort(['ok' => true]);
}

// Leitungsbereich: nur nach PIN
if (!$leitung) fehler('Nur für die Geschäftsleitung.', 403);

switch ($a) {
    case 'geraete':
        $s = $db->query('SELECT SUBSTRING(token_hash, 1, 12) AS id, geraet, erstellt, zuletzt, rolle FROM lb_sitzungen ORDER BY zuletzt DESC');
        antwort(['geraete' => $s->fetchAll(), 'dieses' => substr($sitzung['token_hash'], 0, 12), 'werkstatt' => lb_wert($db, 'werkstatt_hash', '') !== '']);

    case 'geraet_entfernen':
        if (!$post) fehler('Nur POST.', 405);
        $id = (string) (eingabe()['id'] ?? '');
        if (!preg_match('/^[0-9a-f]{12}$/', $id)) fehler('Ungültiges Gerät.');
        $db->prepare('DELETE FROM lb_sitzungen WHERE token_hash LIKE ?')->execute([$id . '%']);
        antwort(['ok' => true]);

    case 'passwort':
        if (!$post) fehler('Nur POST.', 405);
        $neu = (string) (eingabe()['neu'] ?? '');
        if (mb_strlen($neu) < 8) fehler('Das Passwort braucht mindestens 8 Zeichen.');
        if (password_verify($neu, (string) lb_wert($db, 'werkstatt_hash', ''))) fehler('Bitte ein anderes Passwort als für die Werkstatt wählen.');
        lb_setze($db, 'laden_hash', password_hash($neu, PASSWORD_DEFAULT));
        // Alle anderen Laden-Geräte müssen sich neu anmelden
        $db->prepare("DELETE FROM lb_sitzungen WHERE token_hash <> ? AND rolle = 'laden'")->execute([$sitzung['token_hash']]);
        antwort(['ok' => true]);

    case 'werkstatt_passwort':
        if (!$post) fehler('Nur POST.', 405);
        $neu = (string) (eingabe()['neu'] ?? '');
        if ($neu === '') {
            lb_setze($db, 'werkstatt_hash', '');
            $db->exec("DELETE FROM lb_sitzungen WHERE rolle = 'werkstatt'");
            antwort(['ok' => true, 'aus' => true]);
        }
        if (mb_strlen($neu) < 8) fehler('Das Passwort braucht mindestens 8 Zeichen.');
        if (password_verify($neu, (string) lb_wert($db, 'laden_hash', ''))) fehler('Bitte ein anderes Passwort als für den Laden wählen.');
        lb_setze($db, 'werkstatt_hash', password_hash($neu, PASSWORD_DEFAULT));
        $db->exec("DELETE FROM lb_sitzungen WHERE rolle = 'werkstatt'");
        antwort(['ok' => true]);

    case 'pin_aendern':
        if (!$post) fehler('Nur POST.', 405);
        $neu = (string) (eingabe()['neu'] ?? '');
        if (!preg_match('/^\d{4,8}$/', $neu)) fehler('Die PIN braucht 4 bis 8 Ziffern.');
        lb_setze($db, 'pin_hash', password_hash($neu, PASSWORD_DEFAULT));
        antwort(['ok' => true]);

    // Komplette Sicherung als Datei
    case 'export':
        $s = $db->query('SELECT typ, id, daten, geaendert FROM lb_daten ORDER BY typ, id');
        $alle = ['erstellt' => gmdate('c'), 'version' => LB_VERSION, 'kunden' => [], 'auftraege' => [], 'reklamationen' => [], 'mitarbeiter' => []];
        foreach ($s as $z) $alle[['kunde' => 'kunden', 'auftrag' => 'auftraege', 'ticket' => 'reklamationen', 'mitarbeiter' => 'mitarbeiter'][$z['typ']] ?? 'sonstiges'][] = json_decode($z['daten'], true);
        header('Content-Disposition: attachment; filename="ladenbuch-sicherung-' . date('Y-m-d') . '.json"');
        antwort($alle);
}
fehler('Unbekannte Aktion.', 404);
