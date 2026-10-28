# Digitale Visitenkarten: je Person vCard, QR-Code und eigene Seite auf der Website.
# Vorlage für alle Seiten ist visitenkarte.html (Duran Ince); weitere Personen werden daraus erzeugt.
# Aufruf: <python mit segno> marke/_werkzeug/visitenkarte.py   (Druck-PDF und Bilder danach mit visitenkarte.js)
import base64, segno
from pathlib import Path

H = Path(__file__).resolve().parent.parent.parent
WEB = H / "website"
BASIS = "https://www.tayfun-textilpflege.de/"
# kurz: Dateiname-Zusatz ("" = Vorlage visitenkarte.html)
PERSONEN = [
    {"kurz": "", "vorname": "Duran", "nachname": "Ince", "titel": "Inhaber", "datei": "Duran-Ince"},
    {"kurz": "-aka", "vorname": "Aka Tayfun", "nachname": "Ince", "titel": "Kundenbetreuung", "datei": "Aka-Tayfun-Ince"},
]
ZEITEN = "Mo, Di, Do, Fr 8–13 + 15–18 Uhr · Mi + Sa 8–13 Uhr"

def falten(zeile):
    # vCard-Zeilen höchstens 75 Zeichen, Fortsetzung mit Leerzeichen
    out = [zeile[:75]]
    zeile = zeile[75:]
    while zeile:
        out.append(" " + zeile[:74]); zeile = zeile[74:]
    return "\r\n".join(out)

foto = base64.b64encode((WEB / "assets/apple-touch-icon.png").read_bytes()).decode()
def vcard(p):
    name = f"{p['vorname']} {p['nachname']}"
    return "\r\n".join(falten(z) for z in [
        "BEGIN:VCARD", "VERSION:3.0",
        f"N:{p['nachname']};{p['vorname']};;;", f"FN:{name}", "ORG:Tayfun Textilpflege", f"TITLE:{p['titel']}",
        "TEL;TYPE=WORK,VOICE:+49 511 464252",
        "EMAIL;TYPE=WORK,INTERNET:info@tayfun-textilpflege.de",
        "ADR;TYPE=WORK:;;An der Kirche 10;Hannover-Wettbergen;;30457;Deutschland",
        "URL:https://www.tayfun-textilpflege.de",
        f"NOTE:Textilreinigung\\, Wäscherei\\, Änderungsschneiderei\\, Gardinen- und Teppichreinigung\\, Schuh- und Schlüsseldienst. WhatsApp: 0511 464252. Öffnungszeiten: {ZEITEN.replace(',', chr(92) + ',')}",
        f"PHOTO;ENCODING=b;TYPE=PNG:{foto}",
        "END:VCARD"]) + "\r\n"

def qr_svg(text, farbe="#1F1B1B"):
    # Eigene Pfad-Ausgabe mit viewBox, damit Drucker und Browser nichts abschneiden
    q = segno.make(text, error="m", micro=False)
    rand = 4; m = list(q.matrix_iter(border=rand)); n = len(m)
    d = "".join(f"M{x} {y}h1v1h-1z" for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges" role="img" aria-label="QR-Code zur digitalen Visitenkarte"><rect width="{n}" height="{n}" fill="#fff"/><path d="{d}" fill="{farbe}"/></svg>'

vorlage = (WEB / "visitenkarte.html").read_text(encoding="utf-8")
for p in PERSONEN:
    name = f"{p['vorname']} {p['nachname']}"
    vcf = "tayfun-textilpflege.vcf" if not p["kurz"] else f"{p['datei'].lower()}.vcf"
    seite = f"visitenkarte{p['kurz']}.html"
    (WEB / vcf).write_text(vcard(p), encoding="utf-8")
    (WEB / f"assets/visitenkarte{p['kurz']}-qr.svg").write_text(qr_svg(BASIS + seite), encoding="utf-8")
    ziel = H / "marke/visitenkarte" / p["datei"]; ziel.mkdir(parents=True, exist_ok=True)
    (ziel / "QR.svg").write_text(qr_svg(BASIS + seite), encoding="utf-8")
    if p["kurz"]:
        html = (vorlage.replace("Duran Ince", name).replace("Inhaber · Tayfun", f"{p['titel']} · Tayfun")
                .replace('href="tayfun-textilpflege.vcf"', f'href="{vcf}"').replace('download="Tayfun-Textilpflege.vcf"', f'download="{p["datei"]}.vcf"')
                .replace("assets/visitenkarte-qr.svg", f"assets/visitenkarte{p['kurz']}-qr.svg").replace("/visitenkarte.html", "/" + seite))
        (WEB / seite).write_text(html, encoding="utf-8")
    print(f"✓ {seite}, {vcf}, QR")
