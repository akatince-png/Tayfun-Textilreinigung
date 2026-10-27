// Abholschein als Bild – dieselbe Zeichnung im Ladenbuch und auf beleg.html der Website.
// Die Daten stehen im Link hinter dem # und gehen nie an den Server.
const SCHEIN = (() => {
  const BASIS = "https://www.tayfun-textilpflege.de/beleg.html#";
  const C39 = { "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
    A:"wnnnnwnnw",B:"nnwnnwnnw",C:"wnwnnwnnn",D:"nnnnwwnnw",E:"wnnnwwnnn",F:"nnwnwwnnn",G:"nnnnnwwnw",H:"wnnnnwwnn",I:"nnwnnwwnn",J:"nnnnwwwnn",
    K:"wnnnnnnww",L:"nnwnnnnww",M:"wnwnnnnwn",N:"nnnnwnnww",O:"wnnnwnnwn",P:"nnwnwnnwn",Q:"nnnnnnwww",R:"wnnnnnwwn",S:"nnwnnnwwn",T:"nnnnwnwwn",
    U:"wwnnnnnnw",V:"nwwnnnnnw",W:"wwwnnnnnn",X:"nwnnwnnnw",Y:"wwnnwnnnn",Z:"nwwnwnnnn","-":"nwnnnnwnw","*":"nwnnwnwnn" };

  // d = { v, n: Auftrag, c: Prüfzeichen, k: Vorname, a: angenommen, f: abholbereit ab, t: Teile,
  //       p: [[Menge, Name, Cent, Hinweis]], s: Summe in Cent, b: Kassenbeleg-Nr. oder "", z: Zahlart, m: [Vorschäden] }
  function packen(d) {
    let s = ""; new TextEncoder().encode(JSON.stringify(d)).forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function auspacken(t) {
    const s = atob(t.replace(/-/g, "+").replace(/_/g, "/"));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(s, (ch) => ch.charCodeAt(0))));
    if (!d || d.v !== 1 || !/^[A-Z]-\d+$/.test(d.n) || !Array.isArray(d.p)) throw new Error("kein Abholschein");
    return d;
  }
  const link = (d) => BASIS + packen(d);
  const code = (d) => `${d.n}-${d.c}`;
  const euro = (c) => (c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  function qr(text, size) {
    const box = document.createElement("div");
    new QRCode(box, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.L });
    // Kopie, weil qrcodejs seine eigene Canvas später ausblendet
    const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(box.querySelector("canvas"), 0, 0); return c;
  }

  // Zeichnet den Schein in doppelter Auflösung; logo = geladenes <img> oder null
  // Zwei Durchgänge: erst die Länge ausmessen, dann in genau dieser Länge zeichnen
  // opt.druck: weißer Hintergrund ohne Schatten, für den Bondrucker
  function zeichnen(d, logo, opt = {}) { return malen(d, logo, malen(d, logo, 4000, opt).height, opt); }
  function malen(d, logo, H, opt) {
    const W = 600, R = 40, X = R + 36, IW = W - 72, MONO = 'ui-monospace, Menlo, "Courier New", monospace', SANS = 'Archivo, "Arial Black", "Helvetica Neue", Arial, sans-serif';
    const cv = document.createElement("canvas"); cv.width = W + 2 * R; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = opt.druck ? "#fff" : "#e9e6e1"; g.fillRect(0, 0, cv.width, H);
    // Papier mit gezacktem Abriss oben und unten
    const z = 12, top = 24, bot = H - 24;
    g.save(); g.shadowColor = opt.druck ? "transparent" : "rgba(0,0,0,.18)"; g.shadowBlur = 18; g.shadowOffsetY = 4; g.fillStyle = "#fffefa";
    g.beginPath(); g.moveTo(R, top);
    for (let x = R; x < R + W; x += z) { g.lineTo(x + z / 2, top - 8); g.lineTo(x + z, top); }
    g.lineTo(R + W, bot);
    for (let x = R + W; x > R; x -= z) { g.lineTo(x - z / 2, bot + 8); g.lineTo(x - z, bot); }
    g.closePath(); g.fill(); g.restore();

    let y = top + 30;
    const txt = (t, x, f, al = "left", c = "#151515") => { g.font = f; g.fillStyle = c; g.textAlign = al; g.fillText(t, x, y); };
    const mitte = (t, f, c) => txt(t, W / 2 + R, f, "center", c);
    const strich = () => { y += 18; g.save(); g.strokeStyle = "#555"; g.setLineDash([8, 7]); g.lineWidth = 2; g.beginPath(); g.moveTo(X, y); g.lineTo(X + IW, y); g.stroke(); g.restore(); y += 28; };
    const kuerzen = (t, f, max) => { g.font = f; if (g.measureText(t).width <= max) return t; while (t.length > 1 && g.measureText(t + "…").width > max) t = t.slice(0, -1); return t + "…"; };

    if (logo) { const lh = IW * logo.naturalHeight / logo.naturalWidth; g.drawImage(logo, X, y, IW, lh); y += lh + 34; }
    else { y += 40; mitte("TAYFUN", `800 54px ${SANS}`, "#d7262f"); y += 34; mitte("T E X T I L P F L E G E", `600 22px ${SANS}`, "#d7262f"); y += 34; }
    mitte("An der Kirche 10 · 30457 Hannover", `22px ${MONO}`); y += 28;
    mitte("Tel. + WhatsApp 0511 464252", `22px ${MONO}`); strich();

    y += 8; mitte("A B H O L S C H E I N", `700 26px ${MONO}`); y += 72;
    mitte(d.n, `800 76px ${SANS}`); y += 22;
    const q = qr("TAYFUN " + code(d), 220); g.drawImage(q, W / 2 + R - 110, y, 220, 220); y += 220 + 40;
    mitte("Abholcode: " + code(d), `700 26px ${MONO}`); strich();

    const info = [[d.k ? "Kunde:" : "", d.k || ""], ["Angenommen:", d.a], ["Abholbereit ab:", d.f, 1], ["Teile:", String(d.t)]].filter((r) => r[0]);
    info.forEach(([a, b, fett]) => { txt(a, X, `${fett ? "700 " : ""}24px ${MONO}`); txt(b, X + IW, `${fett ? "700 " : ""}24px ${MONO}`, "right"); y += 34; });
    y -= 34; strich();

    d.p.forEach(([m, name, cent, hinweis]) => {
      const f = `24px ${MONO}`; const preis = euro(cent);
      g.font = f; const pw = g.measureText(preis).width;
      txt(kuerzen(`${m} ${name}`, f, IW - pw - 20), X, f); txt(preis, X + IW, f, "right"); y += 34;
      if (hinweis) { txt("  * " + hinweis, X, `20px ${MONO}`, "left", "#555"); y += 34; }
    });
    y -= 34; strich();
    y += 6; txt("SUMME", X, `800 34px ${SANS}`); txt(euro(d.s), X + IW, `800 34px ${SANS}`, "right"); y += 26;
    g.lineWidth = 3; g.strokeStyle = "#151515"; g.strokeRect(X, y, IW, 58);
    y += 39; mitte(d.b ? `BEZAHLT · ${d.z || ""} · Beleg ${d.b}`.replace(" ·  ·", " ·") : "ZAHLBAR BEI ABHOLUNG", `700 24px ${MONO}`); y += 19; strich();

    // Vorschäden, die bei der Annahme mit dem Kunden festgehalten wurden
    if (d.m && d.m.length) {
      txt("Bei Annahme festgestellt:", X, `700 22px ${MONO}`); y += 32;
      // Zeilen umbrechen statt abschneiden – der Kunde soll den ganzen Vermerk lesen können
      const umbrechen = (s, f) => { g.font = f; const out = []; let z = ""; s.split(" ").forEach((w) => { const t2 = z ? z + " " + w : w; if (g.measureText(t2).width > IW && z) { out.push(z); z = "  " + w; } else z = t2; }); if (z) out.push(z); return out; };
      d.m.slice(0, 12).forEach((z) => umbrechen("- " + z, `21px ${MONO}`).forEach((zeile) => { txt(kuerzen(zeile, `21px ${MONO}`, IW), X, `21px ${MONO}`); y += 30; }));
      if (d.m.length > 12) { txt(`  … und ${d.m.length - 12} weitere`, X, `21px ${MONO}`); y += 30; }
      y -= 30; strich();
    }

    mitte("Mo, Di, Do, Fr  8–13 + 15–18 Uhr", `21px ${MONO}`); y += 30;
    mitte("Mi + Sa  8–13 Uhr", `21px ${MONO}`); y += 30;
    mitte("Bitte bei der Abholung vorzeigen.", `21px ${MONO}`); y += 30;
    mitte("Dies ist kein Kassenbeleg.", `21px ${MONO}`, "#555"); y += 26;

    // Strichcode (Code 39) mit dem Abholcode
    strichcode(g, code(d), W / 2 + R, y, IW, 80);
    y += 80 + 30; mitte(code(d), `22px ${MONO}`);
    if (H === 4000) return { height: y + 60 };
    return cv;
  }

  // Code-39-Strichcode, mittig um cx, höchstens maxB breit
  function strichcode(g, text, cx, y, maxB, h) {
    const bars = []; let bx = 0;
    for (const ch of "*" + text.toUpperCase() + "*") { [...(C39[ch] || C39["-"])].forEach((k, i) => { const w = k === "w" ? 3 : 1; if (i % 2 === 0) bars.push([bx, w]); bx += w; }); bx += 1; }
    const s = Math.min(3, maxB / bx), x0 = cx - bx * s / 2;
    g.fillStyle = "#151515"; bars.forEach(([x, w]) => g.fillRect(x0 + x * s, y, w * s, h));
  }

  // Als PNG-Datei; Name ohne Sonderzeichen
  const datei = (cv, d) => new Promise((ok) => cv.toBlob((b) => ok(new File([b], `Abholschein-${d.n}.png`, { type: "image/png" })), "image/png"));

  return { BASIS, packen, auspacken, link, code, zeichnen, datei, qr, strichcode };
})();
