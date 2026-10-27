<?php
// Ladenbuch – gemeinsame Funktionen für api.php und das Installationsprogramm.
declare(strict_types=1);

const LB_SCHEMA = 2;
const LB_VERSION = '1.5.0';

// Zugangsdaten liegen außerhalb des Web-Ordners der Domain
function lb_geheim_ordner(): string { return dirname(__DIR__) . '/ladenbuch-geheim'; }
function lb_config_datei(): string { return lb_geheim_ordner() . '/config.php'; }

function lb_config(): ?array {
    $f = lb_config_datei();
    if (!is_file($f)) return null;
    $c = require $f;
    return is_array($c) ? $c : null;
}

function lb_pdo(array $c): PDO {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $c['db_host'], $c['db_name']);
    return new PDO($dsn, $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function lb_schema(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS lb_einstellungen (name VARCHAR(64) PRIMARY KEY, wert TEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS lb_zaehler (name VARCHAR(64) PRIMARY KEY, wert BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS lb_daten (
        typ VARCHAR(16) NOT NULL, id VARCHAR(32) NOT NULL, rev BIGINT NOT NULL, daten MEDIUMTEXT NOT NULL,
        geaendert DATETIME NOT NULL, geraet VARCHAR(64) NOT NULL DEFAULT '',
        PRIMARY KEY (typ, id), KEY rev (rev)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS lb_verlauf (
        nr BIGINT AUTO_INCREMENT PRIMARY KEY, zeit DATETIME NOT NULL, geraet VARCHAR(64) NOT NULL,
        typ VARCHAR(16) NOT NULL, id VARCHAR(32) NOT NULL, daten MEDIUMTEXT NOT NULL, KEY zeit (zeit), KEY ding (typ, id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS lb_sitzungen (
        token_hash CHAR(64) PRIMARY KEY, geraet VARCHAR(64) NOT NULL, erstellt DATETIME NOT NULL,
        zuletzt DATETIME NOT NULL, leitung_bis DATETIME NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS lb_sperre (schluessel VARCHAR(100) PRIMARY KEY, versuche INT NOT NULL, bis DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    // Schema 2: Zugangsart je Gerät (laden oder werkstatt)
    $db->exec("ALTER TABLE lb_sitzungen ADD COLUMN IF NOT EXISTS rolle VARCHAR(16) NOT NULL DEFAULT 'laden'");
    lb_setze($db, 'schema', (string) LB_SCHEMA);
}

function lb_wert(PDO $db, string $name, ?string $vorgabe = null): ?string {
    $s = $db->prepare('SELECT wert FROM lb_einstellungen WHERE name = ?');
    $s->execute([$name]);
    $w = $s->fetchColumn();
    return $w === false ? $vorgabe : (string) $w;
}

function lb_setze(PDO $db, string $name, string $wert): void {
    $db->prepare('INSERT INTO lb_einstellungen (name, wert) VALUES (?, ?) ON DUPLICATE KEY UPDATE wert = VALUES(wert)')->execute([$name, $wert]);
}

// Zähler erhöhen und den neuen Stand liefern (innerhalb einer laufenden Transaktion aufrufen)
function lb_zaehler(PDO $db, string $name, int $um = 1, int $start = 0): int {
    $s = $db->prepare('SELECT wert FROM lb_zaehler WHERE name = ? FOR UPDATE');
    $s->execute([$name]);
    $alt = $s->fetchColumn();
    if ($alt === false) {
        $neu = $start + $um;
        $db->prepare('INSERT INTO lb_zaehler (name, wert) VALUES (?, ?)')->execute([$name, $neu]);
    } else {
        $neu = (int) $alt + $um;
        $db->prepare('UPDATE lb_zaehler SET wert = ? WHERE name = ?')->execute([$neu, $name]);
    }
    return $neu;
}

// Erste Einrichtung: Passwort, PIN, Geschäft und erste Auftragsnummer
function lb_einrichten(PDO $db, string $passwort, string $pin, string $geschaeft, int $ersteNummer): void {
    lb_schema($db);
    lb_setze($db, 'laden_hash', password_hash($passwort, PASSWORD_DEFAULT));
    lb_setze($db, 'pin_hash', password_hash($pin, PASSWORD_DEFAULT));
    lb_setze($db, 'geschaefte', json_encode(['W' => $geschaeft], JSON_UNESCAPED_UNICODE));
    $db->beginTransaction();
    $s = $db->prepare('SELECT COUNT(*) FROM lb_zaehler WHERE name = ?');
    $s->execute(['auftrag:W']);
    if (!(int) $s->fetchColumn()) {
        $db->prepare('INSERT INTO lb_zaehler (name, wert) VALUES (?, ?)')->execute(['auftrag:W', $ersteNummer - 1]);
    }
    $db->commit();
}

function lb_config_schreiben(array $c): void {
    $ordner = lb_geheim_ordner();
    if (!is_dir($ordner) && !mkdir($ordner, 0700, true)) throw new RuntimeException('Ordner für Zugangsdaten lässt sich nicht anlegen.');
    file_put_contents($ordner . '/.htaccess', "Require all denied\n");
    $inhalt = "<?php\n// Zugangsdaten des Ladenbuchs. Nicht weitergeben.\nreturn " . var_export($c, true) . ";\n";
    if (file_put_contents(lb_config_datei(), $inhalt, LOCK_EX) === false) throw new RuntimeException('Zugangsdaten lassen sich nicht speichern.');
    @chmod(lb_config_datei(), 0600);
}
