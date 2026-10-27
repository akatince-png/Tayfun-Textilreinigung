# Baut website/beleg.html aus beleg-vorlage.html + schein.js + qrcode.min.js
# Aufruf: python3 website/_vorlagen/schein/bau.py
from pathlib import Path
h = Path(__file__).resolve().parent
t = (h / "beleg-vorlage.html").read_text()
t = t.replace("{{QRLIB}}", (h / "qrcode.min.js").read_text().strip()).replace("{{SCHEIN}}", (h / "schein.js").read_text().strip())
(h.parent.parent / "beleg.html").write_text(t)
