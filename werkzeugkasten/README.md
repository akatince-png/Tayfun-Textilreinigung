# Werkzeugkasten

Geprüfte Open-Source-Repositories und offizielle Quellen für die Website von Tayfun Textilpflege und die geplante
Alltagshilfe-App (Angebot zur Unterstützung im Alltag nach § 45a SGB XI, unter der Dachmarke „FEIN“).

**Stand der Prüfung:** 17.11.2026. Lizenz, letzte Aktivität und Archiv-Status jedes Repositorys wurden an diesem Tag
über die GitHub-API abgefragt. Gesetzeslage und Vorgaben per Websuche bei IHK, Supabase, AOK und e-recht24 geprüft.

## Dateien

| Datei | Inhalt |
|---|---|
| [`agent-prompt.md`](agent-prompt.md) | Der Senior-Agent-Prompt: Rollen, Entscheidungsregeln, Qualitätsstandards, Prüfhinweise. Wird über `CLAUDE.md` im Hauptordner automatisch geladen. |
| [`website.md`](website.md) | Werkzeuge für die Website: Prüfen (Performance, Barrierefreiheit, HTML, Links), Bilder und Schriften, Cookies und Statistik, Formulare, SEO, WhatsApp. |
| [`app.md`](app.md) | Werkzeuge für die Alltagshilfe-App: Stack, Auth und Rollen, Datenschutz bei Gesundheitsdaten, PWA und Offline fürs iPad, Kalender und Touren, Leistungsnachweis mit Unterschrift, PDF, Abrechnung, Tests. |
| [`quellen-recht-und-pflege.md`](quellen-recht-und-pflege.md) | Offizielle Stellen und Generatoren: Impressum, Datenschutz, Cookies (TDDDG), Barrierefreiheit (BFSG), § 45a/45b SGB XI, Abrechnung mit der Pflegekasse, E-Rechnung. |
| [`CLAUDE.md`](CLAUDE.md) | Kurzfassung für Claude, wenn direkt in diesem Ordner gearbeitet wird. |

## Regeln für diesen Werkzeugkasten

1. **Nichts wird blind eingebunden.** Die Listen sind ein Katalog, kein Paketverzeichnis. Ein Werkzeug kommt erst
   in den Code, wenn es eine konkrete Aufgabe löst und die Regeln in `agent-prompt.md` erfüllt.
2. **Aufnahmekriterien:** aktiv gepflegt (Aktivität in den letzten 12 Monaten, nicht archiviert), Lizenz erlaubt
   gewerbliche Nutzung ohne Offenlegung unseres Codes (MIT, BSD, Apache-2.0, ISC; MPL-2.0 und LGPL nur unverändert als
   Bibliothek), verbreitet genug, dass Fehler gefunden und behoben werden.
3. **Bewusst nicht aufgenommen** (Begründung steht jeweils in der Liste unter „Ausgeschlossen“): archivierte Projekte,
   inoffizielle WhatsApp-Bibliotheken, Werkzeuge mit Copyleft-Lizenz für eigenen Servercode (AGPL/GPL) außer als
   getrennt betriebener Dienst.
4. **Neu prüfen** vor jeder Einbindung und spätestens alle 6 Monate (nächster Termin: Mai 2027). Abfrage, die auch auf
   dem iPad über Claude läuft:
   `gh api -X GET search/repositories -f q='repo:OWNER/NAME' --jq '.items[] | [.full_name,.license.spdx_id,.pushed_at,.archived] | @tsv'`

## Legende

- **Aufwand:** S = unter einer Stunde · M = ein Arbeitstag · L = mehrere Tage
- **Reife:** ★★★ Industriestandard, sehr breit genutzt · ★★ etabliert, aktiv gepflegt · ★ jung oder wenig Aktivität, nur mit Begründung
