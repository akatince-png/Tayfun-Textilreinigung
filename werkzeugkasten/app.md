# Werkzeugkasten: Alltagshilfe-App

Ausgangslage: Klickbarer Prototyp mit vier Zugängen (Büro, Begleiterin, Klient, Angehörige) in
`alltagshilfe/prototyp/`, nur Testdaten im Browser. Nächste Stufe laut Plan: echte Anmeldung je Rolle, Server und
Datenbank, Benachrichtigungen, Fahrzeiten, Abrechnung mit der Pflegekasse. Die App ist von Ladenbuch und Website
getrennt; Gesundheitsdaten (Art. 9 DSGVO) kommen nie ins Ladenbuch.

Geprüft am 17.11.2026 (Lizenz, letzte Aktivität, Sterne laut GitHub).

**Befund zur Fachsoftware:** Auf GitHub gibt es kein gepflegtes Open-Source-Projekt für Angebote nach § 45a SGB XI in
Deutschland. Die wenigen Treffer (z. B. „Offene-Pflege.de“, zuletzt 2015; „pflegedienstportal“, zuletzt 2018) sind
verwaist. Die Fachlogik (Entlastungsbetrag, Leistungsnachweis, Abrechnung) bauen wir daher selbst, auf bewährten
allgemeinen Bausteinen.

## 0. Stack-Entscheidung (offen, vor Stufe 2 treffen)

| | Option A: ALL-INKL (bisheriger Plan) | Option B: Supabase + Vercel |
|---|---|---|
| Technik | PHP + MySQL auf eigener Subdomain, wie das Ladenbuch | Postgres, Auth, Storage bei Supabase (Region Frankfurt `eu-central-1`), Oberfläche Next.js auf Vercel |
| Datenschutz | Deutscher Hoster, AVV vorhanden, keine Drittlandfrage | US-Anbieter mit EU-Region. AVV/DPA bei beiden abschließen, Unterauftragsverarbeiter und Logs prüfen. Supabase selbst: „Regionswahl allein macht nicht DSGVO-konform“ |
| Rechte je Rolle | selbst programmieren, Fehler schnell sicherheitsrelevant | Row Level Security in der Datenbank, Regeln liegen zentral |
| Arbeit vom iPad | gut (Claude baut, Upload per Installer wie beim Ladenbuch) | sehr gut (alles per Browser, Supabase- und Vercel-Connector sind verbunden) |
| Kosten (Größenordnung) | im Hosting enthalten | Supabase Pro ca. 25 $/Monat, Vercel Pro ca. 20 $/Monat für gewerbliche Nutzung (vor Entscheidung aktuell prüfen) |

Empfehlung für die Entscheidung: B, wenn mehrere Begleiterinnen und Angehörige gleichzeitig arbeiten sollen
(Stufe 3); A, solange Aka allein startet und alles bei einem deutschen Hoster bleiben soll. Die Bausteine unten sind
für B ausgelegt; wo es für A eine Entsprechung gibt, steht sie dabei. **Vor dem ersten echten Klientendatensatz:**
Datenschutz-Folgenabschätzung (Art. 35 DSGVO) und Prüfung durch eine Datenschutzberatung.

## 1. Fundament

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Supabase](https://github.com/supabase/supabase) | Postgres, Anmeldung, Dateien, Echtzeit, Edge Functions | Apache-2.0 | Option B, Kern der App | M | ★★★ |
| [supabase-js](https://github.com/supabase/supabase-js) | Zugriff aus der Oberfläche | MIT | Mit Supabase | S | ★★★ |
| [Next.js](https://github.com/vercel/next.js) | React-Framework, Server-Rendering, läuft auf Vercel | MIT | Option B, wenn Server-Logik im Frontend nötig ist | M | ★★★ |
| [Vite](https://github.com/vitejs/vite) | Schnelles Build-Werkzeug für reine Browser-Apps | MIT | Alternative zu Next.js, wenn die App ohne eigenen Server auskommt (alles über Supabase) | S | ★★★ |
| [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) | Typsichere Datenbankabfragen und Migrationen | Apache-2.0 | Nur für Server-Code; im Browser reicht supabase-js | M | ★★★ |
| [Zod](https://github.com/colinhacks/zod) | Eingaben prüfen (Formulare, API), einmal definiert für Client und Server | MIT | Immer, für jede Eingabe | S | ★★★ |
| [TanStack Query](https://github.com/TanStack/query) | Daten laden, zwischenspeichern, neu laden | MIT | Ab mehreren Ansichten auf dieselben Daten | S | ★★★ |
| [pnpm](https://github.com/pnpm/pnpm) | Paketverwaltung, sparsam und mit Lockfile | MIT | Immer statt npm | S | ★★★ |

## 2. Oberfläche (iPad-tauglich, große Schrift, barrierefrei)

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Bausteine (Dialog, Formular, Tabelle), die als eigener Code ins Projekt kopiert werden | MIT | Grundlage aller Masken | S | ★★★ |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Barrierefreie Grundbausteine (Tastatur, Screenreader) unter shadcn/ui | MIT | Kommt mit shadcn/ui | S | ★★★ |
| [React Hook Form](https://github.com/react-hook-form/react-hook-form) | Formulare mit wenig Code, zusammen mit Zod | MIT | Besuchserfassung, Klientenakte, Anfragen | S | ★★★ |
| [Lucide](https://github.com/lucide-icons/lucide) | Einheitliche Symbole | ISC | Überall | S | ★★★ |

Gestaltungsregeln: Klientenansicht mindestens 20 px Schrift und 48 px Tippflächen, Kontrast WCAG 2.2 AA, keine
reine Farbcodierung. Prüfung mit axe-core (website.md, Abschnitt 1).

## 3. Anmeldung, Rollen, Datenschutz bei Gesundheitsdaten

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| Supabase Auth (in [Supabase](https://github.com/supabase/supabase)) | Anmeldung per E-Mail-Link, Passwort, Passkey; Rollen über eigene Tabelle | Apache-2.0 | Option B | M | ★★★ |
| [Better Auth](https://github.com/better-auth/better-auth) | Vollständige Anmeldung für eigenen Server (Rollen, 2FA, Sitzungen) | MIT | Nur wenn ohne Supabase gebaut wird | M | ★★ |
| [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) | Passkeys (Face ID auf dem iPad) | MIT | Für Büro und Begleiterinnen: sicherer und einfacher als Passwörter | M | ★★ |
| [pgaudit](https://github.com/pgaudit/pgaudit) | Protokoll, wer wann welche Daten gelesen oder geändert hat | PostgreSQL-Lizenz | Bei Supabase als Erweiterung aktivierbar; zusätzlich eigene Änderungs-Tabelle per Trigger für die fachliche Historie | M | ★★★ |
| [Supabase Vault](https://github.com/supabase/vault) | Verschlüsselte Ablage von Geheimnissen (API-Schlüssel) in der Datenbank | Apache-2.0 | Für Schlüssel von SMS-, Mail- oder Abrechnungsdienst | S | ★★ |
| [OWASP ASVS](https://github.com/OWASP/ASVS) | Prüfkatalog Anwendungssicherheit | CC-BY-SA-4.0 | Stufe 1 (L1) vor Livegang, L2 für Gesundheitsdaten anstreben | M | ★★★ |
| [OWASP Cheat Sheets](https://github.com/OWASP/CheatSheetSeries) | Kurze Anleitungen (Sitzungen, Passwörter, Uploads, Logging) | CC-BY-SA-4.0 | Beim Bau jedes sicherheitsrelevanten Teils | S | ★★★ |

Pflichtregeln für Gesundheitsdaten:

- Row Level Security auf **jeder** Tabelle, Standard „verboten“. Begleiterin sieht nur ihre zugeteilten Klienten,
  Angehörige nur mit hinterlegter Vollmacht, Klient nur sich selbst.
- Datensparsamkeit: Pflegegrad, Kasse, Versichertennummer, Notfallkontakt, Besonderheiten für den Einsatz. Keine
  Diagnosen, wenn sie für den Einsatz nicht gebraucht werden.
- Keine Gesundheitsdaten in Logs, Fehlermeldungen, Push-Texten, SMS oder WhatsApp. Benachrichtigungen nur neutral
  („Neuer Termin in der App“).
- Löschfristen festlegen: Abrechnungsunterlagen nach Steuer- und Sozialrecht aufbewahren, alles andere nach
  Vertragsende löschen. Fristen mit Steuerberatung abstimmen.
- Einwilligung, Schweigepflichtentbindung und Vollmacht der Angehörigen als eigene, datierte Datensätze.

Ausgeschlossen: [supa_audit](https://github.com/supabase/supa_audit) (archiviert), [PocketBase](https://github.com/pocketbase/pocketbase)
(laut GitHub archiviert; außerdem ohne Row Level Security auf Datenbankebene).

## 4. PWA und Offline (Begleiterin beim Klienten ohne Netz)

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Serwist](https://github.com/serwist/serwist) | Service Worker für Next.js (Nachfolger von next-pwa) | MIT | Option B mit Next.js | M | ★★ |
| [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | Dasselbe für Vite | MIT | Option B mit Vite | S | ★★ |
| [Workbox](https://github.com/GoogleChrome/workbox) | Caching-Strategien unter beiden | MIT | Kommt mit Serwist bzw. vite-plugin-pwa | S | ★★★ |
| [Dexie.js](https://github.com/dexie/Dexie.js) | Lokale Datenbank im Browser (IndexedDB) | Apache-2.0 | Besuch erfassen ohne Netz, später hochladen | M | ★★★ |

iPad-Hinweise: Web-Push funktioniert unter iPadOS nur, wenn die App über „Zum Home-Bildschirm“ installiert ist.
Safari kann lokale Daten nach längerer Nichtnutzung löschen; deshalb offline nur das Nötigste und nie die einzige
Kopie. Lokale Daten auf dem Gerät nur mit Gerätesperre (Code/Face ID) erlauben.

## 5. Termine, Touren, Karten

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Schedule-X](https://github.com/schedule-x/schedule-x) | Moderner Kalender (Tag, Woche, Monat, Drag & Drop) | MIT (Kern) | Wochenplan Büro und Begleiterin | M | ★★ |
| [FullCalendar](https://github.com/fullcalendar/fullcalendar) | Bewährter Kalender | MIT (Kern; Ressourcen-Ansicht kostenpflichtig) | Alternative zu Schedule-X | M | ★★★ |
| [date-fns](https://github.com/date-fns/date-fns) | Datumsrechnung, deutsche Formate, Zeitzone | MIT | Immer | S | ★★★ |
| [rrule.js](https://github.com/jkbrzt/rrule) | Wiederkehrende Termine (iCal-Regeln) | BSD-3-Clause | ★ Nur mit Begründung: letzte Aktivität Juni 2024. Für „jeden Dienstag 10 Uhr“ reicht eigener Code mit date-fns | S | ★ |
| [Leaflet](https://github.com/Leaflet/Leaflet) | Karte für Tourenansicht | BSD-2-Clause | Tourenplanung im Büro | S | ★★★ |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | Vektorkarten, schärfer und schneller als Leaflet | BSD-3-Clause | Wenn Leaflet nicht reicht | M | ★★★ |
| [PMTiles](https://github.com/protomaps/PMTiles) | Kartendaten als eine Datei, selbst gehostet | BSD-3-Clause | Damit beim Kartenaufruf keine Klientenadresse an Fremdserver geht | M | ★★ |
| [OSRM](https://github.com/Project-OSRM/osrm-backend) | Fahrzeiten und Routen auf OpenStreetMap | BSD-2-Clause | Fahrzeit zwischen Einsätzen, Konfliktwarnung | L | ★★★ |
| [Valhalla](https://github.com/valhalla/valhalla) | Routing inkl. Fußweg/ÖPNV-nahe Profile | MIT | Alternative zu OSRM | L | ★★ |

Datenschutz: Adressen von Klienten nicht an Google Maps oder andere Fremddienste schicken. Routing selbst betreiben
oder einen EU-Anbieter mit AVV nehmen. Öffentliche OSM-Kachelserver nicht für den Betrieb nutzen (Nutzungsregeln).

## 6. Leistungsnachweis, Unterschrift, PDF

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Signature Pad](https://github.com/szimek/signature_pad) | Unterschrift mit Finger oder Apple Pencil | MIT | Bestätigung des Besuchs durch Klient oder Angehörige | S | ★★★ |
| [pdfme](https://github.com/pdfme/pdfme) | PDF aus Vorlage (Leistungsnachweis, Rechnung), Vorlage im Browser gestaltbar | MIT | Erste Wahl für Formulare mit festem Layout | M | ★★ |
| [React-pdf](https://github.com/diegomura/react-pdf) | PDF aus React-Komponenten | MIT | Für frei gestaltete Berichte | M | ★★★ |
| [jsPDF](https://github.com/parallax/jsPDF) | Einfache PDFs direkt im Browser | MIT | Kleine Belege, Kassenbuch-Ausdruck | S | ★★★ |
| [PDF.js](https://github.com/mozilla/pdf.js) | PDF im Browser anzeigen | Apache-2.0 | Vorschau vor dem Versand | S | ★★★ |

Ausgeschlossen: [pdf-lib](https://github.com/Hopding/pdf-lib) (letzte Aktivität Juli 2024).

Fachlich: Der Leistungsnachweis muss enthalten, was die Pflegekasse für die Erstattung des Entlastungsbetrags
(§ 45b SGB XI, 2026: 131 € im Monat) verlangt: Name und Versichertennummer, Anbieter mit Anerkennung, Datum,
Uhrzeit von–bis, Art der Leistung, Preis, Unterschrift. Vorlage mit den Kassen in Hannover abgleichen (AOK
Niedersachsen, TK, DAK, Barmer).

## 7. Abrechnung und E-Rechnung

| Werkzeug / Weg | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| Abrechnungsdienstleister für Pflege (z. B. opta data, DMRZ, azh) | Elektronischer Datenaustausch nach § 105 SGB XI mit den Kassen, ohne eigene Zertifikate | kostenpflichtig | Sobald direkt mit der Kasse abgerechnet wird. Export aus der App als CSV/Datei an den Dienstleister | M | ★★★ |
| [horstoeko/zugferd](https://github.com/horstoeko/zugferd) | E-Rechnung (ZUGFeRD/XRechnung) in PHP erzeugen und lesen | MIT | Rechnungen an Firmenkunden der Reinigung (Pflicht zum Empfang seit 2025, zum Versand stufenweise ab 2027) | M | ★★ |

Voraussetzung für die Kassenabrechnung ist ein Institutionskennzeichen (IK), beantragt bei der
[ARGE IK](https://dguv.de/arge-ik/antrag/index.jsp). Eigenen Datenaustausch nach den Technischen Anlagen des
GKV-Spitzenverbands selbst zu bauen lohnt sich für einen kleinen Anbieter nicht.

## 8. Tests und Qualität

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Playwright](https://github.com/microsoft/playwright) | Ende-zu-Ende-Tests im echten Browser, auch mit iPad-Profil | Apache-2.0 | Jede Rolle hat einen Test für ihren Hauptweg; läuft schon fürs Ladenbuch | M | ★★★ |
| [Vitest](https://github.com/vitest-dev/vitest) | Schnelle Unit-Tests (Budget-Rechnung, Konfliktprüfung) | MIT | Für jede Rechenregel | S | ★★★ |
| Supabase Advisors (Connector) | Prüft fehlende RLS-Regeln und Performance | – | Nach jeder Migration | S | ★★★ |

## 9. Für Claude selbst (Agent Skills)

| Quelle | Zweck | Lizenz | Wann nutzen |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Offizielle Skills, u. a. Frontend-Design, PDF, Webapp-Tests | je Skill angegeben | Als Vorbild für eigene Skills (z. B. „Leistungsnachweis prüfen“) |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | Anleitungen für Supabase-Arbeit (RLS, Migrationen) | MIT | Vor dem ersten Schema; Installation `npx skills add supabase/agent-skills` |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React-/Next.js-Regeln von Vercel | je Skill angegeben | Bei Option B mit Next.js |
