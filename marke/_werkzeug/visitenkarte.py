# Digitale Visitenkarte: vCard, QR-Code und die Seite visitenkarte.html für die Website.
# Aufruf: <python mit segno> marke/_werkzeug/visitenkarte.py   (Druck-PDF und Bilder danach mit visitenkarte.js)
import base64, segno
from pathlib import Path

H = Path(__file__).resolve().parent.parent.parent
WEB = H / "website"
SEITE = "https://www.tayfun-textilpflege.de/visitenkarte.html"
ZEITEN = "Mo, Di, Do, Fr 8–13 + 15–18 Uhr · Mi + Sa 8–13 Uhr"

def falten(zeile):
    # vCard-Zeilen höchstens 75 Zeichen, Fortsetzung mit Leerzeichen
    out = [zeile[:75]]
    zeile = zeile[75:]
    while zeile:
        out.append(" " + zeile[:74]); zeile = zeile[74:]
    return "\r\n".join(out)

foto = base64.b64encode((WEB / "assets/apple-touch-icon.png").read_bytes()).decode()
vcard = "\r\n".join(falten(z) for z in [
    "BEGIN:VCARD", "VERSION:3.0",
    "N:Ince;Duran;;;", "FN:Duran Ince", "ORG:Tayfun Textilpflege", "TITLE:Inhaber",
    "TEL;TYPE=WORK,VOICE:+49 511 464252",
    "EMAIL;TYPE=WORK,INTERNET:info@tayfun-textilpflege.de",
    "ADR;TYPE=WORK:;;An der Kirche 10;Hannover-Wettbergen;;30457;Deutschland",
    "URL:https://www.tayfun-textilpflege.de",
    f"NOTE:Textilreinigung\\, Wäscherei\\, Änderungsschneiderei\\, Gardinen- und Teppichreinigung\\, Schuh- und Schlüsseldienst. WhatsApp: 0511 464252. Öffnungszeiten: {ZEITEN.replace(',', chr(92) + ',')}",
    f"PHOTO;ENCODING=b;TYPE=PNG:{foto}",
    "END:VCARD"]) + "\r\n"
(WEB / "tayfun-textilpflege.vcf").write_text(vcard, encoding="utf-8")

def qr_svg(text, farbe="#1F1B1B"):
    # Eigene Pfad-Ausgabe mit viewBox, damit Drucker und Browser nichts abschneiden
    q = segno.make(text, error="m", micro=False)
    rand = 4; m = list(q.matrix_iter(border=rand)); n = len(m)
    d = "".join(f"M{x} {y}h1v1h-1z" for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges" role="img" aria-label="QR-Code zur digitalen Visitenkarte"><rect width="{n}" height="{n}" fill="#fff"/><path d="{d}" fill="{farbe}"/></svg>'

(WEB / "assets/visitenkarte-qr.svg").write_text(qr_svg(SEITE), encoding="utf-8")
(H / "marke/visitenkarte/Visitenkarte-QR.svg").write_text(qr_svg(SEITE), encoding="utf-8")
print("✓ tayfun-textilpflege.vcf, visitenkarte-qr.svg")
