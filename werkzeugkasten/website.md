# Werkzeugkasten: Website

Ausgangslage: Die Website ist statisch (HTML/CSS/JS), wird von `website/_vorlagen/seiten.py` erzeugt und liegt bei
ALL-INKL (PHP verfügbar, SSL aktiv). Schrift Archivo ist lokal eingebunden. Es gibt kein Tracking. Daraus folgt:
Die meisten Werkzeuge unten laufen nur **beim Bauen oder Prüfen**, nicht auf der Live-Seite.

Geprüft am 17.11.2026 (Lizenz, letzte Aktivität, Sterne laut GitHub).

## 1. Prüfen und messen

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) | Bewertet Performance, Barrierefreiheit, Best Practices, SEO einer Seite | Apache-2.0 | Vor jedem Upload einer geänderten Seite; Ziel überall ≥ 95 | S | ★★★ |
| [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Lighthouse automatisch bei jedem Commit, mit Grenzwerten | Apache-2.0 | Sobald die Seite per GitHub Actions geprüft werden soll | M | ★★★ |
| [web-vitals](https://github.com/GoogleChrome/web-vitals) | Misst LCP, INP, CLS echter Besucher | Apache-2.0 | Nur zusammen mit einer cookielosen Statistik (siehe 3), sonst unnötig | S | ★★★ |
| [axe-core](https://github.com/dequelabs/axe-core) | Prüft Barrierefreiheit nach WCAG 2.2 automatisch | MPL-2.0 | Bei jeder Seitenänderung, im Playwright-Test (siehe app.md) | S | ★★★ |
| [Pa11y](https://github.com/pa11y/pa11y) | Barrierefreiheit per Kommandozeile für viele URLs auf einmal | LGPL-3.0 | Alle Seiten der `sitemap.xml` in einem Lauf prüfen | S | ★★ |
| [Nu Html Checker (vnu)](https://github.com/validator/validator) | Offizieller HTML-Validator des W3C | MIT | Nach Änderungen an den Vorlagen in `seiten.py` | S | ★★★ |
| [lychee](https://github.com/lycheeverse/lychee) | Findet kaputte Links und E-Mail-Adressen | Apache-2.0 / MIT | Vor dem Upload, einmal pro Monat | S | ★★ |

## 2. Bilder, Schriften, CSS

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [sharp](https://github.com/lovell/sharp) | Bilder verkleinern, nach AVIF/WebP wandeln, mehrere Größen für `srcset` | Apache-2.0 | Jedes neue Foto (Laden, Team, Leistungen) vor dem Einbau | S | ★★★ |
| [Squoosh](https://github.com/GoogleChromeLabs/squoosh) | Dasselbe im Browser, ohne Installation | Apache-2.0 | Einzelnes Bild direkt auf dem iPad: squoosh.app | S | ★★★ |
| [SVGO](https://github.com/svg/svgo) | SVGs (Logos in `marke/svg/`) verlustfrei verkleinern | MIT | Nach jeder Änderung an `logo_dateien.py` | S | ★★★ |
| [google-webfonts-helper](https://github.com/majodev/google-webfonts-helper) | Google-Schriften als Dateien zum Selbsthosten | MIT | Falls eine weitere Schrift dazukommt. Nie Google Fonts direkt einbinden (Urteil LG München I, 20.01.2022, 3 O 17493/20) | S | ★★★ |
| [Fontsource](https://github.com/fontsource/fontsource) | Offene Schriften als npm-Pakete zum Selbsthosten | MIT | Für die App (Next.js/Vite), nicht für die statische Seite | S | ★★ |
| [PurgeCSS](https://github.com/FullHuman/purgecss) | Entfernt ungenutztes CSS | MIT | Nur wenn `style.css` deutlich über 50 KB wächst | S | ★★ |

## 3. Cookies, Einwilligung, Statistik

**Regel:** Solange nur technisch notwendige Speicherungen stattfinden (keine Statistik, keine eingebetteten Karten oder
Videos, keine Social-Media-Plugins), braucht die Seite **keinen Cookie-Banner** (§ 25 Abs. 2 Nr. 2 TDDDG). Ein Banner
ohne Grund kostet Vertrauen und Geschwindigkeit. Externe Inhalte wie Google Maps nur als Zwei-Klick-Lösung: statisches
Kartenbild mit Link, erst der Klick lädt die Karte.

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [CookieConsent v3 (orestbida)](https://github.com/orestbida/cookieconsent) | Schlanker Einwilligungsbanner ohne Abhängigkeiten, Kategorien, Widerruf | MIT | Erst wenn ein einwilligungspflichtiger Dienst dazukommt | M | ★★ |
| [Umami](https://github.com/umami-software/umami) | Cookielose Besucherstatistik, selbst gehostet | MIT | Wenn Zahlen gebraucht werden (z. B. Wirkung von Flyern). Braucht Node + Postgres, läuft also nicht auf dem ALL-INKL-Webspace, sondern z. B. auf einem kleinen EU-Server | M | ★★★ |
| [Matomo](https://github.com/matomo-org/matomo) | Statistik in PHP/MySQL, läuft auf ALL-INKL | GPL-3.0 | Alternative zu Umami, wenn es beim jetzigen Hoster bleiben soll. Cookielos konfigurieren; GPL ist hier unkritisch, weil Matomo unverändert als eigene Anwendung läuft | M | ★★★ |

Ausgeschlossen: [Klaro](https://github.com/kiprotect/klaro) (letzte Aktivität März 2025, Lizenzangabe uneindeutig).
Plausible (AGPL-3.0) wäre fachlich gut, Umami ist bei gleicher Leistung freier lizenziert.

## 4. Formulare und E-Mail

Kontakt- und Anfrageformulare laufen über PHP auf ALL-INKL. Spam-Schutz ohne Google reCAPTCHA (Drittlandübermittlung,
Einwilligung nötig).

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [PHPMailer](https://github.com/PHPMailer/PHPMailer) | E-Mails aus PHP sicher per SMTP versenden (statt `mail()`) | LGPL-2.1 | Für jedes Formular auf der Website und im Ladenbuch | S | ★★★ |
| [ALTCHA](https://github.com/altcha-org/altcha) | Spam-Schutz per Rechenaufgabe im Browser, ohne Cookies, ohne Fremdserver, WCAG 2.2 AA | MIT | Erste Wahl, sobald Spam über das Formular kommt; Server-Teil in PHP selbst prüfen | S | ★★ |
| [Friendly Captcha Widget](https://github.com/FriendlyCaptcha/friendly-challenge) | Gleiches Prinzip, deutscher Anbieter, Prüfung über deren EU-Server | MIT (Widget), Dienst kostenpflichtig | Nur wenn ALTCHA nicht reicht | S | ★★ |

Daneben gilt: Honeypot-Feld und Zeitprüfung (Formular schneller als 3 Sekunden abgeschickt = Spam) halten den Großteil
ab und brauchen gar kein Werkzeug.

## 5. SEO und lokale Auffindbarkeit

| Werkzeug | Zweck | Lizenz | Wann nutzen | Aufwand | Reife |
|---|---|---|---|---|---|
| [schema.org](https://github.com/schemaorg/schemaorg) | Vokabular für strukturierte Daten. Für uns `DryCleaningOrLaundry` mit Adresse, Öffnungszeiten, Telefon | Apache-2.0 | Einmal sauber in die Vorlage, bei Änderung der Öffnungszeiten mitpflegen | S | ★★★ |
| [Pagefind](https://github.com/Pagefind/pagefind) | Suche für statische Seiten ohne Server | MIT | Erst wenn die Seite über ca. 30 Unterseiten wächst | S | ★★ |
| [Quicklink](https://github.com/GoogleChromeLabs/quicklink) | Lädt sichtbare Links im Leerlauf vor | Apache-2.0 | Nur wenn Lighthouse Navigationszeit bemängelt; bei unserer Seitengröße meist unnötig | S | ★★ |

Ohne Repository, aber Pflicht: Google Search Console und Google-Unternehmensprofil (beide kostenlos), Bing Webmaster
Tools. `sitemap.xml` und `robots.txt` sind vorhanden.

## 6. WhatsApp Business

| Weg | Zweck | Kosten | Wann nutzen | Aufwand |
|---|---|---|---|---|
| [Click-to-Chat-Link](https://faq.whatsapp.com/) `https://wa.me/49511…` | Knopf „Per WhatsApp schreiben“. Ist ein normaler Link: keine Daten fließen, bevor die Kundin klickt, daher kein Banner nötig. Hinweis in der Datenschutzerklärung genügt | kostenlos | Jetzt | S |
| WhatsApp Business App | Katalog, Abwesenheitsnachricht, Schnellantworten, Labels („Abholbereit“) | kostenlos | Jetzt, auf dem Laden-Handy | S |
| [WhatsApp Business Platform (Cloud API)](https://developers.facebook.com/docs/whatsapp/cloud-api) | Automatische Nachrichten aus Ladenbuch oder App („Ihre Ware ist fertig“) | pro Nachricht (Vorlagen), Meta-Geschäftsverifizierung nötig | Erst wenn das Ladenbuch Abholbenachrichtigungen verschicken soll | L |

Ausgeschlossen: inoffizielle Bibliotheken, die WhatsApp Web fernsteuern (z. B. whatsapp-web.js, Baileys). Sie verstoßen
gegen die Nutzungsbedingungen, die Nummer kann gesperrt werden. Für die Alltagshilfe gilt zusätzlich: **keine
Gesundheitsdaten über WhatsApp** (siehe app.md, Abschnitt 3).
