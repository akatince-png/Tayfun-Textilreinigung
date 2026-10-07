# Tayfun · feine Textilpflege

Markenauftritt und Website für Tayfun Textilpflege, An der Kirche 10, 30457 Hannover-Wettbergen.

## Inhalt

| Ordner | Was drin ist |
|---|---|
| `marke/png/` | Logos als PNG mit transparentem Hintergrund, hochauflösend. Für Google, Instagram, Word, Canva. |
| `marke/pdf/` | Logos als Vektor-PDF. Für Druckerei, Schildermacher und Fahrzeugbeschriftung. |
| `marke/svg/` | Logos als SVG, Texte in Pfade umgewandelt. Für Website und Grafikprogramme. |
| `marke/schriften/` | Cormorant Garamond und Jost (SIL Open Font License, frei nutzbar). |
| `marke/_werkzeug/` | Skript, das alle Logodateien neu erzeugt. |
| `website/` | Die Website als statische Dateien, ohne Baukasten. Läuft auf jedem Webspace. |

## Welches Logo wofür

| Datei | Einsatz |
|---|---|
| `siegel-voll` | Großes Siegel mit „Familienunternehmen seit 2001 · in zweiter Generation“. Ab etwa 4 cm Breite. |
| `siegel-kurz` | Siegel ohne Herkunftszeile. Profilbild Google/Instagram, Bügel-Anhänger, Stempel. |
| `siegel-mini` | Nur das T im Sechseck. App-Icon, Favicon, sehr kleine Flächen. |
| `etikett` | Großer Schriftzug. Lieferauto, Schaufenster, Flyer-Kopf. |
| `kombination` | Siegel und Etikett nebeneinander. Ladenschild, Briefkopf, Google-Titelbild. |

Jedes Logo gibt es in `dunkel` (auf Nachtblau) und `hell` (transparent, für helle Untergründe).

**Farben:** Nachtblau `#1B2A41` · Creme `#F2ECE1` · Rot auf Blau `#E0443E` · Rot auf Hell `#C3262E`

**Wichtig:** „seit 2001“ beschreibt die Familie, nicht diesen Laden. Nie „Gegründet 2001“ oder „Tayfun seit 2001“ schreiben.

## Website: vor dem Livegang

- [ ] Preise, Leistungen und Liefergebiet in `website/index.html` und den Unterseiten prüfen
- [ ] Impressum: Inhaber, Rechtsform, E-Mail, ggf. USt-IdNr. eintragen (`website/impressum.html`, Platzhalter sind gelb markiert)
- [ ] Datenschutzerklärung prüfen lassen oder mit einem Generator erstellen
- [ ] Domain kaufen und in `website/_vorlagen/seiten.py` sowie `index.html` (canonical, JSON-LD) eintragen, dann `python3 website/_vorlagen/seiten.py`
- [ ] Hosting einrichten (z. B. Netlify, Cloudflare Pages oder Webspace beim Domain-Anbieter)
- [ ] Anfrageformular anbinden: Empfänger-Adresse als `data-endpoint` am `<form id="anfrage">` eintragen
- [ ] Gelben Vorschau-Hinweis oben auf allen Seiten entfernen
- [ ] Website im Google-Unternehmensprofil eintragen und bei der Google Search Console anmelden

## Dateien neu erzeugen

```bash
# Logos (in marke/_werkzeug)
npm install
NODE_PATH=$(npm root -g) node logos.js

# Unterseiten, sitemap.xml, robots.txt
python3 website/_vorlagen/seiten.py
```
