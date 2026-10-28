// Druck-PDF (85 × 55 mm + 3 mm Beschnitt), Vorschaubilder und WhatsApp-Bild der Visitenkarte
// Aufruf: NODE_PATH=$(npm root -g) node marke/_werkzeug/visitenkarte.js  (vorher visitenkarte.py)
const { chromium } = require("playwright");
const fs = require("fs"); const path = require("path");
const H = path.resolve(__dirname, "../.."); const ZIEL = path.join(H, "marke/visitenkarte");
// Schrift direkt einbetten (aus einer leeren Seite heraus lädt Chromium keine lokalen Dateien)
const font = "data:font/woff2;base64," + fs.readFileSync(path.join(H, "website/fonts/archivo-latin.woff2")).toString("base64");
const logo = fs.readFileSync(path.join(H, "marke/svg/tayfun-logo-rot.svg"), "utf8").replace(/ width="\d+" height="\d+"/, "");
const qr = fs.readFileSync(path.join(H, "marke/visitenkarte/Visitenkarte-QR.svg"), "utf8");
const basis = `<style>@font-face{font-family:A;src:url(${font}) format("woff2");font-weight:100 900;font-stretch:62% 125%}*{box-sizing:border-box;margin:0}body{font-family:A,Arial,sans-serif;color:#1F1B1B}</style>`;

// Vorderseite: rotes Feld mit Logo. Rückseite: Kontakt und QR-Code. Alles Wichtige mindestens 5 mm vom Rand.
const vorne = `<div style="width:91mm;height:61mm;background:#D7262E;display:grid;place-items:center">
  <div style="width:66mm">${logo}</div></div>`;
const hinten = `<div style="width:91mm;height:61mm;background:#fff;position:relative">
  <div style="position:absolute;left:8mm;top:8mm;right:34mm">
    <div style="font-weight:800;font-stretch:112%;font-size:13pt;line-height:1.1">Duran Ince</div>
    <div style="font-size:7.5pt;color:#6B6363;margin-top:.6mm">Inhaber · Tayfun Textilpflege</div>
    <div style="font-size:7.5pt;line-height:1.55;margin-top:3.2mm">
      An der Kirche 10<br>30457 Hannover-Wettbergen<br>
      <b>Tel. + WhatsApp</b> 0511 464252<br>info@tayfun-textilpflege.de<br>www.tayfun-textilpflege.de</div></div>
  <div style="position:absolute;right:8mm;top:8.5mm;width:23mm;text-align:center">
    <div style="width:23mm;height:23mm">${qr}</div>
    <div style="font-size:5.6pt;line-height:1.25;color:#6B6363;margin-top:.8mm">Scannen und<br>Kontakt speichern</div></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:7.5mm;background:#D7262E;color:#fff;font-size:6.4pt;display:flex;align-items:center;justify-content:center;padding-bottom:1.5mm">Mo, Di, Do, Fr 8–13 + 15–18 Uhr · Mi + Sa 8–13 Uhr</div></div>`;

// Für WhatsApp: hochkant, gut lesbar auf dem Handy
const whatsapp = `<div style="width:1080px;height:1350px;background:#F3F1EE;padding:60px;display:flex">
 <div style="background:#fff;border-radius:44px;overflow:hidden;flex:1;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.10)">
  <div style="background:#D7262E;padding:56px 70px 48px">${logo}</div>
  <div style="padding:52px 70px 0">
   <div style="font-size:64px;font-weight:800;font-stretch:112%;line-height:1.1">Duran Ince</div>
   <div style="font-size:32px;color:#6B6363;margin-top:6px">Inhaber · Tayfun Textilpflege</div>
   <div style="font-size:34px;line-height:1.55;margin-top:30px">An der Kirche 10 · 30457 Hannover-Wettbergen<br><b>Tel. + WhatsApp</b> 0511 464252<br>info@tayfun-textilpflege.de</div></div>
  <div style="display:flex;gap:40px;align-items:center;padding:36px 70px 0">
   <div style="width:360px;height:360px;flex:none">${qr}</div>
   <div style="font-size:34px;line-height:1.35">Mit der Handykamera scannen und <b>Kontakt speichern</b><div style="font-size:26px;color:#6B6363;margin-top:14px">tayfun-textilpflege.de/visitenkarte.html</div></div></div>
  <div style="margin-top:auto;background:#D7262E;color:#fff;font-size:28px;padding:22px 70px;text-align:center">Mo, Di, Do, Fr 8–13 + 15–18 Uhr · Mi + Sa 8–13 Uhr</div>
 </div></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(basis + `<style>@page{size:91mm 61mm;margin:0}.s{page-break-after:always}</style><div class="s">${vorne}</div><div>${hinten}</div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(ZIEL, "Visitenkarte-85x55mm-Druck-mit-3mm-Beschnitt.pdf"), width: "91mm", height: "61mm", printBackground: true });
  const v = await b.newPage({ deviceScaleFactor: 4 });
  for (const [name, html] of [["Vorderseite", vorne], ["Rueckseite", hinten]]) {
    await v.setContent(basis + `<div id="k" style="display:inline-block">${html}</div>`); await v.evaluate(() => document.fonts.ready);
    await v.locator("#k").screenshot({ path: path.join(ZIEL, `Visitenkarte-${name}-Vorschau.png`) });
  }
  const w = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await w.setContent(basis + whatsapp); await w.evaluate(() => document.fonts.ready);
  await w.screenshot({ path: path.join(ZIEL, "Visitenkarte-WhatsApp.png") });
  const q = await b.newPage({ viewport: { width: 1200, height: 1200 } });
  await q.setContent(`<style>*{margin:0}</style><div style="width:1200px;height:1200px">${qr}</div>`);
  await q.screenshot({ path: path.join(ZIEL, "Visitenkarte-QR.png") });
  await b.close(); console.log("✓ Druck-PDF, Vorschau, WhatsApp-Bild, QR-PNG");
})();
