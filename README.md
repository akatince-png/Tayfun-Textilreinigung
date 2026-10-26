# Tayfun Textilpflege

Markenauftritt und Website für Tayfun Textilpflege, An der Kirche 10, 30457 Hannover-Wettbergen.

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
