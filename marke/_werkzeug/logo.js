// Erzeugt aus marke/svg/*.svg die PNG-Dateien (8-fach, transparent wo kein Rot) und Vektor-PDFs,
// dazu Apple-Touch-Icon und Logo-Bild für die Website. Vorher logo_dateien.py ausführen.
// Aufruf (in diesem Ordner): NODE_PATH=$(npm root -g) node logo.js
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const OUT = path.resolve(__dirname, "..");
const SITE = path.resolve(OUT, "../website/assets");
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  for (const d of ["png", "pdf"]) { fs.mkdirSync(path.join(OUT, d), { recursive: true }); for (const f of fs.readdirSync(path.join(OUT, d))) fs.unlinkSync(path.join(OUT, d, f)); }
  for (const f of fs.readdirSync(path.join(OUT, "svg")).filter(f => f.endsWith(".svg"))) {
    const svg = fs.readFileSync(path.join(OUT, "svg", f), "utf8");
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/).map(Number);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: f.includes("monogramm") ? 8 : 2 });
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
    const name = f.replace(".svg", "");
    await page.screenshot({ path: path.join(OUT, "png", name + ".png"), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.pdf({ path: path.join(OUT, "pdf", name + ".pdf"), width: `${w}px`, height: `${h}px`, printBackground: true, pageRanges: "1" });
    await page.close();
    console.log("✓", name);
  }
  const p2 = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await p2.setContent(`<!doctype html><style>html,body{margin:0}img{display:block;width:180px;height:180px}</style><img src="data:image/svg+xml;base64,${fs.readFileSync(path.join(OUT, "svg/tayfun-monogramm-rot.svg")).toString("base64")}">`);
  await p2.waitForTimeout(100);
  await p2.screenshot({ path: path.join(SITE, "apple-touch-icon.png"), clip: { x: 0, y: 0, width: 180, height: 180 } });
  const p3 = await browser.newPage({ viewport: { width: 1355, height: 325 } });
  await p3.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block}</style>${fs.readFileSync(path.join(OUT, "svg/tayfun-logo-rot.svg"), "utf8")}`);
  await p3.screenshot({ path: path.join(SITE, "tayfun-logo-rot.png"), clip: { x: 0, y: 0, width: 1355, height: 325 } });
  await browser.close();
  console.log("✓ Website-Symbole");
})();
