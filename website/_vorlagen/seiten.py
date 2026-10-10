# Erzeugt die Unterseiten aus einer gemeinsamen Vorlage (Kopf, Fuß, Stil).
# Aufruf: python3 tayfun/website/_vorlagen/seiten.py
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
DOMAIN = "https://www.tayfun-textilpflege.de"  # TODO Livegang: echte Domain

HEAD = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{domain}/{file}">
{robots}<meta name="theme-color" content="#1B2A41">
<link rel="icon" href="assets/tayfun-siegel-mini-dunkel.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="preview">Vorschau – Preise, Liefergebiet und Rechtstexte sind noch Entwürfe und werden vor dem Livegang geprüft.</div>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="./" aria-label="Tayfun Textilpflege, Startseite">
      <img src="assets/tayfun-siegel-mini-dunkel.svg" alt="" width="44" height="44">
      <div><span>Tayfun</span><em>feine Textilpflege</em></div>
    </a>
    <div class="actions">
      <a class="call" href="tel:+49511464252">0511 464252</a>
      <a class="order" href="./#anfrage">Abholung anfragen</a>
    </div>
  </div>
  <nav class="subnav" aria-label="Bereiche">
    <div class="wrap">
      <a href="./#preise">Preise</a>
      <a href="./#abholservice">Abholservice</a>
      <a href="hemden-anzuege.html">Hemden &amp; Anzüge</a>
      <a href="./#bettwaren">Bettwaren</a>
      <a href="gardinenservice.html">Gardinen</a>
      <a href="teppichreinigung.html">Teppiche</a>
      <a href="./#demnaechst">Sofa &amp; Polster</a>
      <a href="./#firmen">Firmen</a>
      <a href="leistungen.html">Alle Leistungen</a>
      <a href="./#kontakt">Kontakt</a>
    </div>
  </nav>
</header>
<main>
<section class="page-head"><div class="wrap"><p class="kicker" style="color:var(--red-on-navy)">{kicker}</p><h1>{h1}</h1><p>{lead}</p></div></section>
<section><div class="wrap prose">
"""

FOOT = """
</div></section>
</main>
<footer>
  <div class="wrap">
    <div><img src="assets/tayfun-etikett-dunkel.svg" alt="Tayfun, feine Textilpflege, Hannover-Wettbergen" width="210" height="139"></div>
    <div><h4>Kontakt</h4><p>An der Kirche 10<br>30457 Hannover<br><a href="tel:+49511464252">0511 464252</a></p></div>
    <div><h4>Leistungen</h4><p><a href="hemden-anzuege.html">Hemden &amp; Anzüge</a><br><a href="gardinenservice.html">Gardinenservice</a><br><a href="teppichreinigung.html">Teppichreinigung</a><br><a href="leistungen.html">Alle Leistungen A–Z</a></p></div>
    <div class="legal"><span>© Tayfun Textilpflege</span><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></div>
  </div>
</footer>
<a class="totop" href="#" aria-label="Nach oben">↑</a>
<script src="script.js" defer></script>
</body>
</html>
"""

CTA = """
<h2>Abholung vereinbaren</h2>
<p>Rufen Sie uns an unter <a href="tel:+49511464252">0511 464252</a> oder nutzen Sie das <a href="./#anfrage">Anfrageformular</a>. Unser Laden: An der Kirche 10, 30457 Hannover-Wettbergen.</p>
<div class="btns"><a class="btn dark" href="./#anfrage">Abholung anfragen</a></div>
"""

PAGES = [
  dict(file="teppichreinigung.html",
       title="Teppichreinigung Hannover mit Abholung · Tayfun Textilpflege",
       desc="Teppichreinigung in Hannover: Velours, Shaggy und handgeknüpfte Orientteppiche. Wir rollen auf, holen ab, reinigen und legen wieder aus.",
       kicker="Teppichreinigung", h1="Teppichreinigung in Hannover – wir holen ab",
       lead="Vom pflegeleichten Velours bis zum handgeknüpften Orientteppich. Auf Wunsch rollen wir Ihren Teppich zu Hause auf und legen ihn nach der Reinigung wieder aus.",
       body="""
<h2>Was wir reinigen</h2>
<ul>
<li>Maschinell gefertigte Teppiche, Velours, Läufer und Schmutzfangmatten</li>
<li>Shaggy- und Hochflorteppiche</li>
<li>Handgeknüpfte Orientteppiche, Nepal, Gabbeh und Kelim</li>
</ul>
<h2>So läuft es ab</h2>
<p>Wir vereinbaren einen Termin, rollen den Teppich bei Ihnen auf und nehmen ihn mit. Nach der Reinigung bringen wir ihn zurück und legen ihn wieder aus. Das Auf- und Ausrollen berechnen wir je nach Größe und Aufwand gesondert – den Preis nennen wir Ihnen vorher.</p>
<h2>Preise</h2>
<p>Maschinell gefertigte Teppiche ab 14,90 €/m², handgeknüpfte Teppiche ab 19,90 €/m². Auf Wunsch mit Fleck- oder Mottenschutz.</p>
"""),
  dict(file="gardinenservice.html",
       title="Gardinen reinigen lassen in Hannover · Ab- und Aufhängen · Tayfun",
       desc="Gardinenservice in Hannover: Wir hängen Ihre Gardinen und Vorhänge ab, reinigen sie und hängen sie wieder auf. Mit Abholung und Lieferung.",
       img=("assets/fotos/gardine.jpg","Helle Gardine vor einem sonnigen Fenster"),
       kicker="Gardinenservice", h1="Gardinen ab, sauber, wieder dran",
       lead="Keine Leiter, kein Schleppen: Wir hängen Ihre Gardinen und Vorhänge ab, reinigen sie schonend und hängen sie wieder auf.",
       body="""
<h2>Unser Rundum-Service</h2>
<ul>
<li>Abhängen bei Ihnen zu Hause oder im Büro</li>
<li>Waschen bzw. Reinigen passend zum Material</li>
<li>Glätten und faltenfrei zurückbringen</li>
<li>Wieder aufhängen</li>
</ul>
<p>Natürlich können Sie Gardinen auch selbst bei uns im Laden abgeben. Der Preis richtet sich nach Größe, Material und Anzahl der Fenster – wir nennen ihn vorher.</p>
"""),
  dict(file="hemden-anzuege.html",
       title="Hemdenservice & Anzugreinigung Hannover · Tayfun Textilpflege",
       desc="Hemden gewaschen und gebügelt für 2,90 €, Anzugreinigung für 19,90 € in Hannover-Wettbergen. Mit Abholservice und Hemden-Abo für Firmen.",
       img=("assets/fotos/hemden-holzbuegel.jpg","Weiße Hemden auf Holzbügeln"),
       kicker="Hemden & Anzüge", h1="Hemden und Anzüge, wie sie sein sollen",
       lead="Gewaschen, gebügelt, auf dem Bügel – und auf Wunsch abgeholt und zurückgebracht. Für Berufstätige, Firmen und besondere Anlässe.",
       body="""
<h2>Hemden &amp; Blusen</h2>
<p>Hemden waschen und bügeln wir für 2,90 €, im 10er-Paket für 2,50 € pro Hemd. Sie bekommen sie auf dem Bügel zurück, bereit für den Schrank.</p>
<h2>Anzüge, Sakkos &amp; Kleider</h2>
<p>Chemische Reinigung mit Dämpfen und Formfinish, zweiteilige Anzüge für 19,90 €, Smokings für 32,90 €. Auch Wolle, Seide und Abendmode.</p>
<h2>Hemden-Abo für Firmen</h2>
<p>Für Kanzleien, Autohäuser, Banken und Praxen: Wir holen an einem festen Tag pro Woche ab, liefern gebügelt zurück und rechnen monatlich ab. Ohne Anfahrtskosten.</p>
<h2>Messe-Service</h2>
<p>Vor und nach der Messe in Hannover: Anzüge, Hemden und Standtextilien abholen, reinigen und pünktlich zurückbringen.</p>
"""),
  dict(file="leistungen.html",
       title="Alle Leistungen von A bis Z · Textilreinigung Hannover · Tayfun",
       desc="Textilreinigung in Hannover-Wettbergen: Hemden, Anzüge, Smoking, Brautkleider, Daunendecken, Matratzen, Gardinen, Teppiche, Tischwäsche, Skianzüge, Pferdedecken und mehr – mit Abholservice.",
       kicker="Leistungen", h1="Alles, was aus Stoff ist",
       lead="Was sich tragen, waschen oder reinigen lässt, pflegen wir. Hier finden Sie unsere Leistungen im Überblick. Fehlt etwas? Rufen Sie uns an – fast immer finden wir eine Lösung.",
       body="""
<div class="az">
<div><h2>Kleidung</h2><ul>
<li>Hemden, Frackhemden &amp; Blusen</li><li>Hosen &amp; Röcke</li><li>Anzüge, Sakkos &amp; Westen</li><li>Smokings &amp; Fracks</li>
<li>Kleider &amp; Abendkleider</li><li>Brautkleider</li><li>Pullover &amp; Strickwaren</li><li>Krawatten &amp; Schals</li>
<li>Mäntel &amp; Wollmäntel</li><li>Daunenjacken &amp; Outdoor-Kleidung</li><li>Skianzüge</li><li>Berufskleidung &amp; Uniformen</li><li>Unterwäsche</li></ul></div>
<div><h2>Bett &amp; Schlafen</h2><ul>
<li>Daunendecken &amp; Federbetten</li><li>Steppdecken</li><li>Kopf-, Feder- &amp; Daunenkissen</li><li>Wolldecken &amp; Plaids (Lama, Alpaka, Kaschmir)</li>
<li>Bettwäsche &amp; Laken</li><li>Matratzen</li></ul>
<h2>Haushalt</h2><ul>
<li>Tischwäsche &amp; Servietten</li><li>Mangelwäsche</li><li>Handtücher</li><li>Gardinen &amp; Vorhänge – auf Wunsch mit Ab- und Aufhängen</li></ul></div>
<div><h2>Teppiche</h2><ul>
<li>Maschinell gefertigte Teppiche &amp; Läufer</li><li>Shaggy &amp; Hochflor</li><li>Orientteppiche &amp; Handgeknüpfte</li><li>Aufrollen, Abholen &amp; Auslegen</li></ul>
<h2>Besonderes</h2><ul>
<li>Pferdedecken</li><li>Leder &amp; Wildleder (über einen Partnerbetrieb)</li><li>Imprägnieren</li><li>Fleckenentfernung</li><li>Firmenwäsche &amp; Hemden-Abo</li><li>Messe-Service</li></ul>
<h2>Demnächst bei Ihnen zu Hause</h2><ul>
<li>Polster- &amp; Sofareinigung vor Ort</li><li>Teppichreinigung vor Ort</li><li>Verleih von Teppich- &amp; Polsterreinigern</li></ul></div>
</div>
<p class="note">Preise nennen wir Ihnen gern am Telefon oder im Laden. Eine Auswahl finden Sie in unserer <a href="./#preise">Preisübersicht</a>.</p>
"""),
  dict(file="impressum.html", robots='<meta name="robots" content="noindex">\n',
       title="Impressum · Tayfun Textilpflege", desc="Impressum von Tayfun Textilpflege, Hannover-Wettbergen.",
       kicker="Rechtliches", h1="Impressum", lead="Angaben gemäß § 5 DDG.", cta=False,
       body="""
<p><strong>Tayfun Textilpflege</strong><br>
Inhaber: Duran Ince<br>
Einzelunternehmen<br>
An der Kirche 10<br>30457 Hannover</p>
<h2>Kontakt</h2>
<p>Telefon: 0511 464252<br>E-Mail: info@tayfun-textilpflege.de</p>
<h2>Umsatzsteuer</h2>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <span class="placeholder">[USt-IdNr. folgt]</span></p>
<h2>Bildnachweis</h2>
<p>Fotos: Unsplash (unsplash.com) und Pexels (pexels.com), lizenzfrei nach den Lizenzen der jeweiligen Plattform. Die abgebildeten Personen und Räume sind nicht Teil unseres Betriebs.</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
"""),
  dict(file="datenschutz.html", robots='<meta name="robots" content="noindex">\n',
       title="Datenschutz · Tayfun Textilpflege", desc="Datenschutzerklärung von Tayfun Textilpflege.",
       kicker="Rechtliches", h1="Datenschutzerklärung", lead="Entwurf – vor dem Livegang mit einem Generator (z. B. eRecht24) oder fachkundig prüfen lassen.", cta=False,
       body="""
<h2>Verantwortlicher</h2>
<p>Tayfun Textilpflege, Inhaber Duran Ince, An der Kirche 10, 30457 Hannover, Telefon 0511 464252, E-Mail info@tayfun-textilpflege.de.</p>
<h2>Hosting</h2>
<p>Diese Website wird über GitHub Pages bereitgestellt (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf werden technisch notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite verarbeitet, um die Seite auszuliefern (Art. 6 Abs. 1 lit. f DSGVO). Dabei können Daten in die USA übertragen werden. GitHub ist nach dem EU-US Data Privacy Framework zertifiziert. <span class="placeholder">[vor Livegang prüfen]</span></p>
<h2>Schriften</h2>
<p>Die verwendeten Schriften sind lokal eingebunden. Beim Aufruf der Seite wird keine Verbindung zu Servern von Google oder anderen Schriftanbietern aufgebaut.</p>
<h2>Anfrageformular</h2>
<p>Wenn Sie uns über das Formular eine Anfrage senden, verarbeiten wir Ihre Angaben (Name, Telefon, Adresse, Nachricht), um die Anfrage zu bearbeiten und die Abholung zu organisieren (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden gelöscht, sobald sie nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten bestehen. <span class="placeholder">[Dienst für den Formularversand ergänzen, sobald eingerichtet]</span></p>
<h2>Google Maps</h2>
<p>Der Link „Route in Google Maps“ führt zu Google. Erst wenn Sie ihn anklicken, werden Daten an Google übertragen.</p>
<h2>Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (in Niedersachsen: Die Landesbeauftragte für den Datenschutz Niedersachsen).</p>
"""),
]

for p in PAGES:
    html = HEAD.format(title=p["title"], desc=p["desc"], domain=DOMAIN, file=p["file"], robots=p.get("robots", ""),
                       kicker=p["kicker"], h1=p["h1"], lead=p["lead"])
    if p.get("img"):
        html += f'<img class="page-photo" src="{p["img"][0]}" alt="{p["img"][1]}" loading="lazy">\n'
    html += p["body"] + (CTA if p.get("cta", True) else "") + FOOT
    (OUT / p["file"]).write_text(html, encoding="utf-8")
    print("✓", p["file"])

urls = ["", "leistungen.html", "hemden-anzuege.html", "gardinenservice.html", "teppichreinigung.html"]
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{DOMAIN}/{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
print("✓ sitemap.xml, robots.txt")
