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
