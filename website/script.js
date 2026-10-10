// Anfrageformular. Ohne eingetragenen Empfänger (data-endpoint am Formular) zeigt es die Anfrage
// als Text an und verweist aufs Telefon. Mit Endpoint (z. B. Formspree, Supabase-Funktion) wird per POST gesendet.
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
    const payload = {
      name: data.get("name"),
      telefon: data.get("telefon"),
      adresse: data.get("adresse"),
      leistungen: data.getAll("leistung"),
      wunschtag: data.get("wunschtag"),
      zeitfenster: data.get("zeitfenster"),
      nachricht: data.get("nachricht")
    };

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      show("Vielen Dank! Die Online-Anfrage wird gerade eingerichtet. Bitte rufen Sie uns bis dahin unter 0511 464252 an – wir vereinbaren Ihren Abholtermin gleich am Telefon.");
      return;
    }
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show("Vielen Dank! Wir haben Ihre Anfrage erhalten und melden uns telefonisch, meist am selben Werktag.");
    } catch {
      show("Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns unter 0511 464252 an.");
    }
  });
})();

// Bereichsleiste: aktiven Bereich markieren, „Nach oben“ einblenden
(function () {
  const links = [...document.querySelectorAll('.subnav a[href*="#"]')];
  const map = new Map();
  links.forEach((a) => {
    const id = a.getAttribute("href").split("#")[1];
    const el = id && document.getElementById(id);
    if (el) map.set(el, a);
  });
  if (map.size && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.remove("active"));
        const a = map.get(e.target);
        a.classList.add("active");
        const bar = a.parentElement;
        bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, el) => io.observe(el));
  }
  const page = location.pathname.split("/").pop();
  document.querySelectorAll(".subnav a").forEach((a) => { if (page && a.getAttribute("href") === page) a.classList.add("active"); });
  const top = document.querySelector(".totop");
  if (top) addEventListener("scroll", () => top.classList.toggle("show", scrollY > 700), { passive: true });
})();
