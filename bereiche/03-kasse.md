# 💳 3 · Kasse (Online-Kassensystem)

*Aus Notion übernommen am 17.11.2026 (Seitenstand 27.10.2026). Quelle: [Notion](https://app.notion.com/p/406e2e4d61c681ba82dcc8bf9c29782f). Ins GitHub-Format umgewandelt; kleine Aktualisierungen eingearbeitet, Zugangsdaten für das öffentliche Repository entfernt.*

## Ziel

Online-Kasse mit TSE, die mit dem Ladenbuch verbunden ist: Auftrag im Ladenbuch → „An Kasse übergeben“ → nur noch kassieren. Nichts doppelt eintippen.

## Stand

- Entscheidung: künftig ein Online-Kassenanbieter. Kassenwechsel erst 2027 (entschieden 28.10.2026).
- Recherche (27.10.):
  - **Lightspeed Restaurant (K-Series)**: Bestellungen von außen in die Kasse sind **nachgewiesen** (Deliverect, resmio, storekit, UrbanPiper); TSE über fiskaly. Gastro-orientiert, eher teurer.
  - **ready2order**: Testsieger, ab ca. 36 €/Monat, Schnittstelle zum Anlegen von Bestellungen vorhanden – ob sie an der Kasse zum Kassieren erscheinen, ist **nicht belegt**.
  - orderbird, SumUp-Kasse, Unzer/Tillhub, Shopify POS: keine passende Schnittstelle gefunden.
  - Langfristige Alternative: Ladenbuch wird mit Cloud-TSE (fiskaly) selbst zur Kasse.
- Empfehlung: zuerst ready2order mit Testzugang prüfen, sonst Lightspeed.

## Wartet auf Duran

- [ ] E-Mail an ready2order senden (Text unten)
- [ ] E-Mail an Lightspeed senden (Text unten)
- [ ] Bisheriges Kassensystem und Kartenterminal notieren (Hersteller, Name)
- [ ] Steuerberater: Umstieg, TSE-Meldung ans Finanzamt

## Danach (Claude)

- [ ] Mit Testzugang die Verbindung Ladenbuch → Kasse bauen und testen, vor Vertragsabschluss

## E-Mail an ready2order

Betreff: Testzugang und Frage zur API – Textilreinigung, Hannover

Guten Tag,

wir sind eine Textilreinigung in Hannover-Wettbergen (Tayfun Textilpflege) und möchten auf ein Online-Kassensystem umsteigen. ready2order steht bei uns ganz oben auf der Liste.

Für Auftragsannahme, Warenschau und Teileverfolgung nutzen wir eine eigene Web-App. Damit wir an der Kasse nichts doppelt eingeben, soll diese App den fertigen Auftrag mit allen Positionen an ready2order übergeben. An der Kasse wird er dann nur noch aufgerufen, kassiert (bar oder Karte) und mit TSE-signiertem Bon abgeschlossen.

1. Kann ein externes Programm über Ihre API (z. B. POST /orders oder /orders/transfer) eine offene Bestellung anlegen, die an der Kasse erscheint und dort kassiert werden kann? Gibt es dafür eine Anleitung oder ein Beispiel?
2. Ist so ein Ablauf bei bestehenden Kunden oder Partnern bereits im Einsatz?
3. Wird der Bon dabei wie gewohnt über Ihre TSE signiert?
4. Gibt es eine Kundenanzeige (zweiter Bildschirm zum Kunden)?
5. Welche Tarife enthalten den API-Zugang, und was kostet das bei einem Geschäft mit einer Kasse und einem Kartenterminal?
6. Können wir einen kostenlosen Testzugang mit API bekommen, um die Anbindung vor Vertragsabschluss auszuprobieren?

Vielen Dank und freundliche Grüße  
Duran Ince · Tayfun Textilpflege · An der Kirche 10 · 30457 Hannover · Tel. 0511 464252 · [info@tayfun-textilpflege.de](mailto:info@tayfun-textilpflege.de)

## E-Mail an Lightspeed

Betreff: Anfrage Lightspeed Restaurant (K-Series) für eine Textilreinigung – Bestellungen über API

Guten Tag,

wir sind eine Textilreinigung in Hannover und suchen ein Online-Kassensystem mit TSE. Über eine eigene Web-App nehmen wir Aufträge an und möchten diese per API als Bestellung an die Kasse übergeben, wie es Partner wie Deliverect oder resmio tun. Kassiert wird dann an der Kasse.

1. Ist K-Series für einen Dienstleistungsbetrieb (keine Gastronomie) geeignet?
2. Welcher Tarif enthält den API-Zugang zum Anlegen von Bestellungen, und was kostet er bei einer Kasse mit Kartenterminal?
3. Gibt es eine Kundenanzeige?
4. Ist ein Testzugang mit API möglich?

Freundliche Grüße  
Duran Ince · Tayfun Textilpflege · An der Kirche 10 · 30457 Hannover · Tel. 0511 464252 · [info@tayfun-textilpflege.de](mailto:info@tayfun-textilpflege.de)

## Quellen

- [ready2order API](https://ready2order.com/at/api/doc) · [Order-API-Übersicht](https://apis.apievangelist.com/store/ready2order-order-api/)
- [Lightspeed K-Series + fiskaly](https://k-series-support.lightspeedhq.com/hc/en-us/articles/14949401075355) · [Deliverect](https://deliverect.com/de-de/integrations/lightspeed-pos-kseries) · [resmio](https://www.resmio.com/en/help/lightspeed-integration-k-series/)
- [Kassenvergleich 2026](https://www.fuer-gruender.de/wissen/unternehmen-fuehren/buchhaltung/kasse/technische-sicherheitseinrichtung-tse/)
