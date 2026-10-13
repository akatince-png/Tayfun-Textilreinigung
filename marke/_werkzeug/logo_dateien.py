# Schreibt die Logo-Dateien als SVG (aus website/_vorlagen/logo.py). PNG und PDF erzeugt danach logo.js.
# Aufruf (im Ordner tayfun): python3 marke/_werkzeug/logo_dateien.py && NODE_PATH=$(npm root -g) node marke/_werkzeug/logo.js
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "website/_vorlagen"))
import logo

SVG = ROOT / "marke/svg"
SVG.mkdir(parents=True, exist_ok=True)
for f in SVG.glob("*.svg"):
    f.unlink()
files = {
    "tayfun-logo-rot": logo.svg("rot"),
    "tayfun-logo-auf-weiss": logo.svg("weiss"),
    "tayfun-logo-negativ": logo.svg("negativ"),
    "tayfun-monogramm-rot": logo.mono_svg(bg="#D7262E", fg="#FFFFFF", size=120),
    "tayfun-monogramm-auf-weiss": logo.mono_svg(fg="#D7262E", size=120),
}
for name, svg in files.items():
    (SVG / f"{name}.svg").write_text(svg, encoding="utf-8")
    print("✓", name)
# Website: Favicon
(ROOT / "website/assets/tayfun-monogramm.svg").write_text(logo.mono_svg(bg="#D7262E", fg="#FFFFFF"), encoding="utf-8")
print("✓ website/assets/tayfun-monogramm.svg")
