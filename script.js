// Anfrageformular. Ohne eingetragenen Empfänger (data-endpoint am Formular) verweist es aufs Telefon.
// Mit Endpoint (z. B. Formspree) wird die Anfrage per POST gesendet.
(function () {
  const form = document.getElementById("anfrage");
  if (!form) return;
  const msg = document.getElementById("form-msg");
  const show = (text) => { msg.textContent = text; msg.hidden = false; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const required = ["f-name", "f-tel", "f-ok"].map((id) => document.getElementById(id));
    const missing = required.find((el) => (el.type === "checkbox" ? !el.checked : !el.value.trim()));
    if (missing) {
      show(missing.id === "f-ok"
        ? "Bitte bestätigen Sie die Einwilligung zur Datenverarbeitung."
        : "Bitte geben Sie Ihren Namen und Ihre Telefonnummer an, damit wir Sie zurückrufen können.");
      missing.focus();
      return;
    }
    const data = new FormData(form);
    const payload = Object.fromEntries([...data.keys()].map((k) => [k, data.getAll(k).join(", ")]));
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      show("Vielen Dank! Die Online-Anfrage wird gerade eingerichtet. Bitte rufen Sie uns bis dahin unter 0511 464252 an.");
      return;
    }
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show("Vielen Dank! Wir haben Ihre Anfrage erhalten und rufen Sie zurück.");
    } catch {
      show("Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns unter 0511 464252 an.");
    }
  });
})();

// Bereichsleiste: aktuellen Bereich bzw. aktuelle Seite markieren, „Nach oben“ einblenden
(function () {
  const links = [...document.querySelectorAll(".subnav a")];
  const page = location.pathname.split("/").pop();
  links.forEach((a) => { if (page && a.getAttribute("href") === page) a.classList.add("active"); });
  const map = new Map();
  links.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href.startsWith("#")) return;
    const el = document.getElementById(href.slice(1));
    if (el) map.set(el, a);
  });
  if (map.size && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.remove("active"));
        const a = map.get(e.target);
        a.classList.add("active");
        a.parentElement.scrollTo({ left: a.offsetLeft - a.parentElement.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, el) => io.observe(el));
  }
  const top = document.querySelector(".totop");
  if (top) addEventListener("scroll", () => top.classList.toggle("show", scrollY > 700), { passive: true });
})();

// „Jetzt geöffnet“: rechnet mit den Öffnungszeiten (Ortszeit Hannover) und den Feiertagen in Niedersachsen.
// Ohne JavaScript bleibt der feste Text im Element stehen.
(function () {
  const els = document.querySelectorAll("[data-open-now]");
  if (!els.length) return;
  const HOURS = { 1: [[8, 13], [15, 18]], 2: [[8, 13], [15, 18]], 3: [[8, 13]], 4: [[8, 13], [15, 18]], 5: [[8, 13], [15, 18]], 6: [[8, 13]] };
  const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  const easter = (y) => {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1));
  };
  const key = (d) => d.toISOString().slice(0, 10);
  const holidays = (y) => {
    const e = easter(y), plus = (n) => key(new Date(e.getTime() + n * 864e5));
    return new Set([`${y}-01-01`, plus(-2), plus(1), `${y}-05-01`, plus(39), plus(50), `${y}-10-03`, `${y}-10-31`, `${y}-12-25`, `${y}-12-26`]);
  };

  // aktuelle Zeit in Hannover, unabhängig von der Zeitzone des Geräts
  const now = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { date: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), min: +p.hour * 60 + +p.minute };
  };
  const slots = (date) => (holidays(date.getUTCFullYear()).has(key(date)) ? [] : HOURS[date.getUTCDay()] || []);
  const uhr = (h) => `${h} Uhr`;

  function status() {
    const { date, min } = now();
    for (const [a, b] of slots(date)) if (min >= a * 60 && min < b * 60) return { open: true, text: `Jetzt geöffnet · bis ${uhr(b)}` };
    const later = slots(date).find(([a]) => min < a * 60);
    if (later) return { open: false, text: `Geschlossen · öffnet heute um ${uhr(later[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = new Date(date.getTime() + i * 864e5), s = slots(d);
      if (s.length) return { open: false, text: `Geschlossen · öffnet ${i === 1 ? "morgen" : DAYS[d.getUTCDay()]} um ${uhr(s[0][0])}` };
    }
    return { open: false, text: "Geschlossen" };
  }

  const render = () => {
    const s = status();
    els.forEach((el) => { el.textContent = s.text; el.classList.toggle("is-open", s.open); el.classList.add("is-live"); });
  };
  render();
  setInterval(render, 60000);
})();

// Startbild als Diashow: wechselt alle 5 Sekunden, pausiert bei Maus/Fokus, ohne Bewegung bei „weniger Bewegung“
(function () {
  const box = document.querySelector("[data-slides]");
  if (!box) return;
  const slides = [...box.querySelectorAll(".slide")];
  const dots = [...box.querySelectorAll(".dots button")];
  let i = 0, timer = null;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
    dots.forEach((d, k) => (k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
  };
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = () => { if (!ruhig && !timer) timer = setInterval(() => show(i + 1), 5000); };
  const stop = () => { clearInterval(timer); timer = null; };
  dots.forEach((d, k) => d.addEventListener("click", () => { show(k); stop(); start(); }));
  box.addEventListener("mouseenter", stop); box.addEventListener("mouseleave", start);
  box.addEventListener("focusin", stop); box.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
})();
