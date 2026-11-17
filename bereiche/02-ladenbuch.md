# 🧾 2 · Ladenbuch – Laden-App (laden.tayfun-textilpflege.de)

*Aus Notion übernommen am 17.11.2026 (Seitenstand 28.10.2026). Quelle: [Notion](https://app.notion.com/p/406e2e4d61c681f4b100ee4e6f8980e1). Ins GitHub-Format umgewandelt; kleine Aktualisierungen eingearbeitet, Zugangsdaten für das öffentliche Repository entfernt.*

## Ziel

Eine App für Theke, Werkstatt und Leitung: Annahme, Sammler, Warenschau, Teile, Kunden, Kundendienst, Auswertung. Später mit der Kasse verbunden.

## Stand: Version 1.7 fertig, noch nicht installiert

Installationsdatei: **ladenbuch-32db1d5f.zip** (ersetzt alle früheren; laut Aufgabenliste vom 09.11. inzwischen **ladenbuch-770da8f3** mit Version 1.8). Hier getestet mit echter Datenbank und mehreren Geräten.

**Was sie kann**

- Anmeldung pro Gerät; Zugänge **Laden**, **Werkstatt** (eigenes Passwort), **Manager** = Laden + Leitungs-PIN
- Gemeinsame Datenbank bei ALL-INKL, läuft auch offline weiter; Home-Bildschirm-App
- Annahme mit Kundensuche (verzeiht Tippfehler), Laufkunde, Angebote rechnet sie selbst
- **Sammler**: eine Nummer je Abgabe (z. B. 1001), Teile als 1001 · 3/8
- **Warenschau** je Teil: einwandfrei oder Mängel auf Umrisszeichnung mit Foto, Fleckart, Behandlungshinweis, „Kunde bestätigt“; Optionen (Bügelfalte, Stärke); Kundenwünsche/Freigaben; Ampel grün/rot
- **Druck** (AirPrint-Bondrucker 80 mm): Abholschein, Sammler für die Tüte, Etiketten mit Ausrufezeichen bei Vermerk
- **Abholschein digital** per WhatsApp-Knopf oder QR-Code zum Abfotografieren; Abholcode mit Prüfzeichen
- **Werkstatt**: Sammler aufrufen, nachzählen, Stationen, Feststellungen + Fotos, Kunde und Vorgeschichte sehen, Kunde per WhatsApp fragen und Antwort dokumentieren
- **Kundendienst**: Reklamations-Tickets R-1001 … mit Ablauf, Fotos, Wiedervorlage, Abschluss (Erstattung/Ablehnung nur mit PIN)
- **Kundenkartei** für Stammkunden: Anschrift, Stockwerk/Lage, Lieferhinweis, Handy, Festnetz, E-Mail, bevorzugter Kontaktweg, Einwilligungen (Auftragsnachrichten, Werbung); Schnell-Kunde mit Handy oder E-Mail
- Abholschein und „abholbereit“ per **WhatsApp, SMS oder E-Mail**; Laufkunden geben Handy oder E-Mail nur für diesen Auftrag an
- **Mitarbeiterkartei**, „Wer arbeitet gerade?“, **Vier-Augen-Prinzip**
- Leitung: Umsatz, Auswertung, Reklamationsquote, Geräte, Passwörter, Sicherung

## Einrichtung (sobald SSL aktiv)

Hinweis: tt-laden.de wurde am 28.10. verworfen; Ziel ist jetzt die Subdomain laden.tayfun-textilpflege.de.

- [ ] Domain freigeschaltet
- [ ] SSL einschalten (Let’s Encrypt)
- [ ] Claude prüft die Domain von außen
- [ ] Installationsdatei (`.php`) in den Domain-Ordner hochladen und aufrufen
- [ ] Formular: Datenbank (Name im KAS) + Passwort, Laden-Passwort, Leitungs-PIN, erste Nummer (1001 oder z. B. 401)
- [ ] In Safari anmelden → „Zum Home-Bildschirm“
- [ ] Leitung: Mitarbeiter eintragen, Werkstatt-Passwort festlegen
- [ ] WhatsApp auf Werkstatt-Tablet mit Geschäftsnummer verknüpfen

## Als Nächstes bauen

- [ ] Formulare nach den Vordrucken aus dem Laden (Fotos kommen von Duran)
- [ ] Kundenanzeige (zweiter Bildschirm zum Kunden)
- [ ] Anbindung an die Online-Kasse (siehe Kasse)
- [ ] Preise in der App pflegen (bisher fest hinterlegt, Stand 11/2025)

## Später

- Echte iPad-App (Capacitor), falls Bluetooth-Drucker gewünscht
- AktivPass-Rabatt, Abrechnung Unterstützung im Alltag
- Optional: Unterschrift auf dem iPad

## Geräte

- iPad (Empfehlung: iPad A16, ca. 380 €, oder iPad Air M1 gebraucht)
- Bondrucker mit AirPrint/Cloud-Druck: Star mC-Print3 oder Epson TM-m30III (ca. 300–450 €)
- 2D-Scanner für Etiketten und Abholcodes vom Handy

## Wo liegt was

- Quellcode: GitHub `Tayfun-Textilreinigung`, Ordner `ladenbuch/` (`web/` = App, `bau.py` baut die Installationsdatei, Tests `test-e2e-*.js`)
- Erster Prototyp (Beispieldaten): [https://claude.ai/artifact/CmmxYoDtUMnmq2gUAPVN2y](https://claude.ai/artifact/CmmxYoDtUMnmq2gUAPVN2y)
- Zugangsdaten liegen nur auf dem Server, nie im Repository
