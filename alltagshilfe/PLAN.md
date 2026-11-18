# 📱 Alltagshilfe-App – langfristiger Plan

*Aus Notion übernommen am 17.11.2026 (Seitenstand 09.11.2026). Quelle: [Notion](https://app.notion.com/p/413e2e4d61c6813faef4ea4f093f7fa7). Ins GitHub-Format umgewandelt; kleine Aktualisierungen eingearbeitet, Zugangsdaten für das öffentliche Repository entfernt.*

Stand 09.11.2026 · Vorbild: Bild „AZUA – Business in a Box“. Ziel: eine eigene App für die Alltagshilfe, verbunden mit dem Ladenbuch der Textilpflege, aber streng getrennt.

## Grundidee: zwei Apps, eine schmale Brücke

- **Ladenbuch** (Textilpflege) bleibt, wie es ist.
- **Alltagshilfe-App** wird eine eigene App: eigene Adresse (Subdomain), eigene Datenbank, eigene Zugänge. Sie nutzt dieselbe Technik wie das Ladenbuch (läuft auf ALL-INKL, kein neues Abo, 0 €).
- **Brücke:** Die Alltagshilfe kann im Ladenbuch einen normalen Reinigungsauftrag anlegen (Name, Telefon, Teile). Das Ladenbuch meldet „abholbereit“ zurück. **Gesundheitsdaten gehen nie ins Ladenbuch.**
- Warum getrennt: Pflegegrad und Pflegekasse sind Gesundheitsdaten (Art. 9 DSGVO). Laden und Werkstatt dürfen sie nicht sehen; die Pflichten der Alltagshilfe sollen nicht auf den Laden durchschlagen. Zusätzlich muss die Trennung zur privat bezahlten Reinigung für das Landesamt klar sein.

## Stufen

**Stufe 1 · Prototyp mit Testdaten (erledigt 09.11.2026, 0 €)**

- Klickbarer Prototyp nur mit erfundenen Daten, lokal getestet
- Dient auch als Anschauung für das Gespräch mit dem Landesamt und für das Konzept zum Antrag

**Stufe 2 · Kern für den eigenen Betrieb (zum Start der Alltagshilfe, Ziel 2027)**

- Klienten: Kontakt, Angehörige, Pflegegrad, Pflegekasse, Versichertennummer, Abtretungserklärung, Einwilligungen
- Budget je Klient: 131 €/Monat, verbraucht, Rest, Vorjahresrest mit Frist 30.06.
- Einsätze und Kalender
- Leistungsbestätigung: Tätigkeiten aus fester Liste, Unterschrift auf dem Gerät
- Monatsrechnung je Pflegekasse mit Leistungsnachweisen (PDF), IK-Nummer
- Brücke zum Ladenbuch für Reinigungsaufträge
- Zugriffsprotokoll, verschlüsselte Sicherung

**Stufe 3 · Wachsen mit Team**

- Helferinnen mit eigenen Zugängen, Einsatzplan, Stunden
- Bestätigung durch Angehörige per Link
- Fristen im Blick: Erste Hilfe (5 Jahre), Führungszeugnis (5 Jahre), Schulungen
- Fahrtenbuch
- Export für Steuerberater (CSV/DATEV-Format) statt eigener Buchhaltung

**Stufe 4 · Nur falls die App später an andere Anbieter gehen soll**

- Mehrere Betriebe getrennt in einer App, eigenes Hosting, Verträge zur Auftragsverarbeitung, Sicherheitsprüfung
- Elektronische Abrechnung mit den Kassen über einen Abrechnungsdienstleister (kostet)
- Rechtliche Prüfung (Steuerberatungsgesetz, Pflegehilfsmittel, Provisionen)
- Erst entscheiden, wenn die eigene Alltagshilfe läuft

## Bewusst nicht selbst bauen

- Eigene Buchhaltung und Steuer: fertiges günstiges Programm plus Export
- Eigener Chat: keine Gesundheitsdaten in WhatsApp; Absprachen über die App selbst (Notizen am Einsatz)
- Pflegehilfsmittel-Shop: erst spät, braucht Vertrag mit den Pflegekassen

## Name

„AZUA“ ist die allgemeine Abkürzung der Behörden für diese Angebote. Als Name für den eigenen Gebrauch ok, als Marke nicht schützbar. Passt später zu FEIN, z. B. „FEIN Alltagshilfe“-App.

## Offene Fragen

- Wie lief die Abrechnung 2018–2022 (Papier oder elektronisch)? Danach richtet sich die Rechnungsfunktion.

## Prototyp (Stand 09.11.2026)

Link: [https://claude.ai/artifact/UUPcmTQ2SAHU3RCoUSYyK3](https://claude.ai/artifact/UUPcmTQ2SAHU3RCoUSYyK3) · Code: [prototyp/index.html](prototyp/index.html)

Vier Zugänge auf dieselben Daten (nur Testdaten):

- **Büro** als Schnittstelle: Übersicht mit Warnungen, Klienten-Akte (CRM), feste Termine auf Dauer, Wochenkalender, Touren mit Strecken und Fahrzeiten, Anfragen-Eingang, Abrechnung je Kasse im Auftrag der Begleiterinnen, Team mit Fristen, Beratungsbesuche nach § 37 Abs. 3
- **Begleiterin**: Tagestour mit Route, Einsatz erfassen (Tätigkeiten, Kurzvermerk, Unterschrift oder Bestätigung durch Angehörige), Woche, eigene Zahlen mit Kassenbuch und EÜR als PDF
- **Klient**: große Schrift, nächster Besuch, Termine, was gemacht wurde, Rest des Entlastungsbetrags, Rückruf, Absage
- **Angehörige / Pflegeperson**: Leistungen digital bestätigen (nur mit Vollmacht), Termine wünschen und absagen, Verlauf mit Vermerken, Budget, Pflichten als Pflegeperson, Kommunikation übernehmen

Nächste Ausbaustufen: echte Anmeldung je Rolle, Server mit Datenbank (wie Ladenbuch), Benachrichtigungen per SMS/E-Mail, Kartendienst für echte Fahrzeiten, Abrechnung mit den Kassen über Abrechnungsdienstleister.
