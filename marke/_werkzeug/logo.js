// Erzeugt das Tayfun-Logo nach dem Ladenschild (rotes Feld, Kreis mit zwei T, TAYFUN / TEXTILPFLEGE)
// als SVG (Schrift eingebettet), PNG (8-fach, transparent wo kein Rot) und PDF (Vektor).
// Aufruf (in diesem Ordner): NODE_PATH=$(npm root -g) node logo.js
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const OUT = path.resolve(__dirname, "..");
const F = "data:font/woff2;base64," + fs.readFileSync(path.join(OUT, "schriften/archivo-latin.woff2")).toString("base64");
const RED = "#D7262E", WHITE = "#FFFFFF";
const mono = c => `<circle cx="50" cy="50" r="46" fill="none" stroke="${c}" stroke-width="2.6"/>
<rect x="18" y="20" width="35" height="9" fill="${c}"/><path d="M28 29H38V76H48V84H37Q28 84 28 75Z" fill="${c}"/>
<rect x="45" y="31" width="40" height="8.5" fill="${c}"/><path d="M63 39.5H73V75Q73 84 64 84H53V76H63Z" fill="${c}"/>`;
const style = `<style>@font-face{font-family:"Archivo Logo";src:url(${F}) format("woff2");font-weight:100 900;font-stretch:62% 125%}
.t1{font-family:"Archivo Logo",Arial,sans-serif;font-weight:800;font-stretch:125%;font-size:84px}
.t2{font-family:"Archivo Logo",Arial,sans-serif;font-weight:360;font-stretch:125%;font-size:37px}</style>`;
const LOGOS = {
  "logo-rot": [560, 156, (c) => `<rect width="560" height="156" fill="${RED}"/>` + body(WHITE)],
  "logo-auf-weiss": [560, 156, () => body(RED)],
  "logo-negativ": [560, 156, () => body(WHITE)],
  "monogramm-rot": [120, 120, () => `<rect width="120" height="120" fill="${RED}"/><g transform="translate(10 10)">${mono(WHITE)}</g>`],
  "monogramm-auf-weiss": [120, 120, () => `<g transform="translate(10 10)">${mono(RED)}</g>`]
};
function body(c) {
  return `<g transform="translate(16 16) scale(1.24)">${mono(c)}</g>
<text class="t1" x="160" y="94" fill="${c}" textLength="378" lengthAdjust="spacingAndGlyphs">TAYFUN</text>
<text class="t2" x="162" y="139" fill="${c}" textLength="374" lengthAdjust="spacing">TEXTILPFLEGE</text>`;
}
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  for (const d of ["svg", "png", "pdf"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  for (const [name, [w, h, fn]] of Object.entries(LOGOS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${style}${fn()}</svg>`;
    const file = `tayfun-${name}`;
    fs.writeFileSync(path.join(OUT, "svg", file + ".svg"), svg);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 8 });
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, "png", file + ".png"), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.pdf({ path: path.join(OUT, "pdf", file + ".pdf"), width: `${w}px`, height: `${h}px`, printBackground: true, pageRanges: "1" });
    await page.close();
    console.log("✓", file);
  }
  // Website: Favicon, Apple-Touch-Icon, Logo-Bild für Suchmaschinen
  const site = path.resolve(OUT, "../website/assets");
  fs.writeFileSync(path.join(site, "tayfun-monogramm.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="14" fill="${RED}"/><g transform="translate(10 10)">${mono(WHITE)}</g></svg>`);
  const p2 = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await p2.setContent(`<!doctype html><style>html,body{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="180" height="180"><rect width="120" height="120" fill="${RED}"/><g transform="translate(10 10)">${mono(WHITE)}</g></svg>`);
  await p2.screenshot({ path: path.join(site, "apple-touch-icon.png"), clip: { x: 0, y: 0, width: 180, height: 180 } });
  fs.copyFileSync(path.join(OUT, "png", "tayfun-logo-rot.png"), path.join(site, "tayfun-logo-rot.png"));
  await browser.close();
  console.log("✓ Website-Symbole");
})();
