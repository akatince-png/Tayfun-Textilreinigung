# Baut die Installations-/Update-Datei für das Ladenbuch aus web/
import base64, json, secrets, sys, zipfile
from pathlib import Path
h = Path(__file__).resolve().parent
dateien = {str(f.relative_to(h / "web")): base64.b64encode(f.read_bytes()).decode() for f in sorted((h / "web").rglob("*")) if f.is_file()}
nutzlast = base64.b64encode(json.dumps(dateien).encode()).decode()
name = sys.argv[1] if len(sys.argv) > 1 else f"ladenbuch-{secrets.token_hex(4)}"
ziel = h / "ausgabe" / f"{name}.php"; ziel.parent.mkdir(exist_ok=True)
ziel.write_text((h / "installer-vorlage.php").read_text().replace("__NUTZLAST__", nutzlast))
with zipfile.ZipFile(ziel.with_suffix(".zip"), "w", zipfile.ZIP_DEFLATED) as z: z.write(ziel, ziel.name)
print(ziel, len(dateien), "Dateien")
