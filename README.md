# Tayfun Textilpflege

Markenauftritt und Website für Tayfun Textilpflege, An der Kirche 10, 30457 Hannover-Wettbergen.

Dieses Repository bündelt alles rund um das Familienunternehmen: Website, Ladenbuch, Marke, Alltagshilfe, die Weiterentwicklung zur Dachmarke „FEIN“ und die Projektunterlagen.

## Wo fange ich an?

1. [**Stand**](stand/README.md): Ziel, Bausteine, offene Entscheidungen, letzte Übergabe
2. [**Projektzentrale**](stand/projektzentrale.md): „Jetzt gerade“, nächste Schritte, Logbuch
3. [**Aufgaben**](stand/aufgaben.md): alle offenen Punkte nach Dringlichkeit

## Projektunterlagen

| Thema | Datei |
|---|---|
| Website | [bereiche/01-website.md](bereiche/01-website.md) |
| Ladenbuch (Laden-App) | [bereiche/02-ladenbuch.md](bereiche/02-ladenbuch.md) |
| Kasse | [bereiche/03-kasse.md](bereiche/03-kasse.md) |
| Marketing & Social Media | [bereiche/04-marketing.md](bereiche/04-marketing.md) |
| Google & SEO | [bereiche/05-google-seo.md](bereiche/05-google-seo.md) |
| Soziale Angebote (AktivPass, § 45a SGB XI) | [bereiche/06-soziale-angebote.md](bereiche/06-soziale-angebote.md) |
| Technik & Zugänge (ohne Passwörter) | [bereiche/07-technik.md](bereiche/07-technik.md) |
| Dachmarke FEIN (Konzept, Namensprüfung, Fahrplan) | [fein/konzept-dachmarke.md](fein/konzept-dachmarke.md) |
| Alltagshilfe-App (Plan und Prototyp) | [alltagshilfe/PLAN.md](alltagshilfe/PLAN.md) |
| E-Transporter + Wallbox (Entscheidungsvorlage, Kalkulation) | [e-transporter/](e-transporter/README.md) |
| Archiv: Vorarbeiten aus Notion (Google-Profil-Texte, WhatsApp-Schnellantworten, AGB-Entwurf, Kundenbindung) | [archiv/notion-vorarbeiten/](archiv/notion-vorarbeiten/README.md) |

Das Repository ist **öffentlich**. Keine Passwörter, Zugangsdaten, Kunden- oder Gesundheitsdaten hier ablegen.

## Inhalt

| Ordner | Was drin ist |
|---|---|
| `marke/svg/` | Logos als SVG (reine Flächen, keine Schrift nötig). Für Website, Grafikprogramme, Schildermacher. |
| `marke/png/` | Logos als PNG, hochauflösend. Für Google, Word, Canva, WhatsApp-Profilbild. |
| `marke/pdf/` | Logos als Vektor-PDF. Für Druckerei und Schildermacher. |
| `marke/schriften/` | Schriften des verworfenen Entwurfs (Archiv). Die Website nutzt Archivo aus `website/fonts/`. |
| `marke/_werkzeug/` | `logo_dateien.py` schreibt die SVGs, `logo.js` erzeugt daraus PNG und PDF. |
| `marke/archiv/` | Der verworfene Entwurf „feine Textilpflege“ (Siegel in Nachtblau). Nur zur Ablage. |
| `website/` | Die Website als statische Dateien, ohne Baukasten. Läuft auf jedem Webspace. Runde Formen kommen aus `rund.css`; ohne diese Datei ist die Seite eckig. |
| `ladenbuch/` | Laden-App „TT Laden“ (siehe unten). |
| `alltagshilfe/` | Plan und klickbarer Prototyp der Alltagshilfe-App (nur Testdaten). |
| `entwuerfe/` | Unveröffentlichte Entwürfe, z. B. `fein-alltagshilfe.html` (noindex). |
| `stand/`, `bereiche/`, `fein/`, `e-transporter/`, `archiv/` | Projektunterlagen, siehe oben. |

## Logo

Nachgebaut nach dem Ladenschild An der Kirche 10: rotes Feld, Kreis mit zwei versetzten „T“, darunter
„TAYFUN“ in breiter, fetter Schrift und „TEXTILPFLEGE“ in breiter, leichter Schrift.

| Datei | Einsatz |
|---|---|
| `tayfun-logo-rot` | Weiß auf Rot, wie das Schild. Standard. |
| `tayfun-logo-auf-weiss` | Rot auf weißem Grund (transparent). Briefkopf, Flyer. |
| `tayfun-logo-negativ` | Weiß, transparent. Auf dunklen Flächen oder Fotos. |
| `tayfun-monogramm-rot` | Nur der Kreis mit den zwei T auf Rot. Profilbild, App-Symbol. |
| `tayfun-monogramm-auf-weiss` | Kreis mit den zwei T in Rot, transparent. Stempel, Bügelanhänger. |

**Farben:** Rot `#D7262E` · Weiß · Anthrazit `#2A2A2A` · Hellgrau `#F4F4F4`

**Buchstaben:** „TAYFUN“ und „TEXTILPFLEGE“ sind Buchstabe für Buchstabe nach dem Foto des Schildes gezeichnet
(breites A mit abgeflachter Spitze, Y aus senkrechtem Strich mit schrägem Arm, breite F, U und N). Die Formen stehen in
`website/_vorlagen/logo.py`. Hat der Schildermacher die Originaldatei, diese bevorzugen.

**Schrift der Website:** Archivo, breit, lokal eingebunden (SIL Open Font License).

**Wichtig:** „seit 2001“ beschreibt die Familie, nicht diesen Laden. Nie „Gegründet 2001“ oder „Tayfun seit 2001“ schreiben.

**Preise:** Die Preisliste entspricht der Stichweh-Preisliste ohne CleanCard (Stand 11/2025). Sie steht in
`website/_vorlagen/seiten.py` (Liste `PREISE`); Änderungen dort machen und die Seiten neu erzeugen.

## Website: vor dem Livegang

- [ ] Preise und Leistungen prüfen (einzelne Änderungen gegenüber der Stichweh-Liste folgen)
- [x] Impressum: Inhaber Duran Ince, Einzelunternehmen, info@tayfun-textilpflege.de eingetragen
- [x] USt-IdNr.: nicht nötig laut Steuerberater, Zeile entfernt. Falls später eine USt-IdNr. oder Wirtschafts-ID zugeteilt wird, im Impressum ergänzen
- [ ] Postfach info@tayfun-textilpflege.de bei ALL-INKL anlegen
- [ ] Datenschutzerklärung prüfen lassen oder mit einem Generator erstellen
- [ ] Domain tayfun-textilpflege.de: bei ALL-INKL bestellt, aber noch nicht registriert (Ausweis-Verifizierung des Vertragsinhabers offen)
- [ ] Website bei ALL-INKL hochladen (Inhalt von `website/` ohne `_vorlagen`, inkl. `.htaccess`), SSL „Let's Encrypt“ einschalten, AV-Vertrag abschließen. Anleitung im Übergabepaket.
- [ ] Buslinien und Fußweg bei „Mit Bus und Bahn“ prüfen (Stand Okt. 2026: Haltestelle „Wettbergen“, Stadtbahn 3 und 7, Bus 129, 130, 363)
- [ ] Anfrageformular anbinden: Empfänger-Adresse als `data-endpoint` am `<form id="anfrage">` eintragen
- [x] Gelben Vorschau-Hinweis oben auf allen Seiten entfernt (26.10.2026)
- [ ] Website im Google-Unternehmensprofil eintragen und bei der Google Search Console anmelden

## Branches

| Branch | Inhalt |
|---|---|
| `main` | Quellen: Logos, Website mit Vorlagen, diese Anleitung |
| `site` | Nur die fertigen Website-Dateien, mit eigener Domain (`CNAME`). Für den Livegang. |
| `test` | Wie `site`, aber ohne Domain und für Suchmaschinen gesperrt. Zum Ausprobieren unter akatince-png.github.io/Tayfun-Textilreinigung/ |

Änderungen an der Website in `main` unter `website/` machen, alle Seiten mit `python3 website/_vorlagen/seiten.py` erzeugen und die Dateien (ohne `_vorlagen`) nach `site` und `test` übernehmen.

## Dateien neu erzeugen

```bash
# Logos
python3 marke/_werkzeug/logo_dateien.py
cd marke/_werkzeug && NODE_PATH=$(npm root -g) node logo.js && cd ../..

# Alle Seiten, sitemap.xml, robots.txt
python3 website/_vorlagen/seiten.py
```

## Ladenbuch (TT Laden)

Auftrags-, Teile- und Kundenverwaltung für den Laden, soll unter `laden.tayfun-textilpflege.de` laufen (statt `tt-laden.de`, verworfen am 28.10.2026), als Web-App (Home-Bildschirm des iPads).

| Ordner / Datei | Was drin ist |
|---|---|
| `ladenbuch/web/` | Die App: `index.html`, `app.js`, `app.css`, Service Worker `sw.js` (offline), `api.php` + `lib.php` (Server, MySQL/MariaDB). |
| `ladenbuch/installer-vorlage.php` | Vorlage der Installations-/Update-Datei. Fragt beim ersten Aufruf Datenbank, Laden-Passwort und Leitungs-PIN ab, sonst erneuert sie nur die Dateien. Löscht sich danach selbst. |
| `ladenbuch/bau.py` | `python3 ladenbuch/bau.py` baut daraus `ladenbuch/ausgabe/ladenbuch-<zufall>.php` und `.zip` zum Hochladen. |
| `ladenbuch/test-e2e.js` | Ablauftest mit zwei Geräten (Playwright) gegen einen lokalen PHP-Server mit MariaDB. |
| `ladenbuch/prototyp/` | Der erste Prototyp mit Beispieldaten (Archiv). |

Zugangsdaten liegen nur auf dem Server in `ladenbuch-geheim/config.php` neben dem Domain-Ordner, nie im Repository.

## Abholschein für Kunden

`website/beleg.html` zeigt den digitalen Abholschein. Die Daten stehen im Link hinter dem `#` und gehen nicht an den Server.
Gebaut wird die Seite mit `python3 website/_vorlagen/schein/bau.py` aus `beleg-vorlage.html`, `schein.js` (dieselbe Zeichnung wie im Ladenbuch) und `qrcode.min.js` (MIT-Lizenz).
