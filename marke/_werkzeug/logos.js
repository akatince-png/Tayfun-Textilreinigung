// Erzeugt alle Tayfun-Logos als SVG, PNG (transparent, 4-fach) und PDF (Vektor, Schriften eingebettet).
// Alle Texte werden in Vektorpfade umgewandelt: Die Dateien sehen überall gleich aus, auch ohne installierte Schriften.
// Aufruf (in diesem Ordner): npm install && NODE_PATH=$(npm root -g) node logos.js
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const { chromium } = require("playwright");

const fontFile = f => path.join(__dirname, "node_modules/@fontsource", f);
const load = f => { const b = fs.readFileSync(fontFile(f)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const FONT = {
  corm: load("cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff"),
  jost: load("jost/files/jost-latin-400-normal.woff")
};

const OUT = path.resolve(__dirname, "..");

const PALETTES = {
  dunkel: { bg: "#1B2A41", text: "#F2ECE1", red: "#E0443E", fine: "#F2ECE1" }, // auf Nachtblau
  hell: { bg: null, text: "#1B2A41", red: "#C3262E", fine: "#1B2A41" }          // auf Creme / Weiß, transparent
};
const JOST = "jost";
const CORM = "corm";

function hex(cx, cy, R) {
  const h = R * Math.sqrt(3) / 2;
  return [[cx, cy - R], [cx + h, cy - R / 2], [cx + h, cy + R / 2], [cx, cy + R], [cx - h, cy + R / 2], [cx - h, cy - R / 2]]
    .map(p => p.map(v => v.toFixed(2)).join(",")).join(" ");
}
// Eigene Ausgabe der Pfaddaten (toPathData rundet bei manchen Werten fehlerhaft zu NaN).
const n = v => (Math.round(v * 100) / 100).toString();
function pathData(path) {
  return path.commands.map(c => c.type === "M" || c.type === "L" ? c.type + n(c.x) + " " + n(c.y)
    : c.type === "Q" ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
    : c.type === "C" ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
    : "Z").join("");
}
// Setzt Text zentriert auf x als Pfad. Sperrung (ls) nur zwischen den Zeichen, damit die Zeile exakt mittig sitzt.
function line(text, x, y, o) {
  const font = FONT[o.font], scale = o.size / font.unitsPerEm, ls = o.ls || 0;
  const glyphs = font.stringToGlyphs(text);
  const adv = glyphs.map((g, i) => (g.advanceWidth || 0) * scale + (i < glyphs.length - 1 ? (font.getKerningValue(g, glyphs[i + 1]) || 0) * scale + ls : 0));
  let pen = x - adv.reduce((a, b) => a + b, 0) / 2;
  const d = glyphs.map((g, i) => { const p = pathData(g.getPath(pen, y, o.size)); pen += adv[i]; return p; }).join("");
  return `<path d="${d}" fill="${o.fill}"/>`;
}

function sealBody(p, kind, ox = 0, oy = 0) {
  const cx = 120 + ox, cy = 120 + oy;
  const frame = `<polygon points="${hex(cx, cy, 108)}" fill="none" stroke="${p.red}" stroke-width="1.6"/>
  <polygon points="${hex(cx, cy, 99)}" fill="none" stroke="${p.fine}" stroke-width=".7" opacity=".5"/>`;
  if (kind === "mini") return frame + line("T", cx, oy + 147, { font: CORM, w: 500, size: 110, fill: p.text });
  if (kind === "kurz") return frame + `
  ${line("TAYFUN", cx, oy + 76, { font: JOST, size: 11.5, ls: 4.4, fill: p.text })}
  <line x1="${cx - 10}" x2="${cx + 10}" y1="${oy + 86}" y2="${oy + 86}" stroke="${p.red}" stroke-width=".9"/>
  ${line("T", cx, oy + 144, { font: CORM, w: 500, size: 78, fill: p.text })}
  ${line("feine Textilpflege", cx, oy + 168, { font: CORM, w: 500, size: 15, ls: 1.2, fill: p.red })}`;
  return frame + `
  ${line("TAYFUN", cx, oy + 68, { font: JOST, size: 10.5, ls: 4.2, fill: p.text })}
  <line x1="${cx - 10}" x2="${cx + 10}" y1="${oy + 78}" y2="${oy + 78}" stroke="${p.red}" stroke-width=".8"/>
  ${line("T", cx, oy + 132, { font: CORM, w: 500, size: 70, fill: p.text })}
  ${line("feine Textilpflege", cx, oy + 154, { font: CORM, w: 500, size: 13, ls: 1.2, fill: p.red })}
  ${line("FAMILIENUNTERNEHMEN SEIT 2001", cx, oy + 170, { font: JOST, size: 6.2, ls: 1.3, fill: p.text })}
  ${line("IN ZWEITER GENERATION", cx, oy + 180, { font: JOST, size: 6.2, ls: 1.3, fill: p.text })}`;
}

function labelBody(p, ox = 0, oy = 0) {
  const cx = 150 + ox;
  return `
  ${line("HANNOVER · WETTBERGEN", cx, oy + 26, { font: JOST, size: 10, ls: 3, fill: p.text })}
  <line x1="${ox + 15}" x2="${ox + 285}" y1="${oy + 40}" y2="${oy + 40}" stroke="${p.fine}" stroke-width="1" opacity=".4"/>
  ${line("Tayfun", cx, oy + 96, { font: CORM, w: 500, size: 60, fill: p.text })}
  ${line("feine Textilpflege", cx, oy + 136, { font: CORM, w: 500, size: 17, ls: 1, fill: p.red })}
  <line x1="${ox + 15}" x2="${ox + 285}" y1="${oy + 154}" y2="${oy + 154}" stroke="${p.fine}" stroke-width="1" opacity=".4"/>
  ${line("ABHOLUNG · LIEFERUNG", cx, oy + 178, { font: JOST, size: 10, ls: 3, fill: p.text })}`;
}

const LOGOS = {
  "siegel-voll": { w: 240, h: 240, body: p => sealBody(p, "voll") },
  "siegel-kurz": { w: 240, h: 240, body: p => sealBody(p, "kurz") },
  "siegel-mini": { w: 240, h: 240, body: p => sealBody(p, "mini") },
  "etikett": { w: 300, h: 198, body: p => labelBody(p) },
  "kombination": {
    w: 620, h: 254,
    body: p => sealBody(p, "voll", 10, 5) + `<line x1="290" x2="290" y1="45" y2="205" stroke="${p.red}" stroke-width="1"/>` + labelBody(p, 310, 28)
  }
};

function svg(name, palette) {
  const L = LOGOS[name], p = PALETTES[palette];
  const style = "";
  const bg = p.bg ? `<rect width="100%" height="100%" fill="${p.bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.w} ${L.h}" width="${L.w}" height="${L.h}">${style}${bg}${L.body(p)}</svg>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  for (const dir of ["svg", "png", "pdf"]) fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  for (const name of Object.keys(LOGOS)) {
    for (const palette of Object.keys(PALETTES)) {
      const file = `tayfun-${name}-${palette}`;
      fs.writeFileSync(path.join(OUT, "svg", file + ".svg"), svg(name, palette));
      const L = LOGOS[name];
      const page = await browser.newPage({ viewport: { width: L.w, height: L.h }, deviceScaleFactor: 8 });
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
        <style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head>
        <body>${svg(name, palette)}</body></html>`, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(OUT, "png", file + ".png"), omitBackground: true, clip: { x: 0, y: 0, width: L.w, height: L.h } });
      await page.pdf({ path: path.join(OUT, "pdf", file + ".pdf"), width: `${L.w}px`, height: `${L.h}px`, printBackground: true, pageRanges: "1" });
      await page.close();
      console.log("✓", file);
    }
  }
  await browser.close();
})();
