(function () {
  // ---------------------------------------------------------------- Stammdaten
  const VERSION = "1.8.0";
  let STORES = { W: "Wettbergen" };
  const CATS = ["Garderobe", "Hemden", "Haushalt", "Gardinen", "Leder", "Schuhe & Schlüssel"];
  const ITEMS = [
    ["hemd", "Hemd, hängend", "Hemden", 325], ["hemd-g", "Hemd, gelegt", "Hemden", 460], ["bluse", "Bluse", "Hemden", 720],
    ["hose", "Hose", "Garderobe", 1020], ["anzug", "Anzug (Sakko + Hose)", "Garderobe", 2340], ["jacke", "Jacke / Sakko", "Garderobe", 1320],
    ["rock", "Rock", "Garderobe", 900], ["kleid", "Kleid", "Garderobe", 1360], ["mantel", "Mantel", "Garderobe", 2000],
    ["pullover", "Pullover", "Garderobe", 580], ["daunenjacke", "Daunenjacke mit Imprägnierung", "Garderobe", 3110], ["krawatte", "Krawatte", "Garderobe", 790],
    ["wolldecke", "Wolldecke", "Haushalt", 1030], ["kissen", "Kissen, Daunenkissen", "Haushalt", 1810], ["bettdecke", "Daunenbettdecke", "Haushalt", 3320], ["tischdecke", "Tischdecke", "Haushalt", 1230],
    ["gardine", "Synthetische Gardinen, pro m²", "Gardinen", 320, "m²"], ["vorhang", "Vorhänge, pro kg", "Gardinen", 1200, "kg"],
    ["lederjacke", "Lederjacke bis 80 cm", "Leder", 6100], ["ledermantel", "Ledermantel", "Leder", 7900],
    // Fremdleistungen über den Partnerbetrieb: Preis wird bei der Annahme eingetragen
    ["schuh", "Schuhreparatur", "Schuhe & Schlüssel", 0, "Stk", true], ["schuhpflege", "Schuhpflege / Färben", "Schuhe & Schlüssel", 0, "Stk", true],
    ["schluessel", "Schlüssel nachmachen", "Schuhe & Schlüssel", 0, "Stk", true], ["fremd", "Sonstige Fremdleistung", "Schuhe & Schlüssel", 0, "Stk", true],
  ].map(([id, name, cat, price, unit, frei]) => ({ id, name, cat, price, unit: unit || "Stk", frei: !!frei }));
  const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

  // Angebote aus dem Schaufenster – werden beim Erfassen automatisch gerechnet
  function unitPrice(id, weekday, lines) {
    if (weekday === 2 && id === "hose") return [895, "Dienstagsangebot"];
    if (weekday === 2 && id === "hemd") {
      const n = lines.filter((l) => l.id === "hemd").reduce((s, l) => s + l.qty, 0);
      if (n >= 10) return [249, "Dienstags ab 10 Hemden"];
    }
    if (weekday === 5 && id === "anzug") return [1990, "Freitagsangebot"];
    return [ITEM[id].price, ""];
  }
  // Preis einer Zeile: bei Fremdleistungen der bei der Annahme eingetragene Preis
  const linePrice = (l, weekday, lines) => (ITEM[l.id].frei ? [l.preis || 0, ""] : unitPrice(l.id, weekday, lines));
  const lineName = (l) => ITEM[l.id].name + (l.text ? `: ${l.text}` : "");
  const teilName = (it) => ITEM[it.id].name + (it.text ? ` (${it.text})` : "");
  const total = (o) => o.lines.reduce((s, l) => s + l.qty * linePrice(l, D(o.date).getDay(), o.lines)[0], 0);
  const pieces = (o) => o.lines.reduce((s, l) => s + (ITEM[l.id].unit === "Stk" ? l.qty : 1), 0);

  // ---------------------------------------------------------------- Hilfen
  const euro = (c) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const DAY = 864e5;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = (d) => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
  const D = (s) => new Date(s + "T00:00");
  const fmtDate = (s) => D(s).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const daysSince = (s) => Math.round((today0() - new Date(s + "T00:00")) / DAY);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function addWorkdays(d, n) { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0) n--; } return x; }

  // ---------------------------------------------------------------- Speicher auf dem Gerät (IndexedDB)
  // Alle Kunden und Aufträge liegen zusätzlich auf dem Gerät. So läuft der Laden auch ohne Internet weiter.
  const IDB = (() => {
    let offen;
    const db = () => (offen ||= new Promise((ok, no) => {
      const r = indexedDB.open("ladenbuch", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("daten", { keyPath: "k" }); d.createObjectStore("ausstehend", { keyPath: "k" }); d.createObjectStore("meta"); };
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }));
    async function tx(stores, mode, fn) {
      const d = await db();
      return new Promise((ok, no) => { const t = d.transaction(stores, mode); const res = fn(t); t.oncomplete = () => ok(res && "result" in res && res instanceof IDBRequest ? res.result : res); t.onerror = t.onabort = () => no(t.error); });
    }
    const alle = (store) => tx([store], "readonly", (t) => { const out = []; t.objectStore(store).openCursor().onsuccess = (e) => { const c = e.target.result; if (c) { out.push(c.value); c.continue(); } }; return out; });
    const meta = (k) => tx(["meta"], "readonly", (t) => t.objectStore("meta").get(k));
    const setzeMeta = (k, v) => tx(["meta"], "readwrite", (t) => { t.objectStore("meta").put(v, k); });
    const leeren = () => tx(["daten", "ausstehend", "meta"], "readwrite", (t) => ["daten", "ausstehend", "meta"].forEach((s) => t.objectStore(s).clear()));
    return { tx, alle, meta, setzeMeta, leeren };
  })();

  let db = { customers: [], orders: [], tickets: [], mitarbeiter: [] };
  let meta = { rev: 0, nummern: {} };
  const ausstehend = new Map(); // k -> Änderungszähler; noch nicht beim Server
  let aenderung = 0;
  const save = () => IDB.setzeMeta("meta", meta).catch(() => {});

  async function laden() {
    const [daten, offenes, m] = await Promise.all([IDB.alle("daten"), IDB.alle("ausstehend"), IDB.meta("meta")]);
    db = { customers: daten.filter((x) => x.typ === "kunde").map((x) => x.daten), orders: daten.filter((x) => x.typ === "auftrag").map((x) => x.daten), tickets: daten.filter((x) => x.typ === "ticket").map((x) => x.daten), mitarbeiter: daten.filter((x) => x.typ === "mitarbeiter").map((x) => x.daten) };
    offenes.forEach((x) => { ausstehend.set(x.k, x.v); aenderung = Math.max(aenderung, x.v); });
    if (m) meta = m;
    if (meta.geschaefte) STORES = meta.geschaefte;
  }

  // Jede Änderung: sofort auf dem Gerät speichern und zum Abgleich vormerken
  function change(...recs) {
    recs.filter(Boolean).forEach((x) => {
      const typ = x.ticket ? "ticket" : x.mitarbeiter ? "mitarbeiter" : x.nr ? "auftrag" : "kunde"; const id = x.ticket || x.mitarbeiter ? x.id : x.nr || x.id; const k = typ + ":" + id; const v = ++aenderung;
      ausstehend.set(k, v);
      const daten = JSON.parse(JSON.stringify(x));
      IDB.tx(["daten", "ausstehend"], "readwrite", (t) => { t.objectStore("daten").put({ k, typ, id, daten }); t.objectStore("ausstehend").put({ k, typ, id, daten, v }); }).catch(() => toast("Speichern auf dem Gerät fehlgeschlagen"));
    });
    renderSync(); clearTimeout(change.t); change.t = setTimeout(sync, 400);
  }

  // ---------------------------------------------------------------- Abgleich mit dem Server
  const API = window.LADENBUCH_API || "api.php";
  const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
  let token = LS.get("lb-token");
  let syncZustand = "ok"; // ok | busy | offline
  async function api(a, body, extra = "") {
    let r;
    try {
      r = await fetch(`${API}?a=${a}${extra}`, { method: body ? "POST" : "GET", cache: "no-store", headers: { "Content-Type": "application/json", "X-Ladenbuch-Token": token || "" }, body: body ? JSON.stringify(body) : undefined });
    } catch { throw Object.assign(new Error("Keine Verbindung"), { status: 0 }); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.fehler || "Fehler " + r.status), { status: r.status });
    return d;
  }
  let laeuft = false, nochmal = false;
  async function sync() {
    if (!token) return;
    if (laeuft) { nochmal = true; return; }
    laeuft = true; syncZustand = "busy"; renderSync();
    let neu = false;
    try {
      if (ausstehend.size) {
        const liste = await IDB.alle("ausstehend");
        for (let i = 0; i < liste.length; i += 200) {
          const teil = liste.slice(i, i + 200);
          await api("push", { aenderungen: teil.map(({ typ, id, daten }) => ({ typ, id, daten })) });
          // Nur entfernen, was seitdem nicht noch einmal geändert wurde
          const fertig = teil.filter((x) => ausstehend.get(x.k) === x.v);
          fertig.forEach((x) => ausstehend.delete(x.k));
          await IDB.tx(["ausstehend"], "readwrite", (t) => fertig.forEach((x) => t.objectStore("ausstehend").delete(x.k)));
        }
      }
      let mehr = true;
      while (mehr) {
        const r = await api("sync", null, `&seit=${meta.rev}`);
        const rein = r.daten.filter((x) => !ausstehend.has(x.typ + ":" + x.id));
        if (rein.length) {
          neu = true;
          await IDB.tx(["daten"], "readwrite", (t) => rein.forEach((x) => t.objectStore("daten").put({ k: x.typ + ":" + x.id, typ: x.typ, id: x.id, daten: x.daten })));
          rein.forEach((x) => {
            const liste = x.typ === "kunde" ? db.customers : x.typ === "ticket" ? tickets() : x.typ === "mitarbeiter" ? mitarbeiter() : db.orders; const feld = x.typ === "auftrag" ? "nr" : "id";
            const i = liste.findIndex((y) => y[feld] === x.id);
            if (i >= 0) liste[i] = x.daten; else liste.push(x.daten);
          });
        }
        meta.rev = r.rev; mehr = r.mehr;
        if (JSON.stringify(r.geschaefte) !== JSON.stringify(meta.geschaefte)) { meta.geschaefte = r.geschaefte; STORES = r.geschaefte; neu = true; }
        meta.geraet = r.geraet; meta.rolle = r.rolle || "laden";
      }
      await save();
      await nummernAuffuellen();
      syncZustand = "ok";
    } catch (e) {
      if (e.status === 401) { abmelden(false); toast("Bitte neu anmelden"); }
      syncZustand = "offline";
    } finally {
      laeuft = false;
      if (neu && !document.querySelector("dialog[open]")) render(); else renderSync();
      if (nochmal) { nochmal = false; sync(); }
    }
  }
  setInterval(() => { if (document.visibilityState === "visible") sync(); }, 20000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && sync());
  addEventListener("online", sync);
  addEventListener("offline", () => { syncZustand = "offline"; renderSync(); });

  // Nummernblöcke: der Server reserviert sie, damit auch offline jede Nummer nur einmal vergeben wird
  const BLOCK = { auftrag: [30, 10], kunde: [30, 10], ticket: [10, 3] };
  const rest = (key) => (meta.nummern[key] || []).reduce((s, [von, bis]) => s + bis - von + 1, 0);
  async function nummernAuffuellen() {
    if (meta.rolle === "werkstatt") return; // Werkstatt legt nichts Neues an
    const keys = ["kunde", "ticket", ...Object.keys(STORES).map((g) => "auftrag:" + g)];
    for (const key of keys) {
      const [art, g] = key.split(":"); const [gross, min] = BLOCK[art];
      if (rest(key) >= min) continue;
      const r = await api("nummern", { art, geschaeft: g || "W", anzahl: gross });
      (meta.nummern[key] ||= []).push([r.von, r.bis]);
      await save();
    }
  }
  function naechsteNummer(key) {
    const bl = meta.nummern[key] || [];
    while (bl.length && bl[0][0] > bl[0][1]) bl.shift();
    if (!bl.length) throw new Error("Keine freien Nummern auf diesem Gerät – bitte kurz mit dem Internet verbinden.");
    const n = bl[0][0]++; save(); return n;
  }

  // ---------------------------------------------------------------- Anmeldung
  function abmelden(beimServer) {
    if (beimServer && token) api("abmelden", {}).catch(() => {});
    token = null; LS.set("lb-token", null);
    document.getElementById("app").hidden = true; document.getElementById("login").hidden = false;
  }
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const info = document.getElementById("l-info"); info.textContent = "Anmelden …";
    try {
      const r = await api("login", { geraet: document.getElementById("l-geraet").value, passwort: document.getElementById("l-pass").value });
      // Anderes Konto oder neues Gerät: lokale Daten nur übernehmen, wenn nichts mehr aussteht
      token = r.token; LS.set("lb-token", token); document.getElementById("l-pass").value = ""; meta.rolle = r.rolle || "laden"; ui.view = meta.rolle === "werkstatt" ? "werkstatt" : "heute";
      info.textContent = "Daten werden geladen …";
      await sync(); await starten();
    } catch (err) { info.textContent = err.status === 0 ? "Keine Internetverbindung. Für die erste Anmeldung wird Internet gebraucht." : err.message; }
  });

  let ui = { view: "heute", store: Object.keys(STORES)[0], filter: "offen", q: "", cat: "Garderobe", draft: newDraft(), openOrder: null, openCust: null };
  function newDraft() { return { cust: null, custQ: "", date: iso(today0()), due: iso(addWorkdays(today0(), 3)), lines: [] }; }

  const inStore = (o) => ui.store === "ALL" || o.store === ui.store;
  const LAUF = { id: "LAUF", name: "Laufkunde (ohne Namen)", tel: "–" };
  const UNBEKANNT = { id: "?", name: "(Kunde wird geladen)", tel: "–" };
  const cust = (id) => (id === "LAUF" ? LAUF : db.customers.find((c) => c.id === id) || UNBEKANNT);
  const geschaeft = (g) => STORES[g] || g;
  // Teile-Kartei: jedes Kleidungsstück bekommt eine eigene Nummer (Geschäftskürzel + laufende Zahl), unabhängig davon, ob der Kunde bekannt ist
  const STATIONEN = [["angenommen", "Angenommen"], ["reinigung", "In Reinigung"], ["finish", "Bügeln & Finish"], ["extern", "Extern (Partner)"], ["fertig", "Fertig im Regal"], ["kundendienst", "Kundendienst"], ["ausgegeben", "Ausgegeben"], ["storniert", "Storniert"]];
  const ST = Object.fromEntries(STATIONEN);
  const stPill = (s) => `<span class="st st-${s}">${ST[s]}</span>`;
  function makeItems(o, d) {
    const out = [];
    o.lines.forEach((l) => { const n = ITEM[l.id].unit === "Stk" ? l.qty : 1; for (let i = 0; i < n; i++) out.push({ tnr: `${o.nr}-${out.length + 1}`, id: l.id, ...(l.text ? { text: l.text } : {}), st: "angenommen", platz: "", log: [{ am: d || o.date, st: "angenommen" }] }); });
    return out;
  }
  const allItems = () => db.orders.flatMap((o) => (o.items || []).map((it) => ({ it, o })));
  function setItem(it, st, platz, d) { it.st = st; if (platz !== undefined) it.platz = platz; it.log.push({ am: d || iso(today0()), st, platz: it.platz || "" }); }
  function syncOrder(o) {
    if (!o.items || o.status === "storniert" || o.status === "abgeholt") return "";
    if ((o.status === "arbeit" || o.status === "kundendienst") && o.items.every((it) => it.st === "fertig" || it.st === "ausgegeben") && o.items.some((it) => it.st === "fertig")) { o.status = "bereit"; return ` · Auftrag ${o.nr} komplett, jetzt abholbereit`; }
    return "";
  }
  function renderSync() {
    const el = document.getElementById("sync"); const n = ausstehend.size;
    const offline = syncZustand === "offline" || navigator.onLine === false;
    el.className = "sync" + (offline ? " off" : syncZustand === "busy" ? " busy" : "");
    el.textContent = offline ? `Offline${n ? ` · ${n} ${n === 1 ? "Änderung wartet" : "Änderungen warten"}` : ""}` : syncZustand === "busy" || n ? "Wird abgeglichen …" : "Synchronisiert";
  }

  function toast(t) {
    const el = document.getElementById("toast"); el.textContent = t; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2600);
  }

  // ---------------------------------------------------------------- Bausteine
  const STATUS = { arbeit: ["In Arbeit", "p-arbeit"], bereit: ["Abholbereit", "p-bereit"], kundendienst: ["Kundendienst", "p-kd"], abgeholt: ["Abgeholt", "p-abgeholt"], storniert: ["Storniert", "p-storno"] };
  const zaehlt = (o) => o.status !== "storniert";
  const KD_GRUENDE = ["Fleck nicht entfernt", "Schaden am Teil", "Verfärbt", "Eingelaufen / verformt", "Knopf oder Reißverschluss", "Teil fehlt / vertauscht", "Falsch gebügelt", "Sonstiges"];
  function pill(o) {
    const [t, c] = STATUS[o.status];
    if (o.status === "bereit" && daysSince(o.due) > 14) return `<span class="pill p-alt">Seit ${daysSince(o.due)} Tagen abholbereit</span>`;
    return `<span class="pill ${c}">${t}</span>`;
  }
  function orderRow(o) {
    const c = cust(o.cust);
    return `<button class="row" data-order="${o.nr}" type="button">
      <span class="t">${esc(c.name)}</span>
      <span class="s num">${o.nr} · ${pieces(o)} Teile · abholbar ${fmtDate(o.due)}${ui.store === "ALL" ? " · " + geschaeft(o.store) : ""}</span>
      <span class="r"><b class="num">${euro(total(o))}</b>${pill(o)}</span></button>`;
  }
  const list = (arr, none) => arr.length ? `<div class="list">${arr.map(orderRow).join("")}</div>` : `<p class="empty">${none}</p>`;

  // Code 39 Strichcode für die Auftragsnummer (Scanner können ihn ohne Zusatzsoftware lesen)
  function tags(o) {
    const its = o.items || []; const out = its.slice(0, 12).map((it) => `<span class="tag">${rot(it) ? "● " : ""}${teilLabel(o, it)} · ${esc(teilName(it))}</span>`);
    return `<div class="tags" aria-label="Etiketten">${out.join("")}${its.length > 12 ? `<span class="tag">…</span>` : ""}</div>`;
  }
  // Abholcode = Auftragsnummer + 4 Prüfzeichen; nur wer den Schein (Papier oder Handy) hat, kennt die Prüfzeichen
  function genCode() { return Array.from({ length: 4 }, () => "ACDEFHJKMNPRTUVWXY34679"[Math.floor(Math.random() * 23)]).join(""); }
  const abholcode = (o) => `${o.nr}-${o.code}`;
  const handyNr = (tel) => { const n = (tel || "").replace(/\D/g, ""); return n.startsWith("0") ? "49" + n.slice(1) : n.startsWith("49") ? n : ""; };
  const vorname = (c) => (c.id === "LAUF" ? "" : c.name.split(" ")[0]);
  const langDatum = (s) => D(s).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

  // Abholschein als Bild (SCHEIN, oben): dieselbe Zeichnung wie auf beleg.html der Website
  function belegDaten(o) {
    const c = cust(o.cust); const wd = D(o.date).getDay();
    return { v: 1, n: o.nr, c: o.code, k: vorname(c), a: langDatum(o.date), f: langDatum(o.due), t: pieces(o),
      p: o.lines.map((l) => { const [p, why] = linePrice(l, wd, o.lines); const u = ITEM[l.id].unit; return [u === "Stk" ? `${l.qty}x` : `${l.qty} ${u}`, lineName(l), p * l.qty, why || ""]; }),
      s: total(o), b: o.paid ? o.paid.beleg : "", z: o.paid ? o.paid.art : "",
      m: (o.items || []).flatMap((it) => maengelVon(it).filter((m) => m.zeit === "annahme").map((m) => `${teilName(it)}: ${m.art}${m.notiz ? " (" + m.notiz + ")" : ""}`)) };
  }
  const LOGO = new Image(); LOGO.src = "logo.png";
  const scheinBild = (o) => SCHEIN.zeichnen(belegDaten(o), LOGO.complete && LOGO.naturalWidth ? LOGO : null);
  function scheinText(o) {
    const v = vorname(cust(o.cust));
    return `Guten Tag${v ? " " + v : ""}, hier ist Ihr Abholschein von Tayfun Textilpflege:\n${SCHEIN.link(belegDaten(o))}\n\nAbholcode: ${abholcode(o)}\nAbholbereit ab ${fmtDate(o.due)}\nBitte bei der Abholung vorzeigen.`;
  }
  // Kundenansicht: iPad zum Kunden drehen, er scannt den Code und hat den Schein als Seite/Bild auf dem Handy
  function zeigen(o) {
    const dlg = document.createElement("dialog"); dlg.className = "kunde-ansicht";
    dlg.innerHTML = `<div class="ka-qr"><div class="ka-code"></div><b>Handykamera auf den Code halten</b><span>Ihr Abholschein öffnet sich und lässt sich als Bild speichern. Oder fotografieren Sie einfach den Schein.</span><button class="btn" type="button">Fertig</button></div><img class="ka-schein" alt="Abholschein ${o.nr}">`;
    document.body.append(dlg);
    const link = SCHEIN.link(belegDaten(o));
    if (window.QRCode) dlg.querySelector(".ka-code").append(SCHEIN.qr(link, 300)); else dlg.querySelector(".ka-code").textContent = "QR-Code lädt nicht (offline)";
    dlg.querySelector(".ka-schein").src = scheinBild(o).toDataURL("image/png");
    dlg.querySelector("button").addEventListener("click", () => dlg.close());
    dlg.addEventListener("close", () => dlg.remove());
    dlg.showModal();
  }
  // Bild teilen: auf dem iPad öffnet sich „Teilen“ (WhatsApp, AirDrop, Nachrichten …); sonst als Datei speichern
  async function teilen(o) {
    const d = belegDaten(o); const file = await SCHEIN.datei(scheinBild(o), d);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Abholschein ${o.nr}` }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function payBox(o) {
    if (o.paid) return `<div class="pay ok"><b>Bezahlt</b><span class="num">Kassenbeleg ${esc(o.paid.beleg)} · ${esc(o.paid.art)} · ${fmtDate(o.paid.am)}</span></div>`;
    return `<div class="pay"><b>Bezahlung an der Kasse vermerken</b>
      <div class="row2"><label class="field" for="p-beleg">Beleg-Nr. der Kasse<input id="p-beleg" inputmode="numeric" placeholder="z. B. 1234" autocomplete="off"></label>
      <label class="field" for="p-art">Zahlart<select id="p-art"><option>Karte</option><option>Bar</option></select></label></div>
      <button class="btn small" data-pay type="button">Als bezahlt vermerken</button>
      <span class="hint">Kassieren in der Kasse, dort die Auftragsnummer ${o.nr} als Notiz eintragen.</span></div>`;
  }

  function orderDetail(o) {
    const c = cust(o.cust); const wd = D(o.date).getDay();
    const lines = o.lines.map((l) => { const [p, why] = linePrice(l, wd, o.lines); return `<div class="line"><span class="num">${l.qty} ${ITEM[l.id].unit === "Stk" ? "×" : ITEM[l.id].unit}</span><span class="n">${esc(lineName(l))}${why ? `<small>${why}</small>` : ""}</span><b class="num">${euro(p * l.qty)}</b></div>`; }).join("");
    const next = o.status === "arbeit" || o.status === "kundendienst" ? `<button class="btn" data-set="bereit" type="button">Fertig – abholbereit</button>` : o.status === "bereit" ? `<button class="btn" data-set="abgeholt" type="button">Abgeholt</button>` : "";
    const warn = o.status === "bereit" && !o.paid ? `<span class="pay-warn">Noch nicht bezahlt – vor der Ausgabe kassieren.</span>` : "";
    const ts = ticketsZu(o.nr);
    const kdBox = o.status === "storniert" ? "" : `<div class="kd"><b>Kundendienst</b>${ts.length ? tList(ts, "") : `<span class="mini">Keine Reklamation zu diesem Auftrag.</span>`}
      <div><button class="btn small" data-treklam="${o.nr}" type="button">Reklamation aufnehmen</button></div></div>`;
    const storno = o.status === "storniert" ? `<p class="hint">Storniert am ${fmtDate(o.storniertAm)}. Zählt nicht in Umsatz und Auswertung.</p>`
      : o.status === "abgeholt" ? "" : ui.askStorno === o.nr ? `<div class="storno-ask">Auftrag wirklich stornieren? <button class="btn small" data-storno type="button">Ja, stornieren</button><button class="btn ghost small" data-nostorno type="button">Nein</button></div>`
      : `<div><button class="btn ghost small" data-askstorno type="button">Auftrag stornieren</button></div>`;
    return `<div class="panel detail-grid"><div class="detail"><h2>Auftrag ${o.nr}</h2>
      <dl><dt>Kunde</dt><dd>${esc(c.name)} · <span class="num">${c.tel}</span></dd><dt>Geschäft</dt><dd>${esc(geschaeft(o.store))}</dd>
      <dt>Angenommen</dt><dd>${fmtDate(o.date)}</dd><dt>Abholbar ab</dt><dd>${fmtDate(o.due)}</dd><dt>Status</dt><dd>${pill(o)}</dd></dl>
      <div class="lines">${lines}</div><div class="total"><span>Summe</span><span class="num">${euro(total(o))}</span></div>
      ${teileZustand(o)}
      ${o.status === "storniert" ? "" : payBox(o)}
      ${digitalBox(o)}
      ${kdBox}
      <div class="chips">${next}<button class="btn ghost" data-close type="button">Schließen</button></div>${druckBox(o)}${warn}${storno}</div>
      <div class="receipt-wrap"><img class="schein-img" data-schein="${o.nr}" alt="Abholschein ${o.nr}, Abholcode ${abholcode(o)}"><span class="hint">Etiketten für die Teile</span>${tags(o)}</div></div>`;
  }

  // ---------------------------------------------------------------- Leitungsbereich: Geräte, Passwort, PIN, Sicherung
  function leitungFehler(err) {
    if (err.status === 403) { ui.mgmt = false; render(); toast("Leitungsbereich abgelaufen – bitte PIN neu eingeben"); }
    else toast(err.status === 0 ? "Dafür wird Internet gebraucht" : err.message);
  }
  async function ladeGeraete() {
    try { ui.geraete = await api("geraete"); if (ui.view === "management") render(); } catch (err) { leitungFehler(err); }
  }
  function einstellungen() {
    const g = ui.geraete;
    const liste = !g ? `<p class="mini">Geräte werden geladen …</p>` : g.geraete.map((x) => `<div><span><b>${esc(x.geraet)}</b>${x.id === g.dieses ? " (dieses Gerät)" : ""}<br><span class="mini">${x.rolle === "werkstatt" ? "Werkstatt" : "Laden"} · zuletzt ${esc(new Date(x.zuletzt.replace(" ", "T") + "Z").toLocaleString("de-DE"))}</span></span>${x.id === g.dieses ? "" : `<button class="btn ghost small" data-geraetweg="${x.id}" type="button">Abmelden</button>`}</div>`).join("");
    return `<div class="grid2">
      ${mitarbeiterPanel()}
      <div class="panel einst"><h2>Werkstatt-Zugang</h2><p class="mini">Für das Tablet des Textilreinigers: sieht nur die Werkstatt mit den Sammlern, keine Kunden, Preise oder Kasse.
        ${g ? (g.werkstatt ? "<b>Eingerichtet.</b>" : "<b>Noch nicht eingerichtet.</b>") : ""}</p>
        <div class="row2"><label class="field" for="wp1">Werkstatt-Passwort<input id="wp1" type="password" autocomplete="new-password"></label><label class="field" for="wp2">Wiederholen<input id="wp2" type="password" autocomplete="new-password"></label></div>
        <div class="chips"><button class="btn ghost" data-wpneu type="button">${g && g.werkstatt ? "Passwort ändern" : "Werkstatt-Zugang einrichten"}</button>${g && g.werkstatt ? `<button class="btn ghost" data-wpaus type="button">Werkstatt-Zugang abschalten</button>` : ""}</div>
        <p class="mini">Mindestens 8 Zeichen, anders als das Laden-Passwort. Auf dem Werkstatt-Tablet mit diesem Passwort anmelden.</p></div>
      <div class="panel einst"><h2>Angemeldete Geräte</h2><div class="geraete">${liste}</div>
        <p class="mini">Ist ein Gerät verloren gegangen, hier abmelden. Es kommt dann ohne Passwort nicht mehr an die Daten.</p></div>
      <div class="panel einst"><h2>Sicherung</h2><p class="mini">Alle Kunden und Aufträge als Datei. Am besten einmal im Monat speichern, zusätzlich zur Sicherung bei ALL-INKL.</p>
        <div><button class="btn" data-sicherung type="button">Sicherung herunterladen</button></div></div>
      <div class="panel einst"><h2>Laden-Passwort ändern</h2>
        <div class="row2"><label class="field" for="pw1">Neues Passwort<input id="pw1" type="password" autocomplete="new-password"></label><label class="field" for="pw2">Wiederholen<input id="pw2" type="password" autocomplete="new-password"></label></div>
        <div><button class="btn ghost" data-pwneu type="button">Passwort ändern</button></div><p class="mini">Mindestens 8 Zeichen. Danach müssen sich alle anderen Geräte neu anmelden.</p></div>
      <div class="panel einst"><h2>Leitungs-PIN ändern</h2>
        <div class="row2"><label class="field" for="pn1">Neue PIN<input id="pn1" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label><label class="field" for="pn2">Wiederholen<input id="pn2" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label></div>
        <div><button class="btn ghost" data-pinneu type="button">PIN ändern</button></div></div>
      <div class="panel einst"><h2>Dieses Gerät</h2><p class="mini">Angemeldet als „${esc(meta.geraet || "")}“. Version ${VERSION}.</p>
        <div><button class="btn ghost" data-abmelden type="button">Gerät abmelden</button></div><p class="mini">Löscht die Daten auf diesem Gerät. Beim Server bleibt alles erhalten.</p></div></div>`;
  }
  async function sicherung() {
    try {
      const r = await fetch(`${API}?a=export`, { headers: { "X-Ladenbuch-Token": token }, cache: "no-store" });
      if (!r.ok) throw Object.assign(new Error((await r.json().catch(() => ({}))).fehler || "Fehler"), { status: r.status });
      const file = new File([await r.blob()], `ladenbuch-sicherung-${iso(today0())}.json`, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === "AbortError") return; } }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) { leitungFehler(err); }
  }

  // ---------------------------------------------------------------- Kundendienst: Reklamationen als Tickets (R-1001 …)
  // Ablauf: Neu → In Prüfung → Nachbehandlung / Extern / Wartet auf Kunde → Erledigt (mit Ergebnis)
  const T_STATUS = { neu: ["Neu", "p-arbeit"], pruefung: ["In Prüfung", "p-arbeit"], nachbehandlung: ["Nachbehandlung", "p-kd"], extern: ["Extern (Gutachter/Reparatur)", "p-kd"], wartet: ["Wartet auf Kunde", "p-alt"], erledigt: ["Erledigt", "p-abgeholt"] };
  const T_KANAL = ["Im Laden", "Telefon", "WhatsApp", "E-Mail"];
  const T_ERGEBNIS = { nachgebessert: "Nachgebessert (kostenlos)", erstattung: "Gutschrift / Erstattung", schadenersatz: "Schadenersatz", abgelehnt: "Abgelehnt" };
  const T_PIN = ["erstattung", "schadenersatz", "abgelehnt"]; // nur mit Leitungs-PIN
  const T_FRIST = 7;
  const tOffen = (t) => t.status !== "erledigt";
  const tAlter = (t) => daysSince(t.erstellt);
  const tUeberfaellig = (t) => tOffen(t) && tAlter(t) > T_FRIST;
  const tFaellig = (t) => tOffen(t) && t.wieder && t.wieder <= iso(today0());
  const tickets = () => db.tickets || (db.tickets = []);
  const ticketsZu = (nr) => tickets().filter((t) => t.auftrag === nr);
  const tPill = (t) => tUeberfaellig(t) ? `<span class="pill p-alt">Seit ${tAlter(t)} Tagen offen</span>` : `<span class="pill ${T_STATUS[t.status][1]}">${T_STATUS[t.status][0]}</span>`;
  const jetztText = () => new Date().toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  function tLog(t, text) { (t.log ||= []).push({ am: jetztText(), geraet: meta.geraet || "", von: bedienerName(), text }); }

  function ticketRow(t) {
    const c = cust(t.cust);
    return `<button class="row" data-ticket="${t.id}" type="button">
      <span class="t">${esc(c.name)} · ${esc(t.grund)}</span>
      <span class="s num">${t.id} · Auftrag ${t.auftrag} · ${(t.teile || []).length} Teile · seit ${fmtDate(t.erstellt)}${t.wieder && tOffen(t) ? " · Wiedervorlage " + fmtDate(t.wieder) : ""}</span>
      <span class="r">${tPill(t)}</span></button>`;
  }
  const tList = (arr, none) => arr.length ? `<div class="list">${arr.map(ticketRow).join("")}</div>` : `<p class="empty">${none}</p>`;

  // Formular für eine neue Reklamation zu einem Auftrag
  function ticketNeu(o) {
    const its = o.items || [];
    return `<div class="panel einst" id="t-neu"><h2>Reklamation zu Auftrag ${o.nr} aufnehmen</h2>
      <p class="mini">${esc(cust(o.cust).name)} · angenommen ${fmtDate(o.date)} · ${pill(o)}</p>
      <div class="row2"><label class="field" for="tn-kanal">Wie kam die Reklamation?<select id="tn-kanal">${T_KANAL.map((k) => `<option>${k}</option>`).join("")}</select></label>
      <label class="field" for="tn-grund">Grund<select id="tn-grund">${KD_GRUENDE.map((g) => `<option>${g}</option>`).join("")}</select></label></div>
      <label class="field" for="tn-text">Was genau? (Aussage des Kunden)<textarea id="tn-text" rows="3" placeholder="z. B. Rotweinfleck am linken Ärmel noch sichtbar"></textarea></label>
      ${its.length ? `<fieldset class="teilwahl"><legend>Betroffene Teile</legend>${its.map((it) => `<label><input type="checkbox" value="${it.tnr}"${its.length === 1 ? " checked" : ""}> ${it.tnr} · ${esc(teilName(it))} <span class="mini">(${ST[it.st]})</span></label>`).join("")}</fieldset>` : ""}
      <label class="check"><input type="checkbox" id="tn-da" ${o.status === "abgeholt" ? "" : "checked"}> Die betroffenen Teile sind jetzt wieder bei uns im Laden</label>
      <label class="field" for="tn-wieder">Wiedervorlage am<input type="date" id="tn-wieder" value="${iso(addWorkdays(today0(), 2))}"></label>
      <div class="chips"><button class="btn" data-tanlegen="${o.nr}" type="button">Ticket anlegen</button><button class="btn ghost" data-tabbruch type="button">Abbrechen</button></div></div>`;
  }

  function ticketAnlegen(o) {
    let id; try { id = "R-" + naechsteNummer("ticket"); } catch (err) { toast(err.message); return; }
    const teile = [...document.querySelectorAll("#t-neu .teilwahl input:checked")].map((x) => x.value);
    const da = document.getElementById("tn-da").checked;
    const t = { ticket: true, id, auftrag: o.nr, cust: o.cust, store: o.store, erstellt: iso(today0()), kanal: document.getElementById("tn-kanal").value,
      grund: document.getElementById("tn-grund").value, text: document.getElementById("tn-text").value.trim(), teile, status: "neu", wieder: document.getElementById("tn-wieder").value || "", fotos: [], log: [] };
    tLog(t, `Reklamation aufgenommen (${t.kanal})${teile.length ? ": " + teile.join(", ") : ""}`);
    // Teile, die der Kunde zurückbringt, kommen wieder in die Teile-Kartei
    if (da && teile.length) {
      (o.items || []).filter((it) => teile.includes(it.tnr)).forEach((it) => setItem(it, "kundendienst"));
      if (o.status !== "storniert") o.status = "kundendienst";
      tLog(t, "Teile im Laden angenommen");
    }
    tickets().push(t); change(t, o);
    ui.tNeu = null; ui.view = "kundendienst"; ui.openTicket = id; ui.tfilter2 = "offen";
    toast(`Ticket ${id} angelegt`); scrollTo({ top: 0 });
  }

  // Status ändern: Nachbehandlung schickt die Teile zurück in die Reinigung, Extern markiert sie beim Partner
  function ticketStatus(t, st) {
    const o = db.orders.find((x) => x.nr === t.auftrag);
    t.status = st; tLog(t, "Status: " + T_STATUS[st][0]);
    if (o && (st === "nachbehandlung" || st === "extern")) {
      (o.items || []).filter((it) => (t.teile || []).includes(it.tnr)).forEach((it) => setItem(it, st === "nachbehandlung" ? "reinigung" : "extern"));
      if (o.status !== "storniert") o.status = "kundendienst";
    }
    change(t, o);
  }

  function ticketAbschluss(t) {
    const art = document.getElementById("ta-art").value;
    if (T_PIN.includes(art) && !ui.mgmt) { toast("Dafür bitte zuerst unten die Leitungs-PIN eingeben"); return; }
    const betrag = Math.round(parseFloat((document.getElementById("ta-betrag")?.value || "0").replace(",", ".")) * 100) || 0;
    const beleg = (document.getElementById("ta-beleg")?.value || "").trim();
    const notiz = document.getElementById("ta-notiz").value.trim();
    if (art === "abgelehnt" && !notiz) { toast("Bitte eine Begründung eintragen"); return; }
    if (art === "erstattung" && (!betrag || !beleg)) { toast("Bitte Betrag und Beleg-Nr. der Kasse eintragen"); return; }
    const zeuge = maName(document.getElementById("ta-zeuge")?.value || "");
    t.ergebnis = { art, betrag, beleg, notiz, am: iso(today0()), von: bedienerName(), zeuge }; t.status = "erledigt";
    tLog(t, `Abgeschlossen: ${T_ERGEBNIS[art]}${betrag ? " · " + euro(betrag) : ""}${beleg ? " · Beleg " + beleg : ""}${notiz ? " · " + notiz : ""}${zeuge ? " · Vier-Augen mit " + zeuge : ""}`);
    change(t); toast(`Ticket ${t.id} abgeschlossen`);
  }

  // Fotos: verkleinert (max. 1600 px) und auf dem Server gespeichert, nicht im Gerät
  async function fotoHochladen(t, datei) {
    const id = await fotoSpeichern(datei);
    if (id) { (t.fotos ||= []).push(id); tLog(t, "Foto hinzugefügt"); change(t); }
  }
  async function fotoSpeichern(datei) {
    if (navigator.onLine === false) { toast("Fotos brauchen Internet"); return null; }
    try {
      const bild = await createImageBitmap(datei);
      const f = Math.min(1, 1600 / Math.max(bild.width, bild.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(bild.width * f); cv.height = Math.round(bild.height * f);
      cv.getContext("2d").drawImage(bild, 0, 0, cv.width, cv.height);
      const daten = cv.toDataURL("image/jpeg", 0.82).split(",")[1];
      toast("Foto wird gespeichert …");
      const r = await api("foto", { daten });
      toast("Foto gespeichert"); return r.id;
    } catch (err) { toast(err.status === 0 ? "Fotos brauchen Internet" : "Foto konnte nicht gespeichert werden: " + err.message); return null; }
  }
  const fotoCache = new Map();
  async function fotosZeigen() {
    for (const img of document.querySelectorAll("img[data-foto]")) {
      const id = img.dataset.foto;
      if (!fotoCache.has(id)) {
        fotoCache.set(id, fetch(`${API}?a=foto&id=${encodeURIComponent(id)}`, { headers: { "X-Ladenbuch-Token": token || "" } })
          .then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => URL.createObjectURL(b)).catch(() => { fotoCache.delete(id); return ""; }));
      }
      const url = await fotoCache.get(id);
      if (url) img.src = url; else img.alt = "Foto nicht geladen (offline?)";
    }
  }

  function kdTexte(t) {
    const c = cust(t.cust); const v = vorname(c); const an = `Guten Tag${v ? " " + v : ""}`;
    return [["Eingang bestätigen", `${an}, vielen Dank für Ihre Rückmeldung zu Auftrag ${t.auftrag}. Wir haben Ihre Reklamation unter der Nummer ${t.id} aufgenommen und melden uns, sobald wir mehr wissen. Ihr Team von Tayfun Textilpflege`],
      ["Nachbehandelt, abholbereit", `${an}, Ihr Teil aus Auftrag ${t.auftrag} wurde nachbehandelt und ist ab sofort abholbereit. An der Kirche 10, Mo, Di, Do, Fr 8-13 + 15-18 Uhr, Mi + Sa 8-13 Uhr. Ihr Team von Tayfun Textilpflege`],
      ["Beim Gutachter", `${an}, wir haben Ihr Teil aus Auftrag ${t.auftrag} zur Prüfung an einen unabhängigen Gutachter gegeben (Vorgang ${t.id}). Wir melden uns, sobald das Ergebnis vorliegt. Ihr Team von Tayfun Textilpflege`],
      ["Rückfrage", `${an}, zu Ihrer Reklamation ${t.id} (Auftrag ${t.auftrag}) haben wir eine kurze Rückfrage: `]];
  }

  function ticketDetail(t) {
    const c = cust(t.cust); const o = db.orders.find((x) => x.nr === t.auftrag);
    const nr = handyNr(c.tel);
    const teile = (o?.items || []).filter((it) => (t.teile || []).includes(it.tnr));
    const fotos = (t.fotos || []).map((id) => `<img class="foto" data-foto="${esc(id)}" alt="Foto zu ${t.id}">`).join("");
    const erg = t.ergebnis ? `<div class="pay ok"><b>${T_ERGEBNIS[t.ergebnis.art]}</b><span>${t.ergebnis.betrag ? euro(t.ergebnis.betrag) : ""}${t.ergebnis.beleg ? " · Kassenbeleg " + esc(t.ergebnis.beleg) : ""}${t.ergebnis.notiz ? " · " + esc(t.ergebnis.notiz) : ""} · ${fmtDate(t.ergebnis.am)}</span></div>` : "";
    const schritte = tOffen(t) ? `<div class="chips">${["pruefung", "nachbehandlung", "extern", "wartet"].map((s) => `<button class="chip" data-tstatus="${s}" aria-pressed="${t.status === s}" type="button">${T_STATUS[s][0]}</button>`).join("")}</div>
      <p class="mini">„Nachbehandlung“ schickt die betroffenen Teile zurück in die Reinigung. Sind sie wieder fertig gescannt, wird der Auftrag automatisch abholbereit.</p>` : "";
    const abschluss = tOffen(t) ? `<div class="kd"><b>Abschließen</b>
      <div class="row2"><label class="field" for="ta-art">Ergebnis<select id="ta-art">${Object.entries(T_ERGEBNIS).map(([k, n]) => `<option value="${k}"${ui.taArt === k ? " selected" : ""}>${n}${T_PIN.includes(k) ? " (Leitung)" : ""}</option>`).join("")}</select></label>
      <label class="field" for="ta-notiz">${ui.taArt === "abgelehnt" ? "Begründung" : "Vermerk"}<input id="ta-notiz" autocomplete="off"></label></div>
      ${["erstattung", "schadenersatz"].includes(ui.taArt) ? `<div class="row2"><label class="field" for="ta-betrag">Betrag in €<input id="ta-betrag" inputmode="decimal" placeholder="z. B. 12,50" autocomplete="off"></label><label class="field" for="ta-beleg">Beleg-Nr. der Kasse${ui.taArt === "schadenersatz" ? " (falls vorhanden)" : ""}<input id="ta-beleg" inputmode="numeric" autocomplete="off"></label></div>
      <span class="hint">Die Rückzahlung selbst wird in der Kasse gebucht. Hier nur Betrag und Beleg vermerken.</span>` : ""}
      ${T_PIN.includes(ui.taArt) && !ui.mgmt ? `<div class="row2"><label class="field" for="pin">Leitungs-PIN<input id="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label><button class="btn ghost small" data-unlock type="button">Freigeben</button></div>` : ""}
      ${aktiveMa().length ? `<label class="field" for="ta-zeuge">Vier-Augen-Prinzip: zweite Person (freiwillig)<select id="ta-zeuge">${maOptionen("", "– niemand –", bediener)}</select></label>` : ""}
      <div><button class="btn small" data-tfertig type="button">Ticket abschließen</button></div></div>` : `<div><button class="btn ghost small" data-tauf type="button">Wieder öffnen</button></div>`;
    return `<div class="panel detail-grid"><div class="detail"><h2>Reklamation ${t.id}</h2>
      <dl><dt>Status</dt><dd>${tPill(t)}</dd><dt>Kunde</dt><dd>${esc(c.name)} · <span class="num">${esc(c.tel)}</span></dd>
      <dt>Auftrag</dt><dd><button class="btn ghost small" data-order="${t.auftrag}" data-goauftrag type="button">${t.auftrag}</button></dd>
      <dt>Eingang</dt><dd>${fmtDate(t.erstellt)} · ${esc(t.kanal)}</dd><dt>Grund</dt><dd>${esc(t.grund)}</dd>
      ${t.text ? `<dt>Beschreibung</dt><dd>${esc(t.text)}</dd>` : ""}
      <dt>Teile</dt><dd>${teile.length ? teile.map((it) => `<button class="btn ghost small" data-teil="${it.tnr}" type="button">${it.tnr} · ${esc(teilName(it))}</button> ${stPill(it.st)}`).join("<br>") : "keine ausgewählt"}</dd></dl>
      ${erg}${schritte}
      <div class="row2"><label class="field" for="tv-text">Vermerk<input id="tv-text" placeholder="z. B. Gutachter Müller angerufen" autocomplete="off"></label>
      <label class="field" for="tv-wieder">Wiedervorlage<input type="date" id="tv-wieder" value="${esc(t.wieder || "")}"></label></div>
      ${aktiveMa().length ? `<label class="field" for="tv-zeuge">Vier-Augen-Prinzip: zweite Person (freiwillig)<select id="tv-zeuge">${maOptionen("", "– niemand –", bediener)}</select></label>` : ""}
      <div class="chips"><button class="btn ghost small" data-tvermerk type="button">Vermerk speichern</button>
        <label class="btn ghost small foto-knopf">Foto aufnehmen<input type="file" accept="image/*" capture="environment" id="t-foto" hidden></label></div>
      ${nr ? `<div class="digi"><b>Kunde per WhatsApp informieren</b><div class="chips">${kdTexte(t).map(([n, text]) => `<a class="btn small wa-btn" href="https://wa.me/${nr}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${n}</a>`).join("")}</div></div>` : ""}
      ${abschluss}
      <div class="chips"><button class="btn ghost" data-tclose2 type="button">Schließen</button></div></div>
      <div class="kd-seite">${fotos ? `<div class="fotos">${fotos}</div>` : `<p class="mini">Noch keine Fotos.</p>`}
        <h3>Verlauf</h3><ol class="scanlog">${(t.log || []).slice().reverse().map((l) => `<li>${esc(l.am)} · ${esc(l.text)}${l.von || l.geraet ? ` <span class="mini">(${esc(l.von || l.geraet)})</span>` : ""}</li>`).join("")}</ol></div></div>`;
  }

  function kundendienstAnsicht() {
    const alle = tickets().filter((t) => ui.store === "ALL" || t.store === ui.store);
    const f = ui.tfilter2 || "offen"; const q = norm(ui.kq2 || "");
    const passt = (t, k) => k === "alle" ? true : k === "offen" ? tOffen(t) : k === "faellig" ? tFaellig(t) || tUeberfaellig(t) : k === "erledigt" ? !tOffen(t) : t.status === k;
    let arr = alle.filter((t) => !q || norm(t.id).includes(q) || norm(t.auftrag).includes(q) || norm(cust(t.cust).name).includes(q));
    const basis = arr; arr = arr.filter((t) => passt(t, f)).sort((a, b) => (b.erstellt.localeCompare(a.erstellt)) || b.id.localeCompare(a.id));
    const F = [["offen", "Offen"], ["faellig", "Fällig & überfällig"], ["neu", "Neu"], ["nachbehandlung", "Nachbehandlung"], ["extern", "Extern"], ["wartet", "Wartet auf Kunde"], ["erledigt", "Erledigt"], ["alle", "Alle"]];
    const d30 = alle.filter((t) => tAlter(t) < 30);
    const neuForm = ui.tNeu ? ticketNeu(db.orders.find((o) => o.nr === ui.tNeu)) : "";
    const auswahl = ui.tSuche !== undefined && !ui.tNeu ? (() => {
      const sq = norm(ui.tSuche); const treffer = sq ? db.orders.filter(inStore).filter((o) => norm(o.nr).includes(sq) || norm(cust(o.cust).name).includes(sq)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8) : [];
      return `<div class="panel einst"><h2>Zu welchem Auftrag?</h2><label class="field" for="t-suche">Auftragsnummer, Abholcode oder Kundenname<input id="t-suche" value="${esc(ui.tSuche)}" autocomplete="off" autocapitalize="characters"></label>
        ${treffer.length ? `<div class="list">${treffer.map((o) => `<button class="row" data-tfuer="${o.nr}" type="button"><span class="t">${esc(cust(o.cust).name)}</span><span class="s num">${o.nr} · ${fmtDate(o.date)} · ${pieces(o)} Teile</span><span class="r">${pill(o)}</span></button>`).join("")}</div>` : sq ? `<p class="empty">Kein Auftrag gefunden.</p>` : ""}
        <div><button class="btn ghost small" data-tabbruch type="button">Abbrechen</button></div></div>`; })() : "";
    const offenT = ui.openTicket && tickets().find((t) => t.id === ui.openTicket);
    return `<div class="kpis">
        <div class="kpi"><b class="num">${alle.filter(tOffen).length}</b><small>Offene Reklamationen</small></div>
        <div class="kpi ${alle.some(tUeberfaellig) ? "alert" : ""}"><b class="num">${alle.filter(tUeberfaellig).length}</b><small>Länger als ${T_FRIST} Tage offen</small></div>
        <div class="kpi ${alle.some(tFaellig) ? "alert" : ""}"><b class="num">${alle.filter(tFaellig).length}</b><small>Wiedervorlage heute</small></div>
        <div class="kpi"><b class="num">${d30.length}</b><small>Neue Reklamationen (30 Tage)</small></div></div>
      ${neuForm || auswahl || `<div><button class="btn" data-tneu type="button">+ Neue Reklamation</button></div>`}
      ${offenT ? ticketDetail(offenT) : ""}
      <label for="kq2" class="field">Reklamation suchen<input class="search" id="kq2" value="${esc(ui.kq2 || "")}" placeholder="R-Nummer, Auftrag oder Kundenname" autocomplete="off"></label>
      <div class="chips">${F.map(([k, n]) => `<button class="chip" data-tfilter2="${k}" aria-pressed="${k === f}" type="button">${n}<span class="cnt">${basis.filter((t) => passt(t, k)).length}</span></button>`).join("")}</div>
      <div class="panel">${tList(arr.slice(0, 80), "Keine Reklamationen in dieser Auswahl.")}</div>`;
  }

  // Auswertung für die Leitung
  function kdAuswertung() {
    const alle = tickets().filter((t) => ui.store === "ALL" || t.store === ui.store);
    const d90 = alle.filter((t) => tAlter(t) < 90);
    const auftr = db.orders.filter(inStore).filter((o) => zaehlt(o) && daysSince(o.date) < 90).length;
    const quote = auftr ? (d90.length / auftr * 100).toFixed(1).replace(".", ",") : "0";
    const kosten = d90.filter((t) => t.ergebnis && t.ergebnis.betrag).reduce((s, t) => s + t.ergebnis.betrag, 0);
    const gr = {}; d90.forEach((t) => (gr[t.grund] = (gr[t.grund] || 0) + 1));
    const grS = Object.entries(gr).sort((a, b) => b[1] - a[1]); const gmax = grS.length ? grS[0][1] : 1;
    const erledigt = d90.filter((t) => t.ergebnis); const dauer = erledigt.length ? (erledigt.reduce((s, t) => s + Math.max(0, (D(t.ergebnis.am) - D(t.erstellt)) / DAY), 0) / erledigt.length).toFixed(1).replace(".", ",") : "–";
    return `<div class="panel"><h2>Reklamationen (90 Tage)</h2>
      <div class="kpis"><div class="kpi"><b class="num">${d90.length}</b><small>Reklamationen</small></div>
        <div class="kpi"><b class="num">${quote} %</b><small>Anteil an Aufträgen</small></div>
        <div class="kpi ${kosten ? "alert" : ""}"><b class="num">${euro(kosten)}</b><small>Erstattung & Schadenersatz</small></div>
        <div class="kpi"><b class="num">${dauer}</b><small>Ø Tage bis erledigt</small></div></div>
      ${grS.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><span class="track"><i style="width:${Math.round(v / gmax * 100)}%"></i></span><b class="num">${v}</b></div>`).join("") || `<p class="empty">Keine Reklamationen – sehr gut.</p>`}</div>`;
  }

  // ---------------------------------------------------------------- Mitarbeiterkartei und „wer arbeitet gerade“
  // Mitarbeiter werden nie gelöscht, nur auf „ausgeschieden“ gesetzt – alte Einträge bleiben so nachvollziehbar.
  const mitarbeiter = () => db.mitarbeiter || (db.mitarbeiter = []);
  const aktiveMa = () => mitarbeiter().filter((m) => m.aktiv !== false).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const maName = (id) => (mitarbeiter().find((m) => m.id === id) || {}).name || "";
  let bediener = LS.get("lb-bediener") || "";
  const bedienerName = () => maName(bediener) || "";
  // Wer hat es gemacht: Mitarbeiter, sonst das Gerät
  const wer = () => bedienerName() || meta.geraet || "";
  function maOptionen(gewaehlt, leer = "– bitte wählen –", ohne = "") {
    return `<option value="">${leer}</option>` + aktiveMa().filter((m) => m.id !== ohne).map((m) => `<option value="${m.id}"${m.id === gewaehlt ? " selected" : ""}>${esc(m.name)}</option>`).join("");
  }
  function bedienerLeiste() {
    const el = document.getElementById("bediener"); if (!el) return;
    if (bediener && !aktiveMa().some((m) => m.id === bediener)) { bediener = ""; LS.set("lb-bediener", null); }
    el.hidden = !aktiveMa().length;
    el.innerHTML = maOptionen(bediener, "Wer arbeitet gerade?");
  }
  function mitarbeiterPanel() {
    const rollen = ["Inhaber", "Laden / Kasse", "Textilreinigung / Detachur", "Bügeln / Finish", "Aushilfe", "Fahrer / Außendienst", "Schneiderei"];
    const zeile = (m) => `<div><span><b>${esc(m.name)}</b>${m.kuerzel ? ` (${esc(m.kuerzel)})` : ""}<br><span class="mini">${esc(m.rolle || "")}${m.tel ? " · " + esc(m.tel) : ""}${m.aktiv === false ? " · ausgeschieden" : ""}</span></span>
      <button class="btn ghost small" data-maaktiv="${m.id}" type="button">${m.aktiv === false ? "Wieder aktiv" : "Ausgeschieden"}</button></div>`;
    return `<div class="panel einst"><h2>Mitarbeiter</h2>
      <div class="geraete">${mitarbeiter().slice().sort((a, b) => (a.aktiv === false) - (b.aktiv === false) || a.name.localeCompare(b.name, "de")).map(zeile).join("") || `<p class="mini">Noch niemand eingetragen.</p>`}</div>
      <div class="row2"><label class="field" for="ma-name">Name<input id="ma-name" autocomplete="off" placeholder="Vor- und Nachname"></label><label class="field" for="ma-kurz">Kürzel<input id="ma-kurz" maxlength="4" autocomplete="off" placeholder="z. B. AY"></label></div>
      <div class="row2"><label class="field" for="ma-rolle">Rolle<select id="ma-rolle">${rollen.map((r) => `<option>${r}</option>`).join("")}</select></label><label class="field" for="ma-tel">Telefon (freiwillig)<input id="ma-tel" type="tel" autocomplete="off"></label></div>
      <div><button class="btn ghost" data-maneu type="button">Mitarbeiter eintragen</button></div>
      <p class="mini">Ausgeschiedene bleiben in der Kartei, damit alte Einträge nachvollziehbar bleiben.</p></div>`;
  }
  function maNeu() {
    const name = document.getElementById("ma-name").value.trim(); if (!name) { toast("Bitte einen Namen eintragen"); return; }
    const m = { mitarbeiter: true, id: "M" + Date.now().toString(36).toUpperCase(), name, kuerzel: document.getElementById("ma-kurz").value.trim().toUpperCase(),
      rolle: document.getElementById("ma-rolle").value, tel: document.getElementById("ma-tel").value.trim(), aktiv: true, seit: iso(today0()) };
    mitarbeiter().push(m); change(m); toast(`${name} eingetragen`);
  }

  // ---------------------------------------------------------------- Mängel je Teil mit Umrisszeichnung, Markierung und Foto
  // Umrisse als Strichzeichnung (Ansicht 200 × 240); „detail“ nur auf der Vorderseite
  const UMRISS = {
    hemd: { name: "Hemd / Bluse", form: "M70 28 L52 36 L22 58 L8 150 L28 155 L42 92 L46 226 L154 226 L158 92 L172 155 L192 150 L178 58 L148 36 L130 28 Q100 44 70 28 Z",
      linien: "M8 150 L28 155 M172 155 L192 150 M12 138 L31 143 M169 143 L188 138", detail: "M70 28 L86 50 L100 40 L114 50 L130 28 M100 40 L100 226 M104 70 a2 2 0 1 0 0.1 0 M104 100 a2 2 0 1 0 0.1 0 M104 130 a2 2 0 1 0 0.1 0 M104 160 a2 2 0 1 0 0.1 0 M104 190 a2 2 0 1 0 0.1 0 M60 70 L80 70 L80 88 L60 88 Z" },
    pullover: { name: "Pullover", form: "M72 26 L52 34 L22 58 L10 152 L30 156 L42 92 L46 226 L154 226 L158 92 L170 156 L190 152 L178 58 L148 34 L128 26 Q100 50 72 26 Z",
      linien: "M46 214 L154 214 M12 140 L31 144 M169 144 L188 140", detail: "M78 30 Q100 56 122 30" },
    sakko: { name: "Sakko / Jacke", form: "M70 24 L50 34 L20 58 L10 156 L32 160 L42 94 L44 222 L156 222 L158 94 L168 160 L190 156 L180 58 L150 34 L130 24 Q100 34 70 24 Z",
      linien: "M10 156 L32 160 M168 160 L190 156", detail: "M70 24 L84 70 L100 132 L116 70 L130 24 M84 70 L74 64 M116 70 L126 64 M100 132 L100 222 M104 150 a3 3 0 1 0 0.1 0 M104 180 a3 3 0 1 0 0.1 0 M56 170 L84 170 M116 170 L144 170 M120 92 L140 92" },
    mantel: { name: "Mantel", form: "M72 16 L52 26 L24 50 L12 160 L34 164 L44 90 L40 234 L160 234 L156 90 L166 164 L188 160 L176 50 L148 26 L128 16 Q100 26 72 16 Z",
      linien: "M12 160 L34 164 M166 164 L188 160", detail: "M72 16 L86 64 L100 110 L114 64 L128 16 M100 110 L100 234 M106 130 a3 3 0 1 0 0.1 0 M106 165 a3 3 0 1 0 0.1 0 M106 200 a3 3 0 1 0 0.1 0 M54 180 L80 176 M120 176 L146 180" },
    hose: { name: "Hose", form: "M56 14 L144 14 L150 40 L166 230 L116 230 L102 96 L98 96 L84 230 L34 230 L50 40 Z",
      linien: "M55 28 L145 28", detail: "M100 28 L100 82 M62 34 Q70 54 54 60 M138 34 Q130 54 146 60 M76 28 L76 18 M124 28 L124 18" },
    rock: { name: "Rock", form: "M62 30 L138 30 L176 222 L24 222 Z", linien: "M60 44 L140 44", detail: "M100 44 L100 80" },
    kleid: { name: "Kleid", form: "M76 14 L90 14 Q100 32 110 14 L124 14 L130 72 Q120 92 126 102 L176 230 L24 230 L74 102 Q80 92 70 72 Z", linien: "M72 100 L128 100", detail: "" },
    krawatte: { name: "Krawatte", form: "M88 10 L112 10 L107 36 L122 204 L100 228 L78 204 L93 36 Z", linien: "M93 36 L107 36", detail: "" },
    decke: { name: "Decke", form: "M20 36 L180 36 L180 206 L20 206 Z", linien: "M30 46 L170 46 L170 196 L30 196 Z", detail: "" },
    kissen: { name: "Kissen", form: "M34 66 Q100 54 166 66 Q178 120 166 174 Q100 186 34 174 Q22 120 34 66 Z", linien: "", detail: "" },
    schuh: { name: "Schuh", seiten: ["Linker Schuh", "Rechter Schuh"], form: "M18 172 L18 142 Q20 122 40 114 L96 100 Q110 72 118 58 L152 58 Q156 88 170 104 Q188 116 188 142 L188 172 Z",
      linien: "M18 160 L188 160 M118 58 L116 100 M44 114 L96 114 M150 160 L150 172", detail: "M122 70 L146 70 M121 82 L148 82 M120 94 L152 94" },
    schluessel: { name: "Schlüssel", seiten: ["Schlüssel"], form: "M62 78 A42 42 0 1 0 102 132 L186 132 L186 112 L102 112 A42 42 0 0 0 62 78 Z",
      linien: "M48 120 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M150 132 L150 148 L162 148 L162 132 M170 132 L170 144 L180 144 L180 132", detail: "" },
    gardine: { name: "Gardine / Vorhang", form: "M24 30 L176 30 L176 226 L24 226 Z", linien: "M14 24 L186 24 M50 30 Q44 128 50 226 M80 30 Q74 128 80 226 M110 30 Q104 128 110 226 M140 30 Q134 128 140 226", detail: "" },
  };
  const ANSICHTEN = { hemd: ["hemd"], "hemd-g": ["hemd"], bluse: ["hemd"], hose: ["hose"], anzug: ["sakko", "hose"], jacke: ["sakko"], rock: ["rock"], kleid: ["kleid"], mantel: ["mantel"],
    pullover: ["pullover"], daunenjacke: ["mantel"], krawatte: ["krawatte"], wolldecke: ["decke"], kissen: ["kissen"], bettdecke: ["decke"], tischdecke: ["decke"], gardine: ["gardine"], vorhang: ["gardine"],
    lederjacke: ["sakko"], ledermantel: ["mantel"], schuh: ["schuh"], schuhpflege: ["schuh"], schluessel: ["schluessel"], fremd: ["decke"] };
  const seitenNamen = (key) => UMRISS[key].seiten || ["Vorderseite", "Rückseite"];
  const seiteText = (key, seite) => { const s = UMRISS[key].seiten; if (!s) return seite === "vorne" ? "vorne" : "hinten"; return s.length === 1 ? "" : seite === "vorne" ? s[0] : s[1]; };
  const M_ARTEN = ["Loch / Masche gezogen", "Fleck", "Verfärbung / ausgeblichen", "Knopf fehlt / lose", "Naht offen", "Reißverschluss defekt", "Abgenutzt / Glanzstellen", "Pilling / Knötchen", "Brandloch", "Etikett fehlt (Pflegehinweis)", "Sonstiges"];
  const M_ZEIT = { annahme: "Bei Annahme, Kunde anwesend", nachtraeglich: "Nachträglich, Kunde nicht anwesend", bearbeitung: "Während der Bearbeitung festgestellt" };
  const maengelVon = (it) => (it.maengel || []).filter((m) => !m.gestrichen);

  function umrissSvg(key, seite, it, neu) {
    const u = UMRISS[key];
    const marken = (it.maengel || []).map((m, i) => [m, i]).filter(([m]) => m.ansicht === key && m.seite === seite)
      .map(([m, i]) => `<g class="marke${m.gestrichen ? " weg" : ""}"><circle cx="${m.x * 200}" cy="${m.y * 240}" r="9"/><text x="${m.x * 200}" y="${m.y * 240 + 4}">${i + 1}</text></g>`).join("");
    const neuM = neu ? `<g class="marke neu"><circle cx="${neu.x * 200}" cy="${neu.y * 240}" r="9"/><text x="${neu.x * 200}" y="${neu.y * 240 + 4}">+</text></g>` : "";
    return `<svg class="umriss" viewBox="0 0 200 240" role="img" aria-label="${u.name}, ${seiteText(key, seite) || "Ansicht"} – zum Markieren antippen" data-umriss="${key}" data-seite="${seite}">
      <path class="form" d="${u.form}"/>${u.linien ? `<path class="linie" d="${u.linien}"/>` : ""}${seite === "vorne" && u.detail ? `<path class="linie" d="${u.detail}"/>` : ""}${marken}${neuM}</svg>`;
  }

  // Warenschau eines Teils: Optionen, Kundenwünsche, Hinweis, „einwandfrei“
  function schauHtml(it) {
    const opts = OPTIONEN[it.id] || [];
    if (werkstattZugang()) return `<div class="kd md-schau"><b>Vorgaben aus der Annahme</b>${optText(it) ? `<span>${esc(optText(it))}</span>` : ""}
      ${(it.wuensche || []).length || (it.hinweis || "").trim() ? `<ul class="ws-vermerke">${(it.wuensche || []).map((w) => `<li class="w">${esc(w.text)}</li>`).join("")}${(it.hinweis || "").trim() ? `<li class="w">Hinweis: ${esc(it.hinweis)}</li>` : ""}</ul>` : `<span class="ok-text">Keine Kundenwünsche – nach Pflegeetikett und Fachkenntnis.</span>`}</div>`;
    return `<div class="kd md-schau"><b>Warenschau</b>
      ${opts.map(([k, n, werte]) => `<div class="chips"><span class="mini">${n}:</span>${werte.map((w) => `<button class="chip" data-mopt="${k}" data-wert="${esc(w)}" aria-pressed="${(it.opt || {})[k] === w}" type="button">${esc(w)}</button>`).join("")}</div>`).join("")}
      <div class="wunsch">${(ITEM[it.id].frei ? [] : WUENSCHE).map((w, i) => `<label class="check"><input type="checkbox" data-mwunsch="${i}"${(it.wuensche || []).some((x) => x.text === w) ? " checked" : ""}> ${esc(w)}</label>`).join("")}</div>
      <label class="field" for="m-hinweis">${ITEM[it.id].frei ? "Hinweis für den Partnerbetrieb" : "Hinweis für die Reinigung"}<input id="m-hinweis" value="${esc(it.hinweis || "")}" placeholder="${ITEM[it.id].frei ? "z. B. Absatz schwarz, bis Freitag" : "z. B. nur dämpfen, nicht bügeln"}" autocomplete="off"></label>
      ${it.schau ? `<span class="ok-text">Warenschau: ${esc(it.schau.von)}, ${esc(it.schau.am)} · Kunde bestätigt</span>` : `<div><button class="btn small" data-mok type="button">${maengelVon(it).length ? "Warenschau abgeschlossen" : "Einwandfrei"} – Kunde bestätigt</button></div>`}
      <span class="mini">Was hier eingetragen wird, ist mit dem Kunden besprochen und gilt als von ihm bestätigt.</span></div>`;
  }
  // Dialog für ein Teil: Umriss links, Mängelliste und Formular rechts
  function maengelDialog(tnr, startZeit) {
    const f = allItems().find(({ it }) => it.tnr === tnr); if (!f) return;
    const dlg = document.createElement("dialog"); dlg.className = "maengel-dlg"; document.body.append(dlg);
    const zustand = { ansicht: (ANSICHTEN[f.it.id] || ["decke"])[0], seite: "vorne", neu: null, fotos: [], zeit: werkstattZugang() ? "bearbeitung" : startZeit || "annahme" };
    const zeichnen = () => {
      const { it, o } = allItems().find(({ it }) => it.tnr === tnr);
      const ans = ANSICHTEN[it.id] || ["decke"];
      const liste = (it.maengel || []).map((m, i) => `<li class="${m.gestrichen ? "weg" : ""}"><b>${i + 1}. ${esc(m.art)}${m.fleckart ? ` (${esc(m.fleckart)})` : ""}</b> · ${UMRISS[m.ansicht].name}, ${seiteText(m.ansicht, m.seite)}${m.notiz ? ` – ${esc(m.notiz)}` : ""}${m.behandlung ? `<br>Behandlung: ${esc(m.behandlung)}` : ""}${m.kunde ? ` <span class="ok-text">Kunde bestätigt</span>` : ""}
        <br><span class="mini">${esc(m.amText)} · ${esc(M_ZEIT[m.zeit] || "")} · erfasst von ${esc(m.vonName || m.geraet || "?")}${m.zeugeName ? ` · Vier-Augen mit ${esc(m.zeugeName)}` : ""}${m.gestrichen ? ` · gestrichen von ${esc(m.gestrichen.von)} (${esc(m.gestrichen.am)})` : ""}</span>
        ${(m.fotos || []).length ? `<span class="fotos klein">${m.fotos.map((id) => `<img class="foto" data-foto="${esc(id)}" alt="Foto zu Mangel ${i + 1}">`).join("")}</span>` : ""}
        ${m.gestrichen || (werkstattZugang() && m.zeit !== "bearbeitung") ? "" : `<button class="btn ghost small" data-mweg="${m.id}" type="button">Als Irrtum streichen</button>`}</li>`).join("");
      const n = zustand.neu;
      dlg.innerHTML = `<div class="md-links"><h2><span class="ampel ${rot(it) ? "rot" : geprueft(it) ? "gruen" : "grau"}"></span> ${teilLabel(o, it)} · ${esc(teilName(it))}</h2>
          <p class="mini">Auftrag ${o.nr} · ${esc(cust(o.cust).name)}</p>
          <div class="chips">${ans.length > 1 ? ans.map((k) => `<button class="chip" data-mans="${k}" aria-pressed="${k === zustand.ansicht}" type="button">${UMRISS[k].name}</button>`).join("") : ""}
            ${seitenNamen(zustand.ansicht).length > 1 ? `<button class="chip" data-mseite="vorne" aria-pressed="${zustand.seite === "vorne"}" type="button">${seitenNamen(zustand.ansicht)[0]}</button><button class="chip" data-mseite="hinten" aria-pressed="${zustand.seite === "hinten"}" type="button">${seitenNamen(zustand.ansicht)[1]}</button>` : ""}</div>
          ${umrissSvg(zustand.ansicht, zustand.seite, it, n && n.ansicht === zustand.ansicht && n.seite === zustand.seite ? n : null)}
          <p class="mini">Stelle des Mangels antippen.</p></div>
        <div class="md-rechts">${schauHtml(it)}${liste ? `<ol class="mliste">${liste}</ol>` : `<p class="mini">Noch keine Mängel erfasst. Mangel? Stelle links antippen.</p>`}
          ${n ? `<div class="kd md-form"><b>Neuer Mangel (Stelle markiert)</b>
            <label class="field" for="m-art">Art<select id="m-art">${M_ARTEN.map((a) => `<option${a === zustand.art ? " selected" : ""}>${a}</option>`).join("")}</select></label>
            ${(zustand.art || M_ARTEN[0]) === "Fleck" ? `<label class="field" for="m-fleck">Art des Flecks<select id="m-fleck">${FLECKEN.map((x) => `<option${x === zustand.fleckart ? " selected" : ""}>${x}</option>`).join("")}</select></label>` : ""}
            <label class="field" for="m-notiz">Beschreibung<input id="m-notiz" value="${esc(zustand.notiz || "")}" placeholder="z. B. ca. 1 cm, Knie links" autocomplete="off"></label>
            <label class="field" for="m-beh">Hinweis zur Behandlung (für die Reinigung)<input id="m-beh" value="${esc(zustand.behandlung || "")}" placeholder="z. B. nur vorsichtig, nicht reiben" autocomplete="off"></label>
            <label class="check"><input type="checkbox" id="m-kunde"${zustand.kunde ?? zustand.zeit === "annahme" ? " checked" : ""}> Kunde ist informiert und hat es bestätigt</label>
            <label class="field" for="m-zeit">Wann erfasst?<select id="m-zeit">${Object.entries(M_ZEIT).filter(([k]) => !werkstattZugang() || k === "bearbeitung").map(([k, v]) => `<option value="${k}"${k === zustand.zeit ? " selected" : ""}>${v}</option>`).join("")}</select></label>
            <label class="field" for="m-von">Erfasst von<select id="m-von">${maOptionen(zustand.von ?? bediener)}</select></label>
            <label class="check"><input type="checkbox" id="m-4a"${zustand.vier ? " checked" : ""}> Vier-Augen-Prinzip: zweite Person war dabei</label>
            ${zustand.vier ? `<label class="field" for="m-zeuge">Zweite Person<select id="m-zeuge">${maOptionen(zustand.zeuge, "– bitte wählen –", zustand.von ?? bediener)}</select></label>` : ""}
            ${zustand.zeit === "nachtraeglich" && !zustand.vier ? `<span class="pay-warn">Nachträglich ohne Kunde: Vier-Augen-Prinzip wird empfohlen.</span>` : ""}
            <div class="chips"><label class="btn ghost small foto-knopf">Foto aufnehmen (${zustand.fotos.length})<input type="file" accept="image/*" capture="environment" id="m-foto" hidden></label></div>
            ${zustand.fotos.length ? `<span class="fotos klein">${zustand.fotos.map((id) => `<img class="foto" data-foto="${esc(id)}" alt="neues Foto">`).join("")}</span>` : ""}
            <div class="chips"><button class="btn" data-msave type="button">Mangel speichern</button><button class="btn ghost" data-mabbr type="button">Verwerfen</button></div></div>` : ""}
          <div class="chips"><button class="btn ghost" data-mzu type="button">Fertig</button></div></div>`;
      fotosZeigen();
    };
    // Formularwerte beim Neuzeichnen behalten
    const merken = () => { const g = (id) => dlg.querySelector("#" + id);
      if (g("m-art")) Object.assign(zustand, { art: g("m-art").value, fleckart: g("m-fleck") ? g("m-fleck").value : zustand.fleckart, behandlung: g("m-beh").value, kunde: g("m-kunde").checked, notiz: g("m-notiz").value, zeit: g("m-zeit").value, von: g("m-von").value, vier: g("m-4a").checked, zeuge: g("m-zeuge") ? g("m-zeuge").value : zustand.zeuge }); };
    dlg.addEventListener("click", (e) => {
      e.stopPropagation();
      const svg = e.target.closest("svg.umriss");
      if (svg) { merken(); const r = svg.getBoundingClientRect(); zustand.neu = { ansicht: svg.dataset.umriss, seite: svg.dataset.seite, x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; zeichnen(); return; }
      const b = e.target.closest("button"); if (!b) return; const ds = b.dataset;
      if (ds.mans) { merken(); zustand.ansicht = ds.mans; zeichnen(); }
      else if (ds.mseite) { merken(); zustand.seite = ds.mseite; zeichnen(); }
      else if ("mabbr" in ds) { zustand.neu = null; zustand.fotos = []; zustand.notiz = ""; zeichnen(); }
      else if ("mzu" in ds) dlg.close();
      else if (ds.mopt) { merken(); const { it, o } = allItems().find(({ it }) => it.tnr === tnr); it.opt = it.opt || {}; it.opt[ds.mopt] = it.opt[ds.mopt] === ds.wert ? "" : ds.wert; change(o); zeichnen(); }
      else if ("mok" in ds) { merken(); const { it, o } = allItems().find(({ it }) => it.tnr === tnr); schauOk(it, o); zeichnen(); }
      else if (ds.mweg) {
        const { it, o } = allItems().find(({ it }) => it.tnr === tnr); const m = it.maengel.find((x) => x.id === ds.mweg);
        m.gestrichen = { am: jetztText(), von: wer() }; change(o); zeichnen();
      }
      else if ("msave" in ds) {
        merken();
        if (aktiveMa().length && !zustand.von) { toast("Bitte auswählen, wer den Mangel erfasst"); return; }
        if (zustand.vier && !zustand.zeuge) { toast("Bitte die zweite Person auswählen"); return; }
        const { it, o } = allItems().find(({ it }) => it.tnr === tnr);
        const n = zustand.neu;
        (it.maengel ||= []).push({ id: Date.now().toString(36), art: zustand.art || M_ARTEN[0], notiz: (zustand.notiz || "").trim(), ansicht: n.ansicht, seite: n.seite,
          x: Math.round(n.x * 1000) / 1000, y: Math.round(n.y * 1000) / 1000, fotos: zustand.fotos.slice(), zeit: zustand.zeit,
          fleckart: (zustand.art || M_ARTEN[0]) === "Fleck" ? zustand.fleckart || FLECKEN[0] : "", behandlung: (zustand.behandlung || "").trim(), kunde: !!zustand.kunde,
          am: new Date().toISOString(), amText: jetztText(), von: zustand.von || "", vonName: maName(zustand.von) || "", geraet: meta.geraet || "",
          zeuge: zustand.vier ? zustand.zeuge : "", zeugeName: zustand.vier ? maName(zustand.zeuge) : "" });
        change(o); toast("Mangel gespeichert");
        Object.assign(zustand, { neu: null, fotos: [], notiz: "", behandlung: "", fleckart: "", kunde: undefined, vier: false, zeuge: "" }); zeichnen();
      }
    });
    dlg.addEventListener("change", (e) => {
      if (e.target.id === "m-foto" && e.target.files[0]) {
        merken();
        fotoSpeichern(e.target.files[0]).then((id) => { if (id) { zustand.fotos.push(id); zeichnen(); } });
      } else if (["m-4a", "m-zeit", "m-von", "m-art"].includes(e.target.id)) { merken(); if (e.target.id === "m-zeit") zustand.kunde = undefined; zeichnen(); }
      else if (e.target.dataset.mwunsch !== undefined || e.target.id === "m-hinweis") {
        merken(); const { it, o } = allItems().find(({ it }) => it.tnr === tnr);
        if (e.target.id === "m-hinweis") it.hinweis = e.target.value.trim();
        else { const w = WUENSCHE[+e.target.dataset.mwunsch]; it.wuensche = (it.wuensche || []).filter((x) => x.text !== w); if (e.target.checked) it.wuensche.push({ text: w, am: jetztText(), von: wer(), kunde: true }); }
        change(o); zeichnen();
      }
    });
    dlg.addEventListener("close", () => { dlg.remove(); render(); });
    zeichnen(); dlg.showModal();
  }

  // ---------------------------------------------------------------- Sammler: eine Nummer pro Abgabe, Teile als „3/8“
  // Die Sammelnummer ist die Auftragsnummer ohne Geschäftskürzel (W-1001 → 1001). Teile intern: W-1001-3.
  const zahl = (nr) => nr.split("-")[1] || nr;
  const teilPos = (o, it) => (o.items || []).indexOf(it) + 1;
  const teilLabel = (o, it) => `${zahl(o.nr)} · ${teilPos(o, it)}/${(o.items || []).length}`;
  // Vorgaben je Artikel, die der Reiniger sehen muss
  const OPTIONEN = { hose: [["buegelfalte", "Bügelfalte", ["mit", "ohne"]]], anzug: [["buegelfalte", "Bügelfalte", ["mit", "ohne"]]],
    hemd: [["staerke", "Stärke", ["ohne", "leicht", "kräftig"]]], "hemd-g": [["staerke", "Stärke", ["ohne", "leicht", "kräftig"]]], bluse: [["staerke", "Stärke", ["ohne", "leicht"]]],
    rock: [["falten", "Falten", ["wie vorhanden", "neu legen"]]], gardine: [["fertig", "Rückgabe", ["gelegt", "auf Rolle / hängend"]]], vorhang: [["fertig", "Rückgabe", ["gelegt", "auf Rolle / hängend"]]] };
  // Kundenwünsche und Freigaben – jede davon macht das Teil „rot“ (Vermerk beachten)
  const WUENSCHE = ["Kunde wünscht Wäsche / Nassreinigung trotz Pflegeetikett", "Behandlung ohne Gewähr – Kunde ist informiert", "Ohne Pflegeetikett – Kunde ist informiert",
    "Fleck nur schonend versuchen", "Knöpfe / Applikationen vorher sichern", "Express – bevorzugt bearbeiten"];
  const FLECKEN = ["unbekannt", "Rotwein / Saft", "Kaffee / Tee", "Fett / Öl", "Blut", "Make-up", "Kugelschreiber / Tinte", "Gras / Erde", "Schweiß / Deo", "Rost", "Wachs", "Kaugummi"];
  const rot = (it) => maengelVon(it).length > 0 || (it.wuensche || []).length > 0 || !!(it.hinweis || "").trim() || (it.anfragen || []).length > 0;
  const geprueft = (it) => !!it.schau || maengelVon(it).length > 0;
  function vermerke(it) {
    const out = [];
    (it.wuensche || []).forEach((w) => out.push(`<li class="w">${esc(w.text)}</li>`));
    if ((it.hinweis || "").trim()) out.push(`<li class="w">Hinweis: ${esc(it.hinweis)}</li>`);
    maengelVon(it).forEach((m) => out.push(`<li>${esc(m.art)}${m.fleckart ? ` (${esc(m.fleckart)})` : ""} · ${esc(UMRISS[m.ansicht].name)} ${seiteText(m.ansicht, m.seite)}${m.notiz ? ` – ${esc(m.notiz)}` : ""}${m.behandlung ? `<br><b>Behandlung:</b> ${esc(m.behandlung)}` : ""}${m.kunde ? ` <span class="ok-text">Kunde bestätigt</span>` : ""}</li>`));
    return out.join("");
  }
  const optText = (it) => (OPTIONEN[it.id] || []).filter(([k]) => it.opt && it.opt[k]).map(([k, n]) => `${n}: ${it.opt[k]}`).join(" · ");

  // Teileliste im Auftrag: Warenschau mit grünem Haken / rotem Punkt
  function teileZustand(o) {
    const its = o.items || []; if (!its.length) return "";
    const offen = its.filter((it) => !geprueft(it)).length;
    return `<div class="teile-zustand"><div class="tz-kopf"><b>Warenschau · Sammler ${zahl(o.nr)} · ${its.length} ${its.length === 1 ? "Teil" : "Teile"}</b>${offen ? `<span class="pay-warn">${offen} noch nicht geprüft</span>` : `<span class="ok-text">alle geprüft</span>`}</div>
      ${its.map((it) => `<div class="tz"><span class="ampel ${rot(it) ? "rot" : geprueft(it) ? "gruen" : "grau"}" aria-label="${rot(it) ? "Vermerk beachten" : geprueft(it) ? "geprüft, einwandfrei" : "noch nicht geprüft"}"></span>
        <span><b>${teilPos(o, it)}/${its.length} ${esc(teilName(it))}</b> ${stPill(it.st)}${optText(it) ? `<br><span class="mini">${esc(optText(it))}</span>` : ""}${rot(it) ? `<br><span class="mini">${[...(it.wuensche || []).map((w) => w.text), ...maengelVon(it).map((m) => m.art)].map(esc).join(" · ")}</span>` : ""}${anfragenListe(it, true)}</span>
        <span class="chips">${geprueft(it) ? "" : `<button class="btn small ghost" data-schauok="${it.tnr}" type="button">Einwandfrei</button>`}<button class="btn small ${rot(it) ? "warnung" : "ghost"}" data-maengel="${it.tnr}" type="button">Prüfen</button></span></div>`).join("")}
      <span class="mini">Grün: nach Pflegeetikett und Fachwissen. Rot: Vermerk beachten (Mangel, Kundenwunsch oder Hinweis).</span></div>`;
  }
  function schauOk(it, o) { it.schau = { am: jetztText(), von: bedienerName() || meta.geraet || "", kunde: true }; change(o); }

  // ---------------------------------------------------------------- Drucken: Abholschein, Sammler (für die Tüte), Etiketten (für die Teile)
  const MONO = 'ui-monospace, Menlo, "Courier New", monospace', SANS = 'Archivo, "Arial Black", "Helvetica Neue", Arial, sans-serif';
  function leinwand(w, h) { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); return [cv, g]; }
  function umbruch(g, s, f, max) { g.font = f; const out = []; let z = ""; String(s).split(" ").forEach((w) => { const t2 = z ? z + " " + w : w; if (g.measureText(t2).width > max && z) { out.push(z); z = "   " + w; } else z = t2; }); if (z) out.push(z); return out; }
  function sammlerBild(o) {
    const W = 576, X = 24, IW = W - 48; const its = o.items || [];
    const zeilen = []; // [text, font, extra]
    its.forEach((it) => {
      zeilen.push([`${rot(it) ? "●" : "✓"} ${teilPos(o, it)}/${its.length}  ${teilName(it)}`, `700 26px ${SANS}`]);
      if (optText(it)) zeilen.push([`   ${optText(it)}`, `22px ${MONO}`]);
      (it.wuensche || []).forEach((w) => zeilen.push([`   ! ${w.text}`, `22px ${MONO}`]));
      if ((it.hinweis || "").trim()) zeilen.push([`   ! ${it.hinweis}`, `22px ${MONO}`]);
      anfragenVon(it).forEach((a) => zeilen.push([`   ? ${a.kurz} – ${a.antwort ? (a.antwort.ja ? "Kunde hat zugestimmt" : "Kunde hat abgelehnt") : "wartet auf Antwort"}`, `22px ${MONO}`]));
      maengelVon(it).forEach((m) => zeilen.push([`   - ${m.art}${m.fleckart ? " (" + m.fleckart + ")" : ""}, ${UMRISS[m.ansicht].name} ${seiteText(m.ansicht, m.seite)}${m.notiz ? ": " + m.notiz : ""}${m.behandlung ? " → " + m.behandlung : ""}${m.kunde ? " [Kunde bestätigt]" : ""}`, `22px ${MONO}`]));
    });
    const [, mg] = leinwand(1, 1); const fertig = zeilen.flatMap(([t, f]) => umbruch(mg, t, f, IW).map((z) => [z, f]));
    const H = 580 + fertig.length * 32;
    const [cv, g] = leinwand(W, H); let y = 70;
    const mitte = (t, f) => { g.font = f; g.fillStyle = "#111"; g.textAlign = "center"; g.fillText(t, W / 2, y); g.textAlign = "left"; };
    mitte("S A M M L E R", `700 28px ${MONO}`); y += 120; mitte(zahl(o.nr), `800 120px ${SANS}`); y += 50;
    mitte(`${its.length} ${its.length === 1 ? "Teil" : "Teile"} · ${its.filter(rot).length} mit Vermerk`, `700 28px ${SANS}`); y += 40;
    mitte(`${o.nr} · ${cust(o.cust).name}`, `24px ${MONO}`); y += 34; mitte(`abholbereit ab ${fmtDate(o.due)}`, `700 24px ${MONO}`); y += 26;
    g.fillRect(X, y, IW, 3); y += 42;
    fertig.forEach(([z, f]) => { g.font = f; g.fillStyle = "#111"; g.fillText(z, X, y); y += 32; });
    y += 4; g.fillRect(X, y, IW, 3); y += 20;
    SCHEIN.strichcode(g, zahl(o.nr), W / 2, y, IW * 0.7, 70); y += 100;
    mitte("Nicht mit in die Reinigung geben", `22px ${MONO}`);
    return cv;
  }
  function etikettBild(o, it) {
    const W = 576, H = 230; const [cv, g] = leinwand(W, H);
    g.fillStyle = "#111"; g.font = `800 92px ${SANS}`; g.fillText(zahl(o.nr), 24, 100);
    const zw = g.measureText(zahl(o.nr)).width;
    g.font = `700 34px ${SANS}`; g.fillText(`${teilPos(o, it)}/${(o.items || []).length}`, 40 + zw, 96);
    g.font = `26px ${MONO}`; g.fillText(teilName(it).slice(0, 32), 24, 146);
    if (optText(it)) { g.font = `20px ${MONO}`; g.fillText(optText(it).slice(0, 44), 24, 176); }
    if (rot(it)) { g.beginPath(); g.arc(W - 60, 64, 38, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.font = `800 44px ${SANS}`; g.textAlign = "center"; g.fillText("!", W - 60, 80); g.textAlign = "left"; g.fillStyle = "#111"; }
    SCHEIN.strichcode(g, `${zahl(o.nr)}-${teilPos(o, it)}`, W - 150, 150, 230, 56);
    return cv;
  }
  function drucken(o, was) {
    const bilder = [];
    if (was === "schein" || was === "alles") bilder.push(SCHEIN.zeichnen(belegDaten(o), null, { druck: true }));
    if (was === "sammler" || was === "alles") bilder.push(sammlerBild(o));
    if (was === "etiketten" || was === "alles") (o.items || []).forEach((it) => bilder.push(etikettBild(o, it)));
    const box = document.getElementById("druck");
    box.innerHTML = bilder.map(() => `<img alt="">`).join("");
    bilder.forEach((cv, i) => (box.children[i].src = cv.toDataURL("image/png")));
    Promise.all([...box.children].map((im) => im.decode().catch(() => {}))).then(() => window.print());
  }
  function druckBox(o) {
    return `<div class="chips druck-knoepfe"><span class="mini">Drucken:</span>
      <button class="btn ghost small" data-print="alles" type="button">Alles</button>
      <button class="btn ghost small" data-print="schein" type="button">Abholschein</button>
      <button class="btn ghost small" data-print="sammler" type="button">Sammler</button>
      <button class="btn ghost small" data-print="etiketten" type="button">Etiketten (${(o.items || []).length})</button></div>`;
  }

  // ---------------------------------------------------------------- Werkstatt: Sammelnummer eingeben, Teile mit grün/rot sehen
  function findeSammler(eingabe) {
    const v = (eingabe || "").trim().toUpperCase().replace(/\s+/g, "");
    const m = v.match(/^(?:TAYFUN)?([A-Z]{1,2})?-?(\d{3,7})(?:-(\d{1,3}))?(?:-[A-Z0-9]{4})?$/); if (!m) return null;
    const kand = db.orders.filter((o) => zahl(o.nr) === m[2] && (!m[1] || o.store === m[1]));
    const o = kand.find((x) => x.store === ui.store) || kand[0];
    return o ? { o, pos: m[3] ? +m[3] : null } : null;
  }
  // Kunde und Vorgeschichte für die Werkstatt: wer, was früher abgegeben, frühere Mängel und Reklamationen
  function kundeKasten(o) {
    const c = cust(o.cust); const lauf = c.id === "LAUF";
    const frueher = lauf ? [] : db.orders.filter((x) => x.cust === c.id && x.nr !== o.nr).sort((a, b) => b.date.localeCompare(a.date));
    const rekl = lauf ? [] : tickets().filter((t) => t.cust === c.id).sort((a, b) => b.erstellt.localeCompare(a.erstellt));
    const nr = handyNr(c.tel);
    const zeile = (x) => { const its = x.items || []; const hin = its.flatMap((it) => [...maengelVon(it).map((m) => `${teilName(it)}: ${m.art}`), ...(it.wuensche || []).map((w) => `${teilName(it)}: ${w.text}`), ...anfragenVon(it).filter((a) => a.antwort).map((a) => `${teilName(it)}: ${a.kurz} – ${a.antwort.ja ? "zugestimmt" : "abgelehnt"}`)]);
      return `<li><b>${fmtDate(x.date)} · Sammler ${zahl(x.nr)}</b> · ${its.map((it) => teilName(it)).join(", ")} ${pill(x)}${hin.length ? `<br><span class="mini">${hin.map(esc).join(" · ")}</span>` : ""}</li>`; };
    return `<div class="panel ws-kunde"><div><span class="mini">Kunde</span><b>${esc(c.name)}</b>
        ${!lauf && anschrift(c) ? `<span class="mini">${esc(anschrift(c))}</span>` : ""}${lauf ? `<span class="mini">Laufkunde ohne Namen und Telefonnummer</span>` : `<span>${c.tel && c.tel !== "–" ? `<a href="tel:${esc(c.tel.replace(/[^\d+]/g, ""))}">${esc(c.tel)}</a>` : "keine Telefonnummer"} · ${frueher.length ? `${frueher.length} frühere ${frueher.length === 1 ? "Abgabe" : "Abgaben"}` : "erste Abgabe"}${rekl.length ? ` · <b class="warn-text">${rekl.length} ${rekl.length === 1 ? "Reklamation" : "Reklamationen"}</b>` : ""}</span>`}</div>
      ${nr ? `<a class="btn small wa-btn" href="https://wa.me/${nr}?text=${encodeURIComponent(`Guten Tag ${vorname(c)}, hier ist die Werkstatt von Tayfun Textilpflege zu Ihrem Auftrag ${zahl(o.nr)}: `)}" target="_blank" rel="noopener">WhatsApp an ${esc(vorname(c))}</a>` : ""}
      ${frueher.length || rekl.length ? `<details class="ws-historie"><summary>Vorgeschichte anzeigen</summary>
        ${rekl.length ? `<b>Reklamationen</b><ul>${rekl.map((t) => `<li><b>${fmtDate(t.erstellt)} · ${t.id}</b> (Sammler ${zahl(t.auftrag)}) · ${esc(t.grund)}${t.text ? ": " + esc(t.text) : ""} · ${t.ergebnis ? esc(T_ERGEBNIS[t.ergebnis.art]) : esc(T_STATUS[t.status][0])}</li>`).join("")}</ul>` : ""}
        ${frueher.length ? `<b>Frühere Abgaben</b><ul>${frueher.slice(0, 15).map(zeile).join("")}</ul>${frueher.length > 15 ? `<p class="mini">… und ${frueher.length - 15} ältere</p>` : ""}` : ""}</details>` : ""}</div>`;
  }
  function werkstattAnsicht() {
    const f = ui.wsNr ? findeSammler(ui.wsNr) : null; const o = f && f.o;
    const its = o ? o.items || [] : [];
    const kopf = `<div class="pickbox"><b>Sammler aufrufen</b><label class="field" for="ws-nr">Nummer vom Etikett oder Sammler eintippen oder scannen, dann Enter<input id="ws-nr" inputmode="numeric" value="${esc(ui.wsNr || "")}" placeholder="z. B. 1001" autocomplete="off" enterkeyhint="go"></label></div>`;
    if (!ui.wsNr) {
      const offen = db.orders.filter(inStore).filter((x) => ["arbeit", "kundendienst"].includes(x.status)).sort((a, b) => a.due.localeCompare(b.due));
      return kopf + `<div class="panel"><h2>In Arbeit (${offen.length})</h2>${offen.length ? `<div class="list">${offen.slice(0, 40).map((x) => `<button class="row" data-ws="${zahl(x.nr)}" type="button"><span class="t">Sammler ${zahl(x.nr)} · ${esc(cust(x.cust).name)} · ${(x.items || []).length} Teile${(x.items || []).some(rot) ? ` <span class="pill p-alt">${x.items.filter(rot).length} mit Vermerk</span>` : ""}</span><span class="s num">abholbereit ab ${fmtDate(x.due)}</span><span class="r">${pill(x)}</span></button>`).join("")}</div>` : `<p class="empty">Nichts in Arbeit.</p>`}</div>`;
    }
    if (!o) return kopf + `<p class="empty">Kein Sammler mit der Nummer ${esc(ui.wsNr)} gefunden.</p>`;
    const zaehl = o.zaehlung;
    return kopf + `${kundeKasten(o)}<div class="panel ws-kopf"><div><span class="mini">Sammler</span><b class="ws-nr">${zahl(o.nr)}</b></div>
        <div><b class="ws-anz">${its.length} ${its.length === 1 ? "Teil" : "Teile"}</b><span class="mini">${its.filter(rot).length} mit Vermerk · abholbereit ab <b>${fmtDate(o.due)}</b></span>
        ${zaehl ? `<span class="ok-text">Anzahl geprüft: ${esc(zaehl.von)}, ${esc(zaehl.am)}</span>` : `<button class="btn small" data-wszaehl type="button">${its.length} ${its.length === 1 ? "Teil" : "Teile"} nachgezählt – stimmt</button>`}</div>
        <div class="chips"><button class="btn ghost small" data-wsalle="reinigung" type="button">Alle in Reinigung</button><button class="btn ghost small" data-wsalle="finish" type="button">Alle ins Finish</button><button class="btn small" data-wsalle="fertig" type="button">Alle fertig</button></div></div>
      ${its.map((it) => `<div class="panel ws-teil ${rot(it) ? "rot" : "gruen"}${f.pos === teilPos(o, it) ? " gewaehlt" : ""}">
        <div class="ws-teil-kopf"><span class="ampel ${rot(it) ? "rot" : "gruen"}"></span><b>${teilLabel(o, it)} · ${esc(teilName(it))}</b>${stPill(it.st)}</div>
        ${optText(it) ? `<div class="ws-opt">${esc(optText(it))}</div>` : ""}
        ${rot(it) ? `${vermerke(it) ? `<ul class="ws-vermerke">${vermerke(it)}</ul>` : ""}${anfragenListe(it, true)}` : `<p class="ok-text">Nach Pflegeetikett und eigener Fachkenntnis behandeln.</p>`}
        ${maengelVon(it).some((m) => (m.fotos || []).length) ? `<div class="fotos klein">${maengelVon(it).flatMap((m) => m.fotos || []).map((id) => `<img class="foto" data-foto="${esc(id)}" alt="Foto">`).join("")}</div>` : ""}
        <div class="chips">${["reinigung", "finish", "extern", "fertig"].map((s) => `<button class="chip" data-wsst="${it.tnr}" data-st="${s}" aria-pressed="${it.st === s}" type="button">${ST[s]}</button>`).join("")}
          <button class="btn ghost small" data-maengel="${it.tnr}" data-zeit="bearbeitung" type="button">Feststellung / Foto</button>
          <button class="btn small wa-btn" data-anfrage="${it.tnr}" type="button">Kunde fragen (WhatsApp)</button></div></div>`).join("")}`;
  }

  // ---------------------------------------------------------------- Rückfragen an den Kunden per WhatsApp (auch direkt aus der Werkstatt)
  // Jede Anfrage wird am Teil festgehalten; die Antwort des Kunden trägt man mit „zugestimmt“ / „abgelehnt“ ein.
  const anfragenVon = (it) => it.anfragen || [];
  const offeneAnfragen = (it) => anfragenVon(it).filter((a) => !a.antwort);
  const VORLAGEN = [
    ["rueckfrage", "Rückfrage zur Behandlung", (v, t, f, m) => `${v}, hier ist die Werkstatt von Tayfun Textilpflege. Bei Ihrem Auftrag ${t} haben wir festgestellt: ${f || "…"}. Dürfen wir ${m || "…"} durchführen? Bitte antworten Sie kurz mit Ja oder Nein. Vielen Dank!`],
    ["nass", "Nassreinigung nötig", (v, t, f) => `${v}, hier ist die Werkstatt von Tayfun Textilpflege. Wir haben Ihr Teil aus Auftrag ${t} gereinigt${f ? " und festgestellt: " + f : ""}. Für ein gutes Ergebnis wäre eine Nassreinigung nötig. Dürfen wir diese durchführen? Bitte antworten Sie kurz mit Ja oder Nein. Vielen Dank!`],
    ["fleck", "Fleck nicht ganz entfernbar", (v, t, f) => `${v}, hier ist die Werkstatt von Tayfun Textilpflege. Bei Ihrem Auftrag ${t} lässt sich ${f || "ein Fleck"} ohne Risiko für das Material leider nicht vollständig entfernen. Sollen wir es mit einer stärkeren Behandlung auf eigenes Risiko versuchen, oder so belassen? Vielen Dank für Ihre kurze Antwort!`],
    ["reparatur", "Reparatur nötig", (v, t, f, m) => `${v}, hier ist die Werkstatt von Tayfun Textilpflege. Bei Ihrem Auftrag ${t} ist uns aufgefallen: ${f || "…"}. Wir könnten ${m || "das"} für Sie reparieren lassen. Möchten Sie das? Bitte antworten Sie kurz mit Ja oder Nein.`],
    ["frei", "Freie Nachricht", (v, t) => `${v}, hier ist die Werkstatt von Tayfun Textilpflege zu Ihrem Auftrag ${t}: `],
  ];
  function anfrageDialog(tnr) {
    const f = allItems().find(({ it }) => it.tnr === tnr); if (!f) return;
    const dlg = document.createElement("dialog"); dlg.className = "maengel-dlg anfrage-dlg"; document.body.append(dlg);
    const letzter = maengelVon(f.it).slice(-1)[0];
    const z = { vorlage: "rueckfrage", fest: letzter ? `${letzter.art}${letzter.notiz ? " (" + letzter.notiz + ")" : ""}` : "", mass: "", kontakt: null, fehler: "" };
    const text = () => { const { o, it } = allItems().find(({ it }) => it.tnr === tnr); const v = z.kontakt && z.kontakt.vorname ? `Guten Tag ${z.kontakt.vorname}` : "Guten Tag";
      return VORLAGEN.find((x) => x[0] === z.vorlage)[2](v, `${zahl(o.nr)} (${teilName(it)}, Teil ${teilPos(o, it)}/${o.items.length})`, z.fest.trim(), z.mass.trim()); };
    const zeichnen = () => {
      const { it, o } = allItems().find(({ it }) => it.tnr === tnr);
      const nr = z.kontakt ? handyNr(z.kontakt.tel) : "";
      dlg.innerHTML = `<div class="md-links"><h2>Kunde fragen · ${teilLabel(o, it)} · ${esc(teilName(it))}</h2>
          <label class="field" for="af-vorlage">Vorlage<select id="af-vorlage">${VORLAGEN.map(([k, n]) => `<option value="${k}"${k === z.vorlage ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          ${z.vorlage !== "frei" ? `<label class="field" for="af-fest">Was wurde festgestellt?<input id="af-fest" value="${esc(z.fest)}" placeholder="z. B. Wasserflecken am Saum" autocomplete="off"></label>` : ""}
          ${["rueckfrage", "reparatur"].includes(z.vorlage) ? `<label class="field" for="af-mass">Was möchten wir tun?<input id="af-mass" value="${esc(z.mass)}" placeholder="z. B. eine Nassreinigung" autocomplete="off"></label>` : ""}
          <label class="field" for="af-text">Nachricht (kann noch geändert werden)<textarea id="af-text" rows="7">${esc(z.textEigen ?? text())}</textarea></label>
          ${z.fehler ? `<p class="pay-warn">${esc(z.fehler)}</p>` : !z.kontakt ? `<p class="mini">Telefonnummer wird geladen …</p>` : ""}
          <div class="chips">${nr ? `<a class="btn wa-btn" id="af-senden" href="https://wa.me/${nr}?text=${encodeURIComponent(z.textEigen ?? text())}" target="_blank" rel="noopener">Per WhatsApp senden</a>` : ""}
            <button class="btn ghost" data-afzu type="button">Schließen</button></div>
          <p class="mini">Die Antwort kommt im WhatsApp-Chat des Geschäfts an. Danach hier oder im Laden „zugestimmt“ oder „abgelehnt“ eintragen.</p></div>
        <div class="md-rechts"><b>Anfragen zu diesem Teil</b>${anfragenListe(it, true) || `<p class="mini">Noch keine.</p>`}</div>`;
    };
    dlg.addEventListener("input", (e) => {
      if (e.target.id === "af-text") { z.textEigen = e.target.value; const a = dlg.querySelector("#af-senden"); if (a && z.kontakt) a.href = `https://wa.me/${handyNr(z.kontakt.tel)}?text=${encodeURIComponent(z.textEigen)}`; }
      else if (e.target.id === "af-fest" || e.target.id === "af-mass") { z[e.target.id === "af-fest" ? "fest" : "mass"] = e.target.value; z.textEigen = undefined; const ta = dlg.querySelector("#af-text"); ta.value = text(); const a = dlg.querySelector("#af-senden"); if (a) a.href = `https://wa.me/${handyNr(z.kontakt.tel)}?text=${encodeURIComponent(text())}`; }
    });
    dlg.addEventListener("change", (e) => { if (e.target.id === "af-vorlage") { z.vorlage = e.target.value; z.textEigen = undefined; zeichnen(); } });
    dlg.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest("#af-senden")) {
        // Senden geschieht in WhatsApp; hier wird die Anfrage festgehalten
        const { it, o } = allItems().find(({ it }) => it.tnr === tnr);
        (it.anfragen ||= []).push({ id: Date.now().toString(36), am: jetztText(), von: wer(), text: z.textEigen ?? text(), kurz: VORLAGEN.find((x) => x[0] === z.vorlage)[1] + (z.mass ? ": " + z.mass : z.fest ? ": " + z.fest : "") });
        change(o); setTimeout(zeichnen, 300); return;
      }
      const b = e.target.closest("button"); if (!b) return;
      if ("afzu" in b.dataset) dlg.close();
      else antwortKlick(b, tnr, zeichnen);
    });
    dlg.addEventListener("close", () => { dlg.remove(); render(); });
    zeichnen(); dlg.showModal();
    const c = cust(f.o.cust);
    if (c.tel && c.tel !== "–" && handyNr(c.tel)) { z.kontakt = { tel: c.tel, vorname: vorname(c) }; zeichnen(); }
    else { z.fehler = "Für diesen Kunden ist keine Handynummer hinterlegt."; zeichnen(); }
  }
  // Liste der Anfragen mit Antwort-Knöpfen (in Werkstatt-Karte, Dialogen und Auftrag)
  function anfragenListe(it, knoepfe) {
    const a = anfragenVon(it); if (!a.length) return "";
    return `<ul class="ws-vermerke anfragen">${a.map((x) => `<li class="${x.antwort ? (x.antwort.ja ? "ja" : "nein") : "w"}"><b>Anfrage per WhatsApp</b> (${esc(x.am)}, ${esc(x.von)}): ${esc(x.kurz)}
      ${x.antwort ? `<br><b>${x.antwort.ja ? "Kunde hat zugestimmt" : "Kunde hat abgelehnt"}</b> · ${esc(x.antwort.am)}, eingetragen von ${esc(x.antwort.von)}${x.antwort.notiz ? " · " + esc(x.antwort.notiz) : ""}`
        : `<br><span class="pill p-alt">wartet auf Antwort</span>${knoepfe ? ` <button class="btn small" data-afja="${x.id}" data-teilnr="${it.tnr}" type="button">Kunde hat zugestimmt</button> <button class="btn ghost small" data-afnein="${x.id}" data-teilnr="${it.tnr}" type="button">Kunde hat abgelehnt</button>` : ""}`}</li>`).join("")}</ul>`;
  }
  function antwortKlick(b, tnr, danach) {
    const ds = b.dataset; const id = ds.afja || ds.afnein; if (!id) return false;
    const f = allItems().find(({ it }) => it.tnr === (ds.teilnr || tnr)); const x = anfragenVon(f.it).find((y) => y.id === id);
    const notiz = (window.prompt(ds.afja ? "Zustimmung – kurzer Vermerk (freiwillig), z. B. „per WhatsApp: Ja, gerne“" : "Ablehnung – kurzer Vermerk (freiwillig)", "") || "").trim();
    x.antwort = { ja: !!ds.afja, am: jetztText(), von: wer(), notiz }; change(f.o); toast(ds.afja ? "Zustimmung eingetragen" : "Ablehnung eingetragen");
    if (danach) danach(); else render();
    return true;
  }

  // ---------------------------------------------------------------- Kundenkartei: Stammkunden mit Adresse, Lage, Kontaktweg und Einwilligungen
  const KONTAKTWEGE = { whatsapp: "WhatsApp", sms: "SMS", mail: "E-Mail", anruf: "Anruf" };
  const mailOk = (m) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m || "");
  const telDa = (t) => !!t && t !== "–";
  const anschrift = (c) => [[c.strasse, c.lage].filter(Boolean).join(", "), [c.plz, c.ort].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  // Name aus Firma oder Vor- und Nachname, damit Suche und Listen weiter funktionieren
  const kundenName = (c) => (c.firma ? c.firma + (c.nachname ? ` (${[c.vorname, c.nachname].filter(Boolean).join(" ")})` : "") : [c.vorname, c.nachname].filter(Boolean).join(" ")) || c.name || "";

  function karteiDialog(id, vorgabe, danach) {
    const alt = id ? db.customers.find((c) => c.id === id) : null;
    const k = alt ? { ...alt } : { vorname: "", nachname: "", ...(vorgabe || {}) };
    // Bisher nur „Name“ (Schnell-Kunde): in Vor- und Nachname aufteilen
    const quelle = !alt ? vorgabe && !vorgabe.vorname && vorgabe.name : !alt.vorname && !alt.nachname && !alt.firma && alt.name;
    if (quelle) { const t = quelle.trim().split(/\s+/); k.nachname = t.length > 1 ? t.pop() : ""; k.vorname = t.join(" "); }
    const dlg = document.createElement("dialog"); dlg.className = "maengel-dlg kartei-dlg"; document.body.append(dlg);
    const f = (feld, label, extra = "") => `<label class="field" for="k-${feld}">${label}<input id="k-${feld}" value="${esc(k[feld] || "")}" autocomplete="off" ${extra}></label>`;
    const ein = k.einwilligung || {};
    dlg.innerHTML = `<form class="kartei-form" method="dialog">
      <h2>${alt ? `Karteikarte ${esc(alt.id)}` : "Neuer Stammkunde"}</h2>
      <div class="row2"><label class="field" for="k-anrede">Anrede<select id="k-anrede">${["", "Frau", "Herr", "Divers / keine"].map((a) => `<option${a === (k.anrede || "") ? " selected" : ""}>${a}</option>`).join("")}</select></label>${f("firma", "Firma (falls Geschäftskunde)")}</div>
      <div class="row2">${f("vorname", "Vorname")}${f("nachname", "Nachname")}</div>
      <div class="row2">${f("tel", "Handy (für WhatsApp und SMS)", 'type="tel" inputmode="tel"')}${f("tel2", "Festnetz", 'type="tel" inputmode="tel"')}</div>
      ${f("mail", "E-Mail", 'type="email" inputmode="email"')}
      <div class="row2">${f("strasse", "Straße und Hausnummer")}${f("lage", "Stockwerk / Lage / Klingel", 'placeholder="z. B. 3. OG links, Klingel Müller"')}</div>
      <div class="row2">${f("plz", "PLZ", 'inputmode="numeric" maxlength="5"')}${f("ort", "Ort", 'placeholder="z. B. Hannover-Wettbergen"')}</div>
      ${f("lieferhinweis", "Hinweis für Abholung und Lieferung", 'placeholder="z. B. Hinterhof, Hund, nachmittags erreichbar"')}
      <label class="field" for="k-kontakt">Bevorzugter Kontaktweg<select id="k-kontakt">${Object.entries(KONTAKTWEGE).map(([w, n]) => `<option value="${w}"${w === (k.kontakt || "whatsapp") ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="field" for="k-notiz">Notizen (Vorlieben, Besonderheiten)<textarea id="k-notiz" rows="2">${esc(k.notiz || "")}</textarea></label>
      <fieldset class="teilwahl"><legend>Einwilligungen (bitte mit dem Kunden besprechen)</legend>
        <label class="check"><input type="checkbox" id="k-ein-kontakt"${ein.kontakt ? " checked" : ""}> Darf über Aufträge per WhatsApp, SMS oder E-Mail informiert werden (Abholschein, „abholbereit“, Rückfragen)</label>
        <label class="check"><input type="checkbox" id="k-ein-werbung"${ein.werbung ? " checked" : ""}> Möchte Angebote und Neuigkeiten erhalten (Werbung)</label>
        ${ein.am ? `<span class="mini">Zuletzt geändert ${esc(ein.am)} von ${esc(ein.von || "?")}</span>` : ""}</fieldset>
      <p class="pay-warn" id="k-fehler" hidden></p>
      <div class="chips"><button class="btn" id="k-speichern" type="button">${alt ? "Speichern" : "In die Kartei aufnehmen"}</button><button class="btn ghost" id="k-abbruch" type="button">Abbrechen</button></div></form>`;
    dlg.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.id === "k-abbruch") { dlg.close(); return; }
      if (e.target.id !== "k-speichern") return;
      const g = (x) => dlg.querySelector("#k-" + x).value.trim();
      const neu = { ...k, anrede: g("anrede"), firma: g("firma"), vorname: g("vorname"), nachname: g("nachname"), tel: g("tel") || "–", tel2: g("tel2"), mail: g("mail"),
        strasse: g("strasse"), lage: g("lage"), plz: g("plz"), ort: g("ort"), lieferhinweis: g("lieferhinweis"), kontakt: g("kontakt"), notiz: dlg.querySelector("#k-notiz").value.trim(), karte: true };
      const fehler = !kundenName(neu) ? "Bitte Name oder Firma eintragen." : neu.mail && !mailOk(neu.mail) ? "Die E-Mail-Adresse sieht nicht richtig aus." : neu.plz && !/^\d{5}$/.test(neu.plz) ? "Die PLZ hat 5 Ziffern." : "";
      if (fehler) { const p = dlg.querySelector("#k-fehler"); p.textContent = fehler; p.hidden = false; return; }
      const ek = dlg.querySelector("#k-ein-kontakt").checked, ew = dlg.querySelector("#k-ein-werbung").checked;
      if (ek !== !!ein.kontakt || ew !== !!ein.werbung) neu.einwilligung = { kontakt: ek, werbung: ew, am: jetztText(), von: wer() };
      neu.name = kundenName(neu);
      if (alt) { Object.assign(alt, neu); change(alt); toast("Karteikarte gespeichert"); if (danach) danach(alt); }
      else {
        try { neu.id = "K" + naechsteNummer("kunde"); } catch (err) { toast(err.message); return; }
        neu.store = ui.store; neu.seit = iso(today0()); db.customers.push(neu); change(neu); toast(`${neu.name} in die Kartei aufgenommen`); if (danach) danach(neu);
      }
      dlg.close();
    });
    dlg.addEventListener("close", () => { dlg.remove(); render(); });
    dlg.showModal();
  }

  // ---------------------------------------------------------------- Abholschein verschicken: WhatsApp, SMS oder E-Mail
  // Kontakt kommt aus der Kartei; Laufkunden geben ihn nur für diesen Auftrag an (o.scheinKontakt)
  function kontaktFuer(o) {
    const c = cust(o.cust); const s = o.scheinKontakt || {};
    const tel = (c.id !== "LAUF" && telDa(c.tel) ? c.tel : "") || s.tel || "";
    return { tel, nr: handyNr(tel), mail: (c.id !== "LAUF" && c.mail) || s.mail || "", weg: c.kontakt || s.weg || "", nurAuftrag: !!(s.tel || s.mail) && !(c.id !== "LAUF" && (telDa(c.tel) || c.mail)) };
  }
  function versandKnoepfe(o, text, betreff, klein) {
    const k = kontaktFuer(o); const b = [];
    const cls = (w) => `btn small${w === (k.weg || "whatsapp") ? "" : " ghost"}${w === "whatsapp" ? " wa-btn" : ""}`;
    if (k.nr) b.push(["whatsapp", `<a class="${cls("whatsapp")}" href="https://wa.me/${k.nr}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${klein || "Per"} WhatsApp</a>`]);
    if (k.nr) b.push(["sms", `<a class="${cls("sms")}" href="sms:+${k.nr}&body=${encodeURIComponent(text)}">${klein || "Per"} SMS</a>`]);
    if (mailOk(k.mail)) b.push(["mail", `<a class="${cls("mail")}" href="mailto:${encodeURIComponent(k.mail)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}">${klein || "Per"} E-Mail</a>`]);
    // bevorzugten Weg zuerst
    return b.sort((x, y) => (y[0] === k.weg) - (x[0] === k.weg)).map((x) => x[1]).join("");
  }
  function digitalBox(o) {
    if (o.status === "storniert") return "";
    const c = cust(o.cust); const k = kontaktFuer(o);
    const bereitText = `Guten Tag${vorname(c) ? " " + vorname(c) : ""}, Ihr Auftrag ${zahl(o.nr)} bei Tayfun Textilpflege ist abholbereit. Summe ${euro(total(o))}${o.paid ? " (bereits bezahlt)" : ""}. Wir freuen uns auf Sie! An der Kirche 10, Mo, Di, Do, Fr 8-13 + 15-18 Uhr, Mi + Sa 8-13 Uhr.`;
    const knoepfe = versandKnoepfe(o, scheinText(o), `Ihr Abholschein ${zahl(o.nr)} – Tayfun Textilpflege`);
    const ohne = !k.nr && !mailOk(k.mail);
    const nurFuerSchein = ohne || ui.scheinKontakt === o.nr ? `<div class="row2"><label class="field" for="sk-tel">Handynummer (WhatsApp oder SMS)<input id="sk-tel" type="tel" inputmode="tel" value="${esc((o.scheinKontakt || {}).tel || "")}" autocomplete="off"></label>
        <label class="field" for="sk-mail">oder E-Mail<input id="sk-mail" type="email" inputmode="email" value="${esc((o.scheinKontakt || {}).mail || "")}" autocomplete="off"></label></div>
        <div class="chips"><button class="btn small" data-skok type="button">Für diesen Abholschein übernehmen</button></div>
        <span class="mini">Wird nur bei diesem Auftrag gespeichert, nicht in der Kundenkartei.</span>` : "";
    return `<div class="digi"><b>Abholschein aufs Handy</b>
      ${knoepfe ? `<div class="chips">${knoepfe}</div><span class="mini">An ${esc([k.nr ? k.tel : "", k.mail].filter(Boolean).join(" · "))}${k.nurAuftrag ? " (nur für diesen Auftrag)" : ""}${c.kontakt ? ` · bevorzugt: ${KONTAKTWEGE[c.kontakt]}` : ""}. Die Nachricht ist fertig, nur noch auf Senden tippen.${k.nr ? " SMS vom iPad geht nur, wenn ein iPhone mit SMS-Weiterleitung verbunden ist." : ""}</span>` : ""}
      ${nurFuerSchein}
      ${!ohne && ui.scheinKontakt !== o.nr && c.id === "LAUF" ? `<div><button class="btn ghost small" data-skandern type="button">Kontakt für diesen Schein ändern</button></div>` : ""}
      <div class="chips"><button class="btn small" data-zeigen type="button">Code für Kunden zeigen</button><button class="btn ghost small" data-teilen type="button">Als Bild teilen</button></div>
      ${o.status === "bereit" && !ohne ? `<div class="chips"><span class="mini">„Abholbereit“ melden:</span>${versandKnoepfe(o, bereitText, `Ihr Auftrag ${zahl(o.nr)} ist abholbereit`, " ")}</div>` : ""}</div>`;
  }

  // ---------------------------------------------------------------- Kundensuche, verzeiht Tippfehler und Sonderzeichen
  const norm = (s) => s.toLowerCase().replace(/ı/g, "i").replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").replace(/ph/g, "f").replace(/(.)\1/g, "$1").replace(/[^a-z0-9 ]/g, "");
  function dist(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  function findCustomers(q) {
    const digits = q.replace(/\D/g, ""); const nq = norm(q); const out = [];
    db.customers.forEach((c) => {
      if (digits.length >= 3 && [c.tel, c.tel2].join(" ").replace(/\D/g, "").includes(digits)) return out.push({ c, score: 0 });
      if (q.includes("@") && (c.mail || "").toLowerCase().includes(q.trim().toLowerCase())) return out.push({ c, score: 0 });
      if (!nq) return;
      const words = norm(c.name).split(" ").filter(Boolean); const full = words.join(" ");
      if (full.includes(nq)) return out.push({ c, score: words.some((w) => w.startsWith(nq)) ? 0 : 1 });
      if (nq.length >= 3) {
        const tol = nq.length >= 6 ? 2 : 1;
        const best = Math.min(...words.map((w) => Math.min(dist(nq, w), dist(nq, w.slice(0, nq.length)))));
        if (best <= tol) out.push({ c, score: 2 + best, fuzzy: true });
      }
    });
    return out.sort((a, b) => a.score - b.score || a.c.name.localeCompare(b.c.name, "de")).slice(0, 8);
  }

  // ---------------------------------------------------------------- Ansichten
  const VIEWS = {
    werkstatt: () => werkstattAnsicht(),
    kundendienst: () => kundendienstAnsicht(),
    heute() {
      const t = iso(today0()); const os = db.orders.filter(inStore);
      const neu = os.filter((o) => o.date === t);
      const faellig = os.filter((o) => o.status === "arbeit" && o.due <= t);
      const bereit = os.filter((o) => o.status === "bereit").sort((a, b) => a.due.localeCompare(b.due));
      const alt = bereit.filter((o) => daysSince(o.due) > 14);
      return `<div class="pickbox"><b>Abholung: Abholschein scannen</b>
          <label class="field" for="pick">QR-Code vom Papier oder vom Handy des Kunden scannen, oder Abholcode eintippen und Enter<input id="pick" placeholder="z. B. W-2401-K7P3" autocomplete="off" autocapitalize="characters"></label></div>
        <div class="kpis">
        <div class="kpi"><b class="num">${neu.length}</b><small>Annahmen heute</small></div>
        <div class="kpi"><b class="num">${euro(neu.reduce((s, o) => s + total(o), 0))}</b><small>Auftragswert heute</small></div>
        <div class="kpi"><b class="num">${bereit.length}</b><small>Abholbereit</small></div>
        <div class="kpi ${alt.length ? "alert" : ""}"><b class="num">${alt.length}</b><small>Länger als 14 Tage nicht abgeholt</small></div></div>
        <div><button class="btn" data-nav="annahme" type="button">+ Neue Annahme</button></div>
        <div class="grid2">
          <div class="panel"><h2>Heute fertig werden</h2>${list(faellig, "Nichts fällig – alles im Plan.")}</div>
          <div class="panel"><h2>Wartet auf Abholung</h2>${list(bereit.slice(0, 8), "Keine Aufträge abholbereit.")}</div>
          ${(() => { const kt = tickets().filter((x) => inStore(x) && tOffen(x)).sort((a, b) => Number(tFaellig(b) || tUeberfaellig(b)) - Number(tFaellig(a) || tUeberfaellig(a)) || a.erstellt.localeCompare(b.erstellt)); return kt.length ? `<div class="panel"><h2>Kundendienst</h2>${tList(kt.slice(0, 6), "")}${kt.length > 6 ? `<p class="mini">${kt.length - 6} weitere unter Kundendienst.</p>` : ""}</div>` : ""; })()}
        </div>${ui.openOrder ? orderDetail(db.orders.find((o) => o.nr === ui.openOrder)) : ""}`;
    },

    annahme() {
      const d = ui.draft; const wd = D(d.date).getDay();
      const c = d.cust && cust(d.cust);
      const q = d.custQ.trim();
      const hits = q && !c ? findCustomers(q) : [];
      const last = (id) => db.orders.filter((o) => o.cust === id).map((o) => o.date).sort().pop();
      const item = (h, ae) => `<button data-cust="${h.id}" type="button"><span>${esc(h.name)}</span>${ae ? `<span class="aehnlich">ähnlich</span>` : ""}<small class="num">${h.tel}${last(h.id) ? " · zuletzt " + fmtDate(last(h.id)) : ""}</small></button>`;
      const recent = !q && !c && ui.showList ? [...db.customers].sort((a, b) => (last(b.id) || "").localeCompare(last(a.id) || "")).slice(0, 5) : [];
      let listHtml = "";
      if (!q && !c && ui.showList) {
        const alle = [...db.customers].sort((a, b) => a.name.localeCompare(b.name, "de"));
        let cur = ""; const parts = [`<div class="gr">Zuletzt da</div>`, ...recent.map((h) => item(h))];
        alle.forEach((h) => { const L = h.name[0].toUpperCase(); if (L !== cur) { cur = L; parts.push(`<div class="gr">${L}</div>`); } parts.push(item(h)); });
        listHtml = `<div class="suggest lang">${parts.join("")}</div>`;
      }
      const tiles = ITEMS.filter((i) => i.cat === ui.cat).map((i) => {
        const [p, why] = unitPrice(i.id, wd, d.lines.concat(i.id === "hemd" ? [{ id: "hemd", qty: 99 }] : []));
        const offer = i.frei ? `<span>Preis bei Annahme · Partnerbetrieb</span>` : why && !(i.id === "hemd") ? `<span class="offer num">${euro(p)} · ${why}</span>` : `<span class="num">${euro(i.price)}${i.unit !== "Stk" ? " / " + i.unit : ""}</span>`;
        return `<button class="item" data-add="${i.id}" type="button"><b>${esc(i.name)}</b>${offer}</button>`;
      }).join("");
      const sum = d.lines.reduce((s, l) => s + l.qty * linePrice(l, wd, d.lines)[0], 0);
      const lines = d.lines.map((l, k) => { const [p, why] = linePrice(l, wd, d.lines); return `<div class="line"><span class="qty"><button data-dec="${k}" type="button" aria-label="weniger">−</button><span class="num">${l.qty}</span><button data-inc="${k}" type="button" aria-label="mehr">+</button></span><span class="n">${esc(ITEM[l.id].name)}${why ? `<small>${why}</small>` : ""}</span><b class="num">${euro(p * l.qty)}</b>${ITEM[l.id].frei ? `<span class="frei"><input id="lt-${k}" data-ltext="${k}" value="${esc(l.text || "")}" placeholder="Was genau? z. B. Absätze erneuern" autocomplete="off"><input id="lp-${k}" data-lpreis="${k}" class="num" inputmode="decimal" value="${l.preis ? (l.preis / 100).toFixed(2).replace(".", ",") : ""}" placeholder="Preis je Stück €" autocomplete="off"></span>` : ""}</div>`; }).join("");
      const ohnePreis = d.lines.some((l) => ITEM[l.id].frei && !l.preis);
      const tag = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][wd];
      return `<div class="annahme">
        <div class="panel"><div class="chips cats">${CATS.map((k) => `<button class="chip" data-cat="${k}" aria-pressed="${k === ui.cat}" type="button">${k}</button>`).join("")}</div>
          <div class="items">${tiles}</div>
          <p class="hint" style="margin-top:12px">Angebote rechnet die App selbst: dienstags Hose 8,95 € und ab 10 Hemden je 2,49 €, freitags Anzug 19,90 €.</p></div>
        <div class="panel bon">
          ${c ? `<div class="field">Kunde<div class="chips"><span class="chip" aria-pressed="true">${esc(c.name)}</span><button class="btn ghost small" data-uncust type="button">Ändern</button></div></div>`
              : `<label class="field" for="cust-q">Kunde (Name oder Telefon)<input id="cust-q" value="${esc(d.custQ)}" autocomplete="off" placeholder="Name, Teil vom Namen oder Telefon"></label>
                 <div class="cust-tools"><button class="btn ghost small" data-cust="LAUF" type="button">Ohne Namen (Laufkunde)</button><button class="btn ghost small" data-togglelist type="button">${ui.showList ? "Kundenliste schließen" : "Aus Kundenliste wählen"}</button><span class="hint">Tippfehler sind kein Problem, ähnliche Namen werden gefunden.</span></div>
                 ${listHtml}
                 ${hits.length ? `<div class="suggest lang">${hits.map((h) => item(h.c, h.fuzzy)).join("")}</div>` : ""}
                 ${q && !hits.length ? `<div class="cust-tools"><label class="field" for="new-tel" style="flex:1">Handy oder E-Mail (freiwillig)<input id="new-tel" inputmode="email" placeholder="z. B. 0170 1234567 oder name@mail.de" autocomplete="off"></label><button class="btn ghost small" data-newcust type="button">„${esc(d.custQ)}“ schnell anlegen</button><button class="btn small" data-kneuannahme type="button">Als Stammkunde mit Karteikarte</button></div>` : ""}`}
          <div class="grid2" style="gap:10px;grid-template-columns:1fr 1fr">
            <label class="field" for="d-date">Annahmetag (${tag})<input type="date" id="d-date" value="${d.date}"></label>
            <label class="field" for="d-due">Abholbar ab<input type="date" id="d-due" value="${d.due}"></label></div>
          <div class="lines">${lines || `<p class="empty">Teile links antippen.</p>`}</div>
          <div class="total"><span>Summe</span><span class="num">${euro(sum)}</span></div>
          <button class="btn" data-save type="button" ${c && d.lines.length ? "" : "disabled"}>Auftrag speichern</button>${ohnePreis ? `<span class="pay-warn">Bei Schuh- und Schlüsseldienst bitte den Preis eintragen.</span>` : ""}
          <p class="hint">${c ? "" : "Erst Kunde wählen. "}Gespeichert wird sofort auf dem Tablet – auch ohne Internet.</p>
        </div></div>`;
    },

    auftraege() {
      const f = ui.filter; const t = iso(today0());
      let os = db.orders.filter(inStore);
      const offen = (o) => o.status !== "abgeholt" && o.status !== "storniert";
      const passt = (o, k) => k === "alle" ? true : k === "offen" ? offen(o) : k === "nichtbereit" ? o.status === "arbeit" || o.status === "kundendienst" : o.status === k;
      const aq = norm(ui.aq || "");
      if (aq) os = os.filter((o) => norm(o.nr).includes(aq) || norm(cust(o.cust).name).includes(aq));
      const alle = os;
      os = os.filter((o) => passt(o, f));
      os.sort((a, b) => b.date.localeCompare(a.date) || b.nr.localeCompare(a.nr));
      const F = [["offen", "Offen"], ["arbeit", "In Arbeit"], ["nichtbereit", "Nicht abholbereit"], ["bereit", "Abholbereit"], ["kundendienst", "Kundendienst"], ["abgeholt", "Abgeholt"], ["storniert", "Storniert"], ["alle", "Alle"]];
      return `<label for="aq" class="field">Auftrag suchen<input class="search" id="aq" value="${esc(ui.aq || "")}" placeholder="Auftragsnummer oder Kundenname" autocomplete="off"></label>
        <div class="chips">${F.map(([k, n]) => `<button class="chip" data-filter="${k}" aria-pressed="${k === f}" type="button">${n}<span class="cnt">${alle.filter((o) => passt(o, k)).length}</span></button>`).join("")}</div>
        ${ui.openOrder ? orderDetail(db.orders.find((o) => o.nr === ui.openOrder)) : ""}
        <div class="panel">${list(os.slice(0, 60), "Keine Aufträge in dieser Auswahl.")}</div>`;
    },

    kunden() {
      const q = ui.q.trim().toLowerCase(); const nq = norm(ui.q.trim());
      const stats = db.customers.map((c) => { const os = db.orders.filter((o) => o.cust === c.id && inStore(o) && zaehlt(o)); return { c, n: os.length, sum: os.reduce((s, o) => s + total(o), 0), last: os.map((o) => o.date).sort().pop() }; })
        .filter((x) => !q || norm(x.c.name).includes(nq) || [x.c.tel, x.c.tel2].join(" ").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "#") || (x.c.mail || "").toLowerCase().includes(q) || norm(anschrift(x.c)).includes(nq))
        .sort((a, b) => b.sum - a.sum || a.c.name.localeCompare(b.c.name, "de"));
      const open = ui.openCust && stats.find((x) => x.c.id === ui.openCust);
      const stamm = (x) => x.c.karte || x.n >= 5;
      const karte = (c) => { const ein = c.einwilligung || {};
        return `<dl>${c.firma ? `<dt>Firma</dt><dd>${esc(c.firma)}</dd>` : ""}<dt>Name</dt><dd>${esc([c.anrede, c.vorname, c.nachname].filter(Boolean).join(" ") || c.name)}</dd>
          <dt>Handy</dt><dd class="num">${telDa(c.tel) ? esc(c.tel) : "–"}</dd>${c.tel2 ? `<dt>Festnetz</dt><dd class="num">${esc(c.tel2)}</dd>` : ""}<dt>E-Mail</dt><dd>${c.mail ? esc(c.mail) : "–"}</dd>
          <dt>Anschrift</dt><dd>${anschrift(c) ? esc(anschrift(c)) : "–"}</dd>${c.lieferhinweis ? `<dt>Lieferhinweis</dt><dd>${esc(c.lieferhinweis)}</dd>` : ""}
          <dt>Kontaktweg</dt><dd>${KONTAKTWEGE[c.kontakt] || "–"}</dd>
          <dt>Einwilligung</dt><dd>${ein.kontakt ? "Nachrichten zu Aufträgen: ja" : "Nachrichten zu Aufträgen: nicht erfasst"} · ${ein.werbung ? "Werbung: ja" : "Werbung: nein"}${ein.am ? ` <span class="mini">(${esc(ein.am)}, ${esc(ein.von || "")})</span>` : ""}</dd>
          ${c.notiz ? `<dt>Notizen</dt><dd>${esc(c.notiz)}</dd>` : ""}<dt>Kundennummer</dt><dd>${c.id}${c.seit ? ` · seit ${fmtDate(c.seit)}` : ""}</dd></dl>`; };
      return `<div class="chips"><button class="btn" data-kneu type="button">+ Neuer Stammkunde</button></div>
        <label for="kq" class="field">Suchen<input class="search" id="kq" value="${esc(ui.q)}" placeholder="Name, Telefon, E-Mail oder Straße" autocomplete="off"></label>
        ${open ? `<div class="panel detail"><h2>${esc(open.c.name)} ${stamm(open) ? `<span class="pill p-stamm">Stammkunde</span>` : ""}</h2>${karte(open.c)}
          <dl><dt>Aufträge</dt><dd>${open.n}</dd><dt>Umsatz</dt><dd class="num">${euro(open.sum)}</dd></dl>
          <div class="chips">${werkstattZugang() ? "" : `<button class="btn small" data-kedit="${open.c.id}" type="button">${open.c.karte ? "Karteikarte bearbeiten" : "Zur Karteikarte erweitern"}</button>`}<button class="btn ghost" data-closecust type="button">Schließen</button></div>
          ${list(db.orders.filter((o) => o.cust === open.c.id && inStore(o)).sort((a, b) => b.date.localeCompare(a.date)), "Noch keine Aufträge.")}</div>` : ""}
        <div class="panel"><div class="list">${stats.map((x) => `<button class="row" data-custopen="${x.c.id}" type="button"><span class="t">${esc(x.c.name)} ${stamm(x) ? `<span class="pill p-stamm">Stammkunde</span>` : ""}</span><span class="s num">${x.n ? `${x.n} Aufträge · zuletzt ${fmtDate(x.last)}` : "noch keine Aufträge"}${anschrift(x.c) ? " · " + esc(anschrift(x.c)) : ""}</span><span class="r"><b class="num">${euro(x.sum)}</b></span></button>`).join("") || `<p class="empty">Kein Kunde gefunden.</p>`}</div></div>`;
    },

    teile() {
      const items = allItems().filter(({ o }) => inStore(o));
      const tq = norm(ui.tq || "");
      const flt = ui.tfilter || "imhaus";
      const passt = ({ it }, k) => k === "alle" ? true : k === "imhaus" ? !["ausgegeben", "storniert"].includes(it.st) : it.st === k;
      let rows = items;
      if (tq) rows = rows.filter(({ it, o }) => norm(it.tnr).includes(tq) || norm(o.nr).includes(tq) || norm(cust(o.cust).name).includes(tq) || norm(teilName(it)).includes(tq));
      const basis = rows; rows = rows.filter((r) => passt(r, flt));
      rows.sort((a, b) => b.it.tnr.localeCompare(a.it.tnr));
      const F = [["imhaus", "Im Haus"], ...STATIONEN.filter(([k]) => k !== "storniert"), ["alle", "Alle"]];
      const ziel = ui.scanZiel || "reinigung";
      const offenTeil = ui.openTeil && allItems().find(({ it }) => it.tnr === ui.openTeil);
      const detail = offenTeil ? (() => { const { it, o } = offenTeil;
        return `<div class="panel detail"><h2>Teil ${it.tnr}</h2>
          <dl><dt>Artikel</dt><dd>${esc(teilName(it))}</dd><dt>Auftrag</dt><dd><button class="btn ghost small" data-order="${o.nr}" data-goauftrag type="button">${o.nr}</button></dd>
          <dt>Kunde</dt><dd>${esc(cust(o.cust).name)}</dd><dt>Station</dt><dd>${stPill(it.st)}${it.platz ? " · " + esc(it.platz) : ""}</dd>
          <dt>Mängel</dt><dd>${maengelVon(it).map((m) => esc(m.art)).join(", ") || "keine erfasst"} <button class="btn small ghost" data-maengel="${it.tnr}" type="button">Mängel ansehen / erfassen</button></dd></dl>
          <h3 style="margin:6px 0 0;font-size:16px">Verlauf</h3><ol class="scanlog">${it.log.map((l) => `<li>${fmtDate(l.am)} · ${ST[l.st]}${l.platz && l.st === "fertig" ? " (" + esc(l.platz) + ")" : ""}</li>`).join("")}</ol>
          <div class="chips">${STATIONEN.filter(([k]) => !["storniert", "ausgegeben"].includes(k)).map(([k, n]) => `<button class="chip" data-tset="${k}" aria-pressed="${k === it.st}" type="button">${n}</button>`).join("")}</div>
          <div><button class="btn ghost small" data-tclose type="button">Schließen</button></div></div>`; })() : "";
      return `<div class="scanbox">
          <b>Teile scannen</b>
          <div class="chips">${STATIONEN.filter(([k]) => !["storniert", "angenommen"].includes(k)).map(([k, n]) => `<button class="chip" data-ziel="${k}" aria-pressed="${k === ziel}" type="button">${n}</button>`).join("")}</div>
          <div class="scanrow"><label class="field" for="scan">Etikett scannen oder Teilenummer eintippen, dann Enter<input id="scan" placeholder="z. B. 1001-3" autocomplete="off" autocapitalize="characters"></label>
          ${ziel === "fertig" ? `<label class="field" for="scan-platz">Platz im Regal<input id="scan-platz" value="${esc(ui.scanPlatz || "Stange 1")}" autocomplete="off"></label>` : `<span></span>`}</div>
          <span class="mini">Gescannte Teile wandern nach „${ST[ziel]}“. Sind alle Teile eines Auftrags fertig, wird der Auftrag automatisch abholbereit.</span>
          ${(ui.scans || []).length ? `<div class="scanlog">${ui.scans.slice(0, 6).map((s) => `<span class="${s.ok ? "ok" : "err"}">${s.ok ? "✓" : "✗"} ${esc(s.text)}</span>`).join("")}</div>` : ""}
        </div>
        ${detail}
        <label for="tq" class="field">Teil suchen<input class="search" id="tq" value="${esc(ui.tq || "")}" placeholder="Teilenummer, Auftrag, Kunde oder Artikel" autocomplete="off"></label>
        <div class="chips">${F.map(([k, n]) => `<button class="chip" data-tfilter="${k}" aria-pressed="${k === flt}" type="button">${n}<span class="cnt">${basis.filter((r) => passt(r, k)).length}</span></button>`).join("")}</div>
        <div class="panel"><div class="scroll"><table class="tbl"><thead><tr><th class="l">Teil-Nr.</th><th class="l">Artikel</th><th class="l">Auftrag</th><th class="l">Kunde</th><th>Station</th><th>Platz</th><th>seit</th></tr></thead><tbody>
        ${rows.slice(0, 80).map(({ it, o }) => `<tr class="click" data-teil="${it.tnr}"><td class="l num"><b>${it.tnr}</b></td><td class="l">${esc(teilName(it))}</td><td class="l num">${o.nr}</td><td class="l">${esc(cust(o.cust).name)}</td><td>${stPill(it.st)}</td><td>${esc(it.platz || "")}</td><td class="num">${fmtDate(it.log[it.log.length - 1].am)}</td></tr>`).join("") || `<tr><td class="l" colspan="7">Keine Teile in dieser Auswahl.</td></tr>`}
        </tbody></table></div>${rows.length > 80 ? `<p class="mini">${rows.length - 80} weitere – bitte Suche oder Filter nutzen.</p>` : ""}</div>`;
    },

    kasse() {
      const heute = iso(today0());
      const os = db.orders.filter(inStore);
      const bez = os.filter((o) => o.paid);
      const tag = (d) => bez.filter((o) => o.paid.am === d);
      const sum = (arr, art) => arr.filter((o) => !art || o.paid.art === art).reduce((s, o) => s + total(o), 0);
      const h = tag(heute);
      const offen = os.filter((o) => !o.paid && (o.status === "bereit" || o.status === "abgeholt"));
      const tage = [...Array(7)].map((_, i) => iso(new Date(today0().getTime() - i * DAY)));
      return `<div class="kpis">
          <div class="kpi"><b class="num">${euro(sum(h))}</b><small>Kassiert heute</small></div>
          <div class="kpi"><b class="num">${euro(sum(h, "Karte"))}</b><small>davon Karte</small></div>
          <div class="kpi"><b class="num">${euro(sum(h, "Bar"))}</b><small>davon Bar</small></div>
          <div class="kpi ${offen.length ? "alert" : ""}"><b class="num">${euro(offen.reduce((s, o) => s + total(o), 0))}</b><small>Noch zu kassieren (${offen.length} Aufträge)</small></div></div>
        <div class="grid2">
          <div class="panel"><h2>Zahlungen heute</h2>${h.length ? `<div class="scroll"><table class="tbl"><thead><tr><th class="l">Beleg</th><th class="l">Auftrag</th><th class="l">Kunde</th><th>Art</th><th>Betrag</th></tr></thead><tbody>${h.map((o) => `<tr class="click" data-order="${o.nr}" data-goauftrag><td class="l num">${esc(o.paid.beleg)}</td><td class="l num">${o.nr}</td><td class="l">${esc(cust(o.cust).name)}</td><td>${o.paid.art}</td><td class="num">${euro(total(o))}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty">Heute noch keine Zahlung vermerkt.</p>`}</div>
          <div class="panel"><h2>Noch zu kassieren</h2>${list(offen.slice(0, 10), "Alles bezahlt.")}</div>
        </div>
        <div class="panel"><h2>Letzte 7 Tage</h2><div class="scroll"><table class="tbl"><thead><tr><th class="l">Tag</th><th>Zahlungen</th><th>Karte</th><th>Bar</th><th>Gesamt</th></tr></thead><tbody>
          ${tage.map((d) => { const a = tag(d); return `<tr><td class="l">${fmtDate(d)}</td><td>${a.length}</td><td>${euro(sum(a, "Karte"))}</td><td>${euro(sum(a, "Bar"))}</td><td><b>${euro(sum(a))}</b></td></tr>`; }).join("")}</tbody></table></div>
          <p class="hint" style="margin-top:10px">Abgleich: Diese Summen am Tagesende mit dem Tagesabschluss (Z-Bon) der Kasse vergleichen. Kassiert und gebucht wird ausschließlich in der zertifizierten Kasse.</p></div>`;
    },

    management() {
      if (!ui.mgmt) return `<div class="panel lock"><h2>Bereich Geschäftsleitung</h2><p class="mini">Umsatz und Kennzahlen sind nur für die Geschäftsleitung sichtbar.</p>
        <label class="field" for="pin">PIN eingeben<input id="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></label>
        <button class="btn" data-unlock type="button">Entsperren</button><p class="mini">Die PIN wurde bei der Einrichtung festgelegt. Nach einer Stunde sperrt sich der Bereich wieder.</p></div>`;
      const os = db.orders.filter(inStore).filter(zaehlt);
      const bez = os.filter((o) => o.paid);
      const im = (n) => bez.filter((o) => daysSince(o.paid.am) < n).reduce((s, o) => s + total(o), 0);
      const kat = {}; os.filter((o) => daysSince(o.date) < 30).forEach((o) => { const wd = D(o.date).getDay(); o.lines.forEach((l) => { const c = ITEM[l.id].cat; kat[c] = (kat[c] || 0) + l.qty * linePrice(l, wd, o.lines)[0]; }); });
      const katS = Object.entries(kat).sort((a, b) => b[1] - a[1]); const kmax = katS.length ? katS[0][1] : 1;
      const alle = db.orders.filter(inStore);
      const storno = alle.length ? Math.round(alle.filter((o) => o.status === "storniert").length / alle.length * 100) : 0;
      const kd = tickets().filter((x) => inStore(x) && tOffen(x)).length;
      const lieg = alle.filter((o) => o.status === "abgeholt" && o.picked).map((o) => Math.max(0, (D(o.picked) - D(o.due)) / DAY));
      const liegAvg = lieg.length ? (lieg.reduce((a, b) => a + b, 0) / lieg.length).toFixed(1).replace(".", ",") : "–";
      const offenF = alle.filter((o) => !o.paid && (o.status === "bereit" || o.status === "abgeholt")).reduce((s, o) => s + total(o), 0);
      const top = db.customers.map((c) => ({ c, s: bez.filter((o) => o.cust === c.id).reduce((s, o) => s + total(o), 0) })).filter((x) => x.s).sort((a, b) => b.s - a.s).slice(0, 5);
      const lauf = bez.filter((o) => o.cust === "LAUF").reduce((s, o) => s + total(o), 0);
      return `<div class="chips" style="justify-content:space-between"><span class="mini">Geschäftsleitung · ${ui.store === "ALL" ? "alle Geschäfte" : esc(geschaeft(ui.store))}</span><button class="btn ghost small" data-lock type="button">Bereich sperren</button></div>
        <div class="kpis">
          <div class="kpi"><b class="num">${euro(im(7))}</b><small>Umsatz 7 Tage (bezahlt)</small></div>
          <div class="kpi"><b class="num">${euro(im(30))}</b><small>Umsatz 30 Tage (bezahlt)</small></div>
          <div class="kpi ${offenF ? "alert" : ""}"><b class="num">${euro(offenF)}</b><small>Offene Beträge</small></div>
          <div class="kpi"><b class="num">${storno} %</b><small>Stornoquote</small></div>
          <div class="kpi"><b class="num">${kd}</b><small>Offene Reklamationen</small></div>
          <div class="kpi"><b class="num">${liegAvg}</b><small>Ø Tage bis Abholung</small></div></div>
        <div class="grid2">
          <div class="panel"><h2>Auftragswert nach Bereich (30 Tage)</h2>${katS.map(([k, v]) => `<div class="hbar"><span>${k}</span><span class="track"><i style="width:${Math.round(v / kmax * 100)}%"></i></span><b class="num">${euro(v)}</b></div>`).join("")}</div>
          <div class="panel"><h2>Stärkste Kunden (bezahlt)</h2><div class="list">${top.map((x) => `<div class="row"><span class="t">${esc(x.c.name)}</span><span class="r"><b class="num">${euro(x.s)}</b></span></div>`).join("")}<div class="row"><span class="t mini">Laufkunden ohne Namen</span><span class="r"><b class="num">${euro(lauf)}</b></span></div></div></div>
        </div>
        ${VIEWS.auswertung()}
        ${kdAuswertung()}
        ${einstellungen()}`;
    },

    auswertung() {
      const t0 = today0(); const os = db.orders.filter(inStore).filter(zaehlt);
      const days = [...Array(7)].map((_, i) => iso(new Date(t0.getTime() - (6 - i) * DAY)));
      const per = days.map((d) => os.filter((o) => o.date === d).reduce((s, o) => s + total(o), 0));
      const max = Math.max(...per, 1);
      const week = per.reduce((a, b) => a + b, 0);
      const prev = os.filter((o) => daysSince(o.date) >= 7 && daysSince(o.date) < 14).reduce((s, o) => s + total(o), 0);
      const diff = prev ? Math.round((week - prev) / prev * 100) : 0;
      const cnt = {}; os.filter((o) => daysSince(o.date) < 14).forEach((o) => o.lines.forEach((l) => (cnt[l.id] = (cnt[l.id] || 0) + (ITEM[l.id].unit === "Stk" ? l.qty : 1))));
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6); const tmax = top.length ? top[0][1] : 1;
      const avg = os.length ? os.reduce((s, o) => s + total(o), 0) / os.length : 0;
      const storeRows = Object.keys(STORES).map((k) => { const so = db.orders.filter((o) => o.store === k && zaehlt(o) && daysSince(o.date) < 7); return `<tr><td>${esc(STORES[k])}</td><td>${so.length}</td><td>${euro(so.reduce((s, o) => s + total(o), 0))}</td><td>${db.orders.filter((o) => o.store === k && o.status === "bereit").length}</td></tr>`; }).join("");
      return `<div class="kpis">
          <div class="kpi"><b class="num">${euro(week)}</b><small>Auftragswert, letzte 7 Tage</small></div>
          <div class="kpi"><b class="num">${diff >= 0 ? "+" : ""}${diff} %</b><small>gegenüber Vorwoche</small></div>
          <div class="kpi"><b class="num">${euro(avg)}</b><small>Ø pro Auftrag</small></div>
          <div class="kpi"><b class="num">${os.filter((o) => o.status !== "abgeholt").length}</b><small>Offene Aufträge</small></div></div>
        <div class="grid2">
          <div class="panel"><h2>Auftragswert pro Tag</h2>
            <div class="bars">${per.map((v, i) => `<div class="bar ${i === 6 ? "today" : ""}" title="${euro(v)}"><em class="num">${v ? Math.round(v / 100) + " €" : ""}</em><i style="height:${Math.round(v / max * 100)}%"></i></div>`).join("")}</div>
            <div class="barlabels">${days.map((d) => `<span>${D(d).toLocaleDateString("de-DE", { weekday: "short" })}</span>`).join("")}</div></div>
          <div class="panel"><h2>Meiste Teile (14 Tage)</h2>${top.map(([id, n]) => `<div class="hbar"><span>${esc(ITEM[id].name)}</span><span class="track"><i style="width:${Math.round(n / tmax * 100)}%"></i></span><b class="num">${n}</b></div>`).join("")}</div>
        </div>
        <div class="panel"><h2>Geschäfte im Vergleich (7 Tage)</h2><div class="scroll"><table class="tbl"><thead><tr><th>Geschäft</th><th>Aufträge</th><th>Auftragswert</th><th>Abholbereit</th></tr></thead><tbody>${storeRows}</tbody></table></div>
          <p class="hint" style="margin-top:10px">Auftragswert laut App. Der tatsächliche Umsatz kommt aus der Kasse.</p></div>`;
    },
  };
  const TITLES = { werkstatt: "Werkstatt", kundendienst: "Kundendienst", heute: "Heute", annahme: "Neue Annahme", auftraege: "Aufträge", teile: "Teile-Kartei", kunden: "Kunden", kasse: "Kasse", management: "Geschäftsleitung", auswertung: "Auswertung" };

  // Werkstatt-Zugang: nur der Bereich Werkstatt
  const werkstattZugang = () => meta.rolle === "werkstatt";
  function render() {
    if (werkstattZugang()) ui.view = "werkstatt";
    document.querySelectorAll("[data-nav]").forEach((b) => { if (!b.closest(".rail")) return; b.setAttribute("aria-current", b.dataset.nav === ui.view ? "page" : "false"); b.hidden = werkstattZugang() && b.dataset.nav !== "werkstatt"; });
    const gs = Object.keys(STORES); if (!gs.includes(ui.store) && ui.store !== "ALL") ui.store = gs[0];
    const st = document.getElementById("stores"); st.hidden = gs.length < 2;
    st.innerHTML = gs.map((g) => `<button data-store="${g}" type="button" aria-pressed="${g === ui.store}">${esc(STORES[g])}</button>`).join("") + (ui.view === "annahme" ? "" : `<button data-store="ALL" type="button" aria-pressed="${ui.store === "ALL"}">Alle</button>`);
    document.getElementById("title").textContent = TITLES[ui.view] + (ui.store === "ALL" ? " · alle Geschäfte" : ui.view === "annahme" ? " · " + geschaeft(ui.store) : "");
    const focus = document.activeElement && document.activeElement.id; const pos = focus && document.activeElement.selectionStart;
    document.getElementById("view").innerHTML = VIEWS[ui.view]();
    fotosZeigen(); bedienerLeiste();
    document.querySelectorAll("[data-qr]").forEach((el) => { if (window.QRCode) new QRCode(el, { text: el.dataset.qr, width: +(el.dataset.size || 176), height: +(el.dataset.size || 176), correctLevel: QRCode.CorrectLevel.L }); else el.textContent = "QR-Code lädt nicht (offline)"; });
    document.querySelectorAll("img[data-schein]").forEach((img) => { const o = db.orders.find((x) => x.nr === img.dataset.schein); if (o && window.QRCode) img.src = scheinBild(o).toDataURL("image/png"); });
    if (focus) { const el = document.getElementById(focus); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch {} } }
    renderSync();
  }

  // ---------------------------------------------------------------- Bedienung
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button, tr[data-teil], tr[data-order]"); if (!b) return;
    const d = ui.draft, ds = b.dataset;
    if (ds.nav) { ui.view = ds.nav; ui.openOrder = ui.openCust = null; if (ui.view === "annahme" && ui.store === "ALL") ui.store = "W"; }
    else if (ds.store) { ui.store = ds.store; }
    else if (ds.filter) { ui.filter = ds.filter; }
    else if (ds.cat) { ui.cat = ds.cat; }
    else if ("save" in ds && d.lines.some((l) => ITEM[l.id].frei && !l.preis)) { toast("Bei Schuh- und Schlüsseldienst bitte den Preis eintragen"); return; }
    else if (ds.add) { const l = !ITEM[ds.add].frei && d.lines.find((x) => x.id === ds.add); if (l) l.qty++; else d.lines.push({ id: ds.add, qty: ITEM[ds.add].unit === "Stk" ? 1 : 10 });
      if (ITEM[ds.add].frei) setTimeout(() => document.getElementById(`lt-${d.lines.length - 1}`)?.focus(), 0); }
    else if (ds.inc) { d.lines[ds.inc].qty++; }
    else if (ds.dec) { const l = d.lines[ds.dec]; l.qty--; if (l.qty <= 0) d.lines.splice(ds.dec, 1); }
    else if (ds.cust) { d.cust = ds.cust; ui.showList = false; d.custQ = ""; }
    else if ("uncust" in ds) { d.cust = null; }
    else if ("togglelist" in ds) { ui.showList = !ui.showList; d.custQ = ""; }
    else if (ds.kneu !== undefined) { karteiDialog(null); return; }
    else if (ds.kedit) { karteiDialog(ds.kedit); return; }
    else if ("kneuannahme" in ds) { const kv = (document.getElementById("new-tel") || {}).value?.trim() || "";
      karteiDialog(null, { name: d.custQ.trim(), tel: kv && !kv.includes("@") ? kv : "", mail: kv.includes("@") ? kv : "" }, (k) => { ui.draft.cust = k.id; ui.draft.custQ = ""; ui.showList = false; }); return; }
    else if ("skandern" in ds) { ui.scheinKontakt = ui.openOrder; }
    else if ("skok" in ds) { const o = db.orders.find((x) => x.nr === ui.openOrder); const tel = document.getElementById("sk-tel").value.trim(), mail = document.getElementById("sk-mail").value.trim();
      if (!tel && !mail) { toast("Bitte Handynummer oder E-Mail eintragen"); return; }
      if (tel && !handyNr(tel)) { toast("Die Handynummer bitte mit Vorwahl, z. B. 0170 …"); return; }
      if (mail && !mailOk(mail)) { toast("Die E-Mail-Adresse sieht nicht richtig aus"); return; }
      o.scheinKontakt = { tel, mail, weg: tel ? "whatsapp" : "mail", am: jetztText(), von: wer() }; ui.scheinKontakt = null; change(o); toast("Kontakt für diesen Abholschein übernommen"); }
    else if ("newcust" in ds) {
      let id; try { id = "K" + naechsteNummer("kunde"); } catch (err) { toast(err.message); return; }
      const kontakt = (document.getElementById("new-tel") || {}).value?.trim() || "";
      if (kontakt.includes("@") && !mailOk(kontakt)) { toast("Die E-Mail-Adresse sieht nicht richtig aus"); return; }
      const k = { id, name: d.custQ.trim(), tel: kontakt && !kontakt.includes("@") ? kontakt : "–", mail: kontakt.includes("@") ? kontakt : "", store: ui.store, seit: iso(today0()) };
      db.customers.push(k); d.cust = id; change(k); toast("Kunde angelegt"); }
    else if ("save" in ds) {
      if (rest("auftrag:" + ui.store) < 1) { toast("Keine freien Nummern auf diesem Gerät – bitte kurz mit dem Internet verbinden."); sync(); return; }
      const nr = ui.store + "-" + naechsteNummer("auftrag:" + ui.store);
      const neu = { nr, cust: d.cust, store: ui.store, date: d.date, due: d.due, status: "arbeit", lines: d.lines.map((l) => ({ ...l })), picked: null, geraet: meta.geraet || "" };
      neu.items = makeItems(neu, d.date); neu.code = genCode(); db.orders.push(neu);
      ui.draft = newDraft(); change(neu); toast(`Sammler ${zahl(nr)} gespeichert – jetzt Warenschau je Teil`);
      ui.view = "auftraege"; ui.filter = "offen"; ui.openOrder = nr; scrollTo({ top: 0 });
    }
    else if (ds.order) { ui.openOrder = ds.order; if (ui.view !== "auftraege" && ui.view !== "heute") { ui.view = "auftraege"; ui.filter = "alle"; ui.aq = ""; } scrollTo({ top: 0, behavior: "smooth" }); }
    else if (ds.set) { const o = db.orders.find((x) => x.nr === ui.openOrder); o.status = ds.set; if (ds.set === "abgeholt") o.picked = iso(today0());
      (o.items || []).forEach((it, k) => { if (ds.set === "abgeholt" && it.st !== "ausgegeben") setItem(it, "ausgegeben"); if (ds.set === "bereit" && !["fertig", "ausgegeben"].includes(it.st)) setItem(it, "fertig", it.platz || "Stange " + (1 + k % 12)); }); change(o); toast(ds.set === "abgeholt" ? "Als abgeholt vermerkt" : "Als abholbereit vermerkt"); }
    else if ("close" in ds) { ui.openOrder = null; ui.askStorno = null; }
    else if (ds.teil) { ui.view = "teile"; ui.openTeil = ds.teil; scrollTo({ top: 0, behavior: "smooth" }); }
    else if ("tclose" in ds) { ui.openTeil = null; }
    else if (ds.tset) { const f = allItems().find(({ it }) => it.tnr === ui.openTeil); setItem(f.it, ds.tset, ds.tset === "fertig" ? (f.it.platz || ui.scanPlatz || "Stange 1") : undefined); const m = syncOrder(f.o); change(f.o); toast(`${f.it.tnr}: ${ST[ds.tset]}${m}`); }
    else if (ds.ziel) { ui.scanZiel = ds.ziel; setTimeout(() => document.getElementById("scan") && document.getElementById("scan").focus(), 0); }
    else if (ds.tfilter) { ui.tfilter = ds.tfilter; }
    else if ("unlock" in ds) { const pin = document.getElementById("pin").value; api("pin", { pin }).then(() => { ui.mgmt = true; ui.geraete = null; render(); ladeGeraete(); }).catch((err) => toast(err.status === 0 ? "Für den Leitungsbereich wird Internet gebraucht" : err.message)); return; }
    else if ("lock" in ds) { ui.mgmt = false; api("sperren", {}).catch(() => {}); }
    else if (ds.geraetweg) { api("geraet_entfernen", { id: ds.geraetweg }).then(() => { toast("Gerät abgemeldet"); ladeGeraete(); }).catch((err) => leitungFehler(err)); return; }
    else if ("pwneu" in ds) { const a = document.getElementById("pw1").value, b2 = document.getElementById("pw2").value; if (a !== b2) { toast("Die beiden Passwörter sind verschieden"); return; } api("passwort", { neu: a }).then(() => { toast("Passwort geändert. Andere Geräte müssen sich neu anmelden."); render(); ladeGeraete(); }).catch((err) => leitungFehler(err)); return; }
    else if ("pinneu" in ds) { const a = document.getElementById("pn1").value, b2 = document.getElementById("pn2").value; if (a !== b2) { toast("Die beiden PINs sind verschieden"); return; } api("pin_aendern", { neu: a }).then(() => { toast("PIN geändert"); render(); }).catch((err) => leitungFehler(err)); return; }
    else if ("sicherung" in ds) { sicherung(); return; }
    else if ("wpneu" in ds) { const a = document.getElementById("wp1").value, b2 = document.getElementById("wp2").value; if (a !== b2) { toast("Die beiden Passwörter sind verschieden"); return; } api("werkstatt_passwort", { neu: a }).then(() => { toast("Werkstatt-Zugang gespeichert"); ladeGeraete(); }).catch((err) => leitungFehler(err)); return; }
    else if ("wpaus" in ds) { api("werkstatt_passwort", { neu: "" }).then(() => { toast("Werkstatt-Zugang abgeschaltet"); ladeGeraete(); }).catch((err) => leitungFehler(err)); return; }
    else if ("abmelden" in ds) { if (ausstehend.size) { toast("Erst abgleichen: es warten noch Änderungen"); sync(); return; } abmelden(true); IDB.leeren().then(() => location.reload()); return; }
    else if (ds.treklam) { ui.view = "kundendienst"; ui.tNeu = ds.treklam; ui.tSuche = undefined; ui.openTicket = null; scrollTo({ top: 0 }); }
    else if ("tneu" in ds) { ui.tSuche = ""; ui.tNeu = null; ui.openTicket = null; setTimeout(() => document.getElementById("t-suche")?.focus(), 0); }
    else if (ds.tfuer) { ui.tNeu = ds.tfuer; ui.tSuche = undefined; }
    else if ("tabbruch" in ds) { ui.tNeu = null; ui.tSuche = undefined; }
    else if (ds.tanlegen) { ticketAnlegen(db.orders.find((x) => x.nr === ds.tanlegen)); }
    else if (ds.ticket) { ui.view = "kundendienst"; ui.openTicket = ds.ticket; ui.taArt = "nachgebessert"; ui.tNeu = null; ui.tSuche = undefined; scrollTo({ top: 0, behavior: "smooth" }); }
    else if (ds.tstatus) { const tk = tickets().find((x) => x.id === ui.openTicket); ticketStatus(tk, ds.tstatus); toast(`${tk.id}: ${T_STATUS[ds.tstatus][0]}`); }
    else if ("tvermerk" in ds) { const tk = tickets().find((x) => x.id === ui.openTicket); const text = document.getElementById("tv-text").value.trim(); const w = document.getElementById("tv-wieder").value;
      if (!text && w === (tk.wieder || "")) { toast("Bitte einen Vermerk eintragen"); return; }
      if (w !== (tk.wieder || "")) { tk.wieder = w; tLog(tk, w ? "Wiedervorlage am " + fmtDate(w) : "Wiedervorlage entfernt"); }
      const zg = maName(document.getElementById("tv-zeuge")?.value || "");
      if (text) tLog(tk, text + (zg ? " · Vier-Augen mit " + zg : "")); change(tk); toast("Vermerk gespeichert"); }
    else if ("tfertig" in ds) { ticketAbschluss(tickets().find((x) => x.id === ui.openTicket)); }
    else if ("tauf" in ds) { const tk = tickets().find((x) => x.id === ui.openTicket); tk.status = "pruefung"; tk.ergebnis = null; tLog(tk, "Wieder geöffnet"); change(tk); }
    else if ("tclose2" in ds) { ui.openTicket = null; }
    else if (ds.maengel) { maengelDialog(ds.maengel, ds.zeit); return; }
    else if (ds.anfrage) { anfrageDialog(ds.anfrage); return; }
    else if (ds.afja || ds.afnein) { antwortKlick(b); return; }
    else if ("maneu" in ds) { maNeu(); }
    else if (ds.maaktiv) { const m = mitarbeiter().find((x) => x.id === ds.maaktiv); m.aktiv = m.aktiv === false; change(m); }
    else if (ds.tfilter2) { ui.tfilter2 = ds.tfilter2; }
    else if ("askstorno" in ds) { ui.askStorno = ui.openOrder; }
    else if ("nostorno" in ds) { ui.askStorno = null; }
    else if ("storno" in ds) { const o = db.orders.find((x) => x.nr === ui.openOrder); o.status = "storniert"; o.storniertAm = iso(today0()); (o.items || []).forEach((it) => it.st !== "ausgegeben" && setItem(it, "storniert")); ui.askStorno = null; change(o); toast(`Auftrag ${o.nr} storniert`); }
    else if ("pay" in ds) {
      const o = db.orders.find((x) => x.nr === ui.openOrder); const nrIn = document.getElementById("p-beleg").value.trim();
      if (!nrIn) { toast("Bitte die Beleg-Nr. aus der Kasse eintragen"); document.getElementById("p-beleg").focus(); return; }
      o.paid = { beleg: nrIn, art: document.getElementById("p-art").value, am: iso(today0()) }; change(o); toast(`Bezahlt vermerkt (Beleg ${nrIn})`);
    }
    else if ("zeigen" in ds) { zeigen(db.orders.find((x) => x.nr === ui.openOrder)); return; }
    else if ("teilen" in ds) { teilen(db.orders.find((x) => x.nr === ui.openOrder)); return; }
    else if ("print" in ds) { drucken(db.orders.find((x) => x.nr === ui.openOrder), ds.print || "schein"); return; }
    else if (ds.schauok) { const f = allItems().find(({ it }) => it.tnr === ds.schauok); schauOk(f.it, f.o); toast(`${teilLabel(f.o, f.it)} einwandfrei`); }
    else if (ds.ws) { ui.wsNr = ds.ws; scrollTo({ top: 0 }); }
    else if ("wszaehl" in ds) { const o = findeSammler(ui.wsNr).o; o.zaehlung = { am: jetztText(), von: wer(), anzahl: (o.items || []).length }; change(o); toast("Anzahl bestätigt"); }
    else if (ds.wsalle) { const o = findeSammler(ui.wsNr).o; (o.items || []).forEach((it) => it.st !== ds.wsalle && setItem(it, ds.wsalle, ds.wsalle === "fertig" ? it.platz || "Stange 1" : undefined)); const m = syncOrder(o); change(o); toast(`Alle Teile: ${ST[ds.wsalle]}${m}`); }
    else if (ds.wsst) { const f = allItems().find(({ it }) => it.tnr === ds.wsst); if (f.it.st !== ds.st) setItem(f.it, ds.st, ds.st === "fertig" ? f.it.platz || "Stange 1" : undefined); const m = syncOrder(f.o); change(f.o); toast(`${teilLabel(f.o, f.it)}: ${ST[ds.st]}${m}`); }
    else if (ds.custopen) { ui.openCust = ds.custopen; scrollTo({ top: 0, behavior: "smooth" }); }
    else if ("closecust" in ds) { ui.openCust = null; }
    else if (b.id === "sync") { sync(); return; }
    else return;
    render();
  });
  // Scanner wirken wie eine Tastatur: Nummer + Enter
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "pin") { e.preventDefault(); document.querySelector("[data-unlock]").click(); }
    if (e.key === "Enter" && e.target.id === "ws-nr") { e.preventDefault(); ui.wsNr = e.target.value.trim(); render(); const f = ui.wsNr && findeSammler(ui.wsNr); if (!f) return;
      const el = f.pos && document.querySelector(".ws-teil.gewaehlt"); if (el) el.scrollIntoView({ block: "center" }); return; }
    if (e.key === "Enter" && e.target.id === "pick") {
      e.preventDefault();
      const v = e.target.value.trim(); let wert = v;
      if (v.includes("beleg.html#")) { try { const d = SCHEIN.auspacken(v.split("#")[1]); wert = `${d.n}-${d.c}`; } catch { toast("Link ist kein Abholschein"); return; } }
      const m = wert.toUpperCase().match(/([A-Z]{1,2})\s*-?\s*(\d{3,7})\s*-?\s*([A-Z0-9]{4})?/);
      if (!m) { toast("Kein gültiger Abholcode"); return; }
      const o = db.orders.find((x) => x.nr === `${m[1]}-${m[2]}`);
      if (!o) { toast(`Auftrag ${m[1]}-${m[2]} nicht gefunden`); return; }
      ui.view = "auftraege"; ui.filter = "alle"; ui.aq = ""; ui.openOrder = o.nr; render();
      if (m[3] !== o.code) { toast(`Prüfzeichen passen nicht zu ${o.nr} – bitte Namen oder Ausweis prüfen`); return; }
      toast(o.status === "abgeholt" ? `${o.nr} wurde bereits abgeholt` : `Abholschein ${o.nr} gültig – ${o.paid ? "bezahlt" : "noch kassieren"}, dann „Abgeholt“ tippen`); return;
    }
    if (e.key !== "Enter" || e.target.id !== "scan") return;
    e.preventDefault();
    const nr = e.target.value.trim().toUpperCase().replace(/\s/g, ""); const ziel = ui.scanZiel || "reinigung";
    const fs = findeSammler(nr);
    const f = fs && fs.pos ? (fs.o.items || [])[fs.pos - 1] && { o: fs.o, it: fs.o.items[fs.pos - 1] } : allItems().find(({ it }) => it.tnr === nr);
    ui.scans = ui.scans || [];
    if (!f) ui.scans.unshift({ ok: false, text: fs && !fs.pos ? `${nr}: Das ist die Sammelnummer – bitte das Etikett mit Position scannen (z. B. ${zahl(fs.o.nr)}-1)` : `${nr || "(leer)"}: Teil nicht gefunden` });
    else { setItem(f.it, ziel, ziel === "fertig" ? (ui.scanPlatz || "Stange 1") : undefined); const m = syncOrder(f.o); change(f.o);
      ui.scans.unshift({ ok: true, text: `${teilLabel(f.o, f.it)} ${teilName(f.it)} → ${ST[ziel]}${ziel === "fertig" ? " (" + (ui.scanPlatz || "Stange 1") + ")" : ""}${m}` }); }
    render(); const s = document.getElementById("scan"); if (s) { s.value = ""; s.focus(); }
  });
  // Kundenfeld antippen: Kundenliste klappt automatisch auf
  document.addEventListener("focusin", (e) => {
    if (e.target.id === "cust-q" && !e.target.value && !ui.showList) { ui.showList = true; render(); }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "cust-q") { ui.draft.custQ = t.value; render(); }
    else if (t.id === "kq") { ui.q = t.value; render(); }
    else if (t.id === "aq") { ui.aq = t.value; render(); }
    else if (t.id === "tq") { ui.tq = t.value; render(); }
    // Fremdleistung: Beschreibung und Preis merken, Summe erst beim Verlassen des Feldes neu rechnen
    else if (t.dataset.ltext !== undefined) { ui.draft.lines[+t.dataset.ltext].text = t.value; }
    else if (t.dataset.lpreis !== undefined) { const v = Math.round(parseFloat(t.value.replace(",", ".")) * 100); ui.draft.lines[+t.dataset.lpreis].preis = v > 0 ? v : 0; }
    else if (t.id === "kq2") { ui.kq2 = t.value; render(); }
    else if (t.id === "t-suche") { ui.tSuche = t.value; render(); }
    else if (t.id === "scan-platz") { ui.scanPlatz = t.value; }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.lpreis !== undefined) { render(); return; }
    if (t.id === "bediener") { bediener = t.value; LS.set("lb-bediener", bediener || null); toast(bediener ? `Angemeldet: ${bedienerName()}` : "Kein Mitarbeiter gewählt"); }
    else if (t.id === "ta-art") { ui.taArt = t.value; render(); }
    else if (t.id === "t-foto" && t.files[0]) { const tk = tickets().find((x) => x.id === ui.openTicket); fotoHochladen(tk, t.files[0]).then(render); t.value = ""; }
    else if (t.id === "d-date" && t.value) { ui.draft.date = t.value; ui.draft.due = iso(addWorkdays(new Date(t.value + "T00:00"), 3)); render(); }
    else if (t.id === "d-due" && t.value) { ui.draft.due = t.value; render(); }
  });

  async function starten() {
    document.getElementById("login").hidden = true; document.getElementById("app").hidden = false;
    if (!(ui.store in STORES)) ui.store = Object.keys(STORES)[0];
    render(); sync();
  }
  (async () => {
    try { await laden(); } catch { toast("Der Speicher auf diesem Gerät ist nicht verfügbar (privates Surfen?)"); }
    if (token) starten(); else document.getElementById("login").hidden = false;
  })();

  // Service Worker: App startet auch ohne Internet; neue Versionen erst nach Tippen auf „Jetzt aktualisieren“
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      const zeige = () => { if (reg.waiting && navigator.serviceWorker.controller) document.getElementById("update").hidden = false; };
      zeige(); reg.addEventListener("updatefound", () => reg.installing && reg.installing.addEventListener("statechange", zeige));
      document.getElementById("update-los").addEventListener("click", () => reg.waiting && reg.waiting.postMessage("los"));
      setInterval(() => reg.update().catch(() => {}), 3600000);
    }).catch(() => {});
    // Nur nach einem Update neu laden, nicht beim allerersten Start
    let neuGeladen = !navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!neuGeladen) { neuGeladen = true; location.reload(); } });
  }
})();
