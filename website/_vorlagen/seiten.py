# Erzeugt alle Seiten der Website aus einer gemeinsamen Vorlage (Kopf, Fuß, Logo, Preisliste).
# Aufruf: python3 website/_vorlagen/seiten.py
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
DOMAIN = "https://www.tayfun-textilpflege.de"
TEL = '<a href="tel:+49511464252">0511 464252</a>'

# ---------------------------------------------------------------- Logo (nach dem Ladenschild, siehe logo.py)
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import logo as _logo

def logo(label=True):
    return _logo.svg("inline", label)

def mono_svg():
    return _logo.mono_svg()

# ---------------------------------------------------------------- Preisliste (Stand Stichweh 11/2025, Preise ohne CleanCard)
# (Bezeichnung, Preis) – Preis None = Hinweiszeile ohne Preis
PREISE = [
 ("garderobe", "Garderobe", [
  ("Hemd, hängend", "3,25"), ("Hemd, gelegt", "4,60"), ("Pullover", "5,80"), ("Strickjacke", "6,70"), ("Bluse", "7,20"),
  ("Rock", "9,00"), ("Hose", "10,20"), ("Jacke", "13,20"), ("Kleid", "13,60"), ("Anorak", "16,95"), ("Mantel", "20,00"),
  ("Krawatte", "7,90"), ("Faltenrock", "11,90"), ("Seidentuch/Pashmina", "19,10"),
  ("Daunenjacke mit Imprägnierung", "31,10"), ("Daunenmantel mit Imprägnierung", "41,50"),
  ("Daunenskianzug mit Imprägnierung", "46,70"), ("Daunenweste mit Imprägnierung", "22,80"),
  ("Schal", "4,90"), ("Top, T-Shirt", "5,80"), ("Weste", "6,90"), ("Shorts", "6,90"),
  ("Hose, gesteppt/thermo", "13,80"), ("Overall, gesteppt/thermo", "20,40"), ("Trainingsjacke, -hose", "6,90"),
  ("Steppweste", "11,40"), ("Overall, Jumpsuit", "14,00"), ("Morgenrock, Bademantel", "12,00"),
  ("Strickmantel, ungefüttert", "12,00"), ("Hemd, handgebügelt", "7,20"), ("Frackhemd, Abendbluse", "13,80"),
  ("Frackweste", "15,50"), ("Frack oder Smokingjacke", "25,00"), ("Langer Rock, sehr einfach", "18,00"),
  ("Kurzer Abendrock", "18,00"), ("Abendrock", "32,80"), ("Langes Kleid, sehr einfach", "32,80"),
  ("Gesellschaftskleid, kurz, einfach", "27,00"), ("Gesellschaftskleid, kurz", "41,50"), ("Abendkleid", "68,60"),
  ("Brautkleid", "135,00"), ("Taufkleid", "21,10"), ("Kinderhose", "4,50"), ("Kinderrock", "4,50"),
  ("Kinderjacke", "4,50"), ("Kinderkleid", "4,50"), ("Kinderoverall", "6,00"), ("Kinderanorak/-mantel", "7,50"),
  ("Kinderkleinteil, Mindestpreis", "4,00")]),
 ("zuschlaege", "Zuschläge (wahlweise)", [
  ("Neuform plus", "1,50"), ("Neuform für Kindersachen, Bluse, Top, Krawatte, Stricksachen", "0,75"),
  ("Imprägnieren", "3,70"), ("Imprägnieren von Kindersachen", "1,90")]),
 ("angebote", "Angebote der Woche", [("Dienstags: Hose", "8,95"), ("Dienstags: Oberhemd, ab 10 Hemden, je Hemd", "2,49"),
  ("Freitags: Anzug-Reinigung", "19,90")]),
 ("haushalt", "Haushalt", [
  ("Wolldecke", "10,30"), ("Lama-Decke", "14,60"), ("Kissenplatte", "7,40"), ("Tischdecke", "12,30"),
  ("Kleine Tischdecke oder Tischläufer", "6,45"), ("Kleinste Zierdeckchen oder Sets", "4,45"),
  ("Schlafsack/Steppbettdecke", "25,50"), ("Tagesdecke", "25,50"), ("Tagesdecke, 2-bettig", "40,60"),
  ("Kinderwagen- oder Karrengarnitur", "16,95"), ("Schaffell, pro Stück", "33,20"), ("Größere Felle, pro Stück", "45,80"),
  ("Pferdedecke/Thermodecke", "26,00"), ("Satteldecke", "15,60"),
  ("Kleines Kissen, kleines Daunenkissen, Kindersteppdecke", "13,20"),
  ("Kissen, Daunenkissen, Kinderdaunendecke", "18,10"), ("Daunenbettdecke", "33,20"),
  ("Daunenbettdecke, 2-bettig", "50,35"), ("Daunenschlafsack", "37,75"), ("Badezimmergarnitur, 2-teilig", "16,00"),
  ("Badezimmergarnitur, 3-teilig / große Badematte", "18,90")]),
 ("gardinen", "Vorhänge, Gardinen, Gartenauflagen", [
  ("Synthetische Gardinen, pro m²", "3,20"), ("Mangelgardinen, pro m²", "3,20"), ("Entfernen von Röllchen: + 10 %", None),
  ("Vorhänge, pro kg", "12,00"), ("Mindestpreis", "12,00"), ("Entfernen von Röllchen: + 10 %", None),
  ("Schonbezüge, pro kg", "12,00"), ("Zuschlag für Scotchgard, pro kg", "3,70"), ("Polster (Sitz oder Lehne)", "8,25"),
  ("Stuhlauflage", "18,65"), ("Liegenauflage", "21,75")]),
 ("leder", "Leder, Pelze, Webpelze", [
  ("Lederjacke bis 80 cm", "61,00"), ("Lederjacke 3/4 bis 90 cm", "68,00"), ("Ledermantel", "79,00"),
  ("Lederweste", "42,00"), ("Lederstrickjacke", "35,00"), ("Lederhose", "49,00"), ("Lederhose, kurz", "49,00"),
  ("Leder-Stoffjacke/-hose", "49,00"), ("Lederrock kurz, Lederhosenrock", "38,00"), ("Lederrock, lang", "42,00"),
  ("Lederhemd", "42,00"), ("Lederkrawatte", "15,00"), ("Lederhandschuhe", "25,00"), ("Lederhut/Mütze", "25,00"),
  ("Lederlammpelzjacke, kurz", "69,00"), ("Lederlammpelzjacke 3/4 bis 90 cm", "72,00"), ("Lederlammpelzmantel", "83,00"),
  ("Jacke mit Leder-/Pelzbesatz", "35,00"), ("Mantel mit Leder-/Pelzbesatz", "39,00"), ("Hose mit Lederbesatz", "49,00"),
  ("Kinderpelzmantel", "39,00"), ("Pelzjacke, kurz", "65,00"), ("Pelzjacke 3/4", "68,00"), ("Pelzmantel", "75,00"),
  ("Pelzweste", "39,00"), ("Pelzstola/Bolero", "42,00"), ("Pelzkragen/Schal/Mütze", "22,00"), ("Motorradkombi", "96,00"),
  ("Webpelzmantel", "40,00"), ("Webpelzjacke", "35,00"), ("Kinderwebpelzmantel", "29,00"), ("Kinderwebpelzjacke", "25,00")]),
 ("teppiche", "Teppiche", [
  ("Maschinell hergestellte Teppiche, Flokati, pro m²", "15,60"), ("Shaggy, Hochflor, pro m²", "20,30"),
  ("Doppelseitige Teppiche, pro m²", "19,20"), ("Orient-, handgeknüpfte, getuftete Teppiche, pro m²", "21,80"),
  ("Berberteppiche, pro m²", "21,80"), ("Chinateppiche, pro m²", "26,00"), ("Seidenteppiche, pro m²", "39,00"),
  ("Schmutzfangmatten, pro m²", "15,60"), ("Zuschlag Scotchgard, pro m²", "2,60"), ("Zuschlag Mottenschutz, pro m²", "5,20"),
  ("Mindestberechnung 1 m²", None), ("Reparatur und Ketteln auf Anfrage", None)]),
 ("waesche", "Wäschedienst", [
  ("#Privatwäsche", None),
  ("Bettbezug", "4,30"), ("Bettlaken", "4,30"), ("Bettbezug, Übergröße ab 1,80 m", "5,60"),
  ("Bettlaken, Übergröße ab 1,80 m", "5,60"), ("Kopfkissen", "2,55"), ("Jedes weitere Kleinteil", "2,55"),
  ("Jedes weitere Großteil", "4,30"),
  ("#Tischwäsche", None),
  ("Tafeltuch", "9,75"), ("Tischdecke", "7,00"), ("Mitteldecke", "4,30"), ("Serviette/Taschentuch", "2,40"),
  ("Tischdecke/Tafeltuch, Sonderbearbeitung", "12,45"), ("Mitteldecke, Sonderbearbeitung", "7,25"),
  ("Serviette, Sonderbearbeitung", "3,95"),
  ("#Kleidung", None),
  ("Kittel, hängend", "4,65"), ("Kittel, gelegt / Schürze", "5,45"), ("Arbeitshose/-latzhose/-jacke", "5,20"),
  ("Arbeitsoverall/Arzthose", "7,20"), ("Vorstecker", "3,00"), ("T-Shirt/Polo, einfach", "3,85"),
  ("Strümpfe, Unterwäsche", "2,10"), ("Pyjamajacke/-hose", "2,90"), ("Nachthemd", "4,20"), ("Bademantel", "11,00"),
  ("#Nur Mangeln", None),
  ("Bettbezug", "2,80"), ("Bettlaken", "2,80"), ("Bettbezug, Übergröße ab 1,80 m", "4,20"),
  ("Bettlaken, Übergröße ab 1,80 m", "4,20"), ("Kopfkissen/Kleinteil", "1,80"), ("Tafeltuch", "7,15"),
  ("Tischdecke", "5,60"), ("Mitteldecke", "2,90")]),
]
P = {}
for _, _, items in PREISE:
    for name, price in items:
        if price:
            P.setdefault(name, price)  # erster Eintrag gilt (z. B. Bettbezug aus der Privatwäsche, nicht „nur Mangeln“)

def rows(items):
    out = []
    for name, price in items:
        if name.startswith("#"):
            out.append(f'</tbody></table><h3>{name[1:]}</h3><table><tbody>')
        elif price is None:
            out.append(f'<tr><td class="hint" colspan="2">{name}</td></tr>')
        else:
            out.append(f'<tr><td>{name}</td><td class="price">{price} €</td></tr>')
    return "".join(out)

def table(items):
    return f'<div class="table-wrap"><table><tbody>{rows(items)}</tbody></table></div>'

WA_NUMMER = "49511464252"
WA_ABHOLUNG = "https://wa.me/" + WA_NUMMER + "?text=Hallo%2C%20ich%20m%C3%B6chte%20eine%20Abholung%20anfragen%3A%20"
WA_FRAGE = "https://wa.me/" + WA_NUMMER + "?text=Hallo%20Tayfun%20Textilpflege%2C%20ich%20habe%20eine%20Frage%3A%20"
WA_ICON = '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.2-.2-.4-.3Z"/></svg>'

# ---------------------------------------------------------------- Rahmen
NAV = [("Angebote", "#angebote"), ("Leistungen", "#leistungen"), ("Preisliste", "preisliste.html"), ("Hemden &amp; Anzüge", "hemden-anzuege.html"),
       ("Gardinen", "gardinenservice.html"), ("Teppiche", "teppichreinigung.html"), ("Abholservice", "#abholservice"),
       ("Alle Leistungen", "leistungen.html"), ("Kontakt", "#kontakt")]

def head(title, desc, file, robots="", home=False):
    nav = "".join(f'<a href="{h if (home or not h.startswith("#")) else "./" + h}">{t}</a>' for t, h in NAV)
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{DOMAIN}/{file}">
{robots}<meta name="theme-color" content="#D7262E">
<link rel="icon" href="assets/tayfun-monogramm.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preload" href="fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="rund.css">
{JSONLD if home else ""}</head>
<body>
<header class="top">
  <div class="bar-red"><div class="wrap">
    <a class="brand" href="{'#' if home else './'}" aria-label="Tayfun Textilpflege, Startseite">{logo()}</a>
    <div class="actions">
      <div class="hours-mini">An der Kirche 10 · Wettbergen<br><span class="open-now" data-open-now>Mo–Sa ab 8 Uhr</span></div>
      <a class="call" href="tel:+49511464252">0511 464252</a>
    </div>
  </div></div>
  <nav class="subnav" aria-label="Bereiche"><div class="wrap">{nav}</div></nav>
</header>
<main>
"""

FOOT = f"""</main>
<footer>
  <div class="wrap">
    <div class="logo">{logo()}<p style="margin-top:14px">Textilreinigung, Wäscherei und Änderungsschneiderei in Hannover-Wettbergen. Familienbetrieb seit 2001.</p></div>
    <div><h4>Kontakt</h4><p>Tayfun Textilpflege<br>An der Kirche 10<br>30457 Hannover<br>{TEL}</p></div>
    <div><h4>Öffnungszeiten</h4><p>Mo, Di, Do, Fr 8–13 und 15–18 Uhr<br>Mi 8–13 Uhr<br>Sa 8–13 Uhr</p></div>
    <div class="legal"><span>© Tayfun Textilpflege</span><a href="preisliste.html">Preisliste</a><a href="leistungen.html">Leistungen A–Z</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></div>
  </div>
</footer>
<a class="totop" href="#" aria-label="Nach oben">↑</a>
<script src="script.js" defer></script>
</body>
</html>
"""

JSONLD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"DryCleaningOrLaundry","name":"Tayfun Textilpflege","url":"https://www.tayfun-textilpflege.de/",
"telephone":"+49 511 464252","email":"info@tayfun-textilpflege.de","image":"https://www.tayfun-textilpflege.de/assets/tayfun-logo-rot.png",
"address":{"@type":"PostalAddress","streetAddress":"An der Kirche 10","postalCode":"30457","addressLocality":"Hannover","addressRegion":"Niedersachsen","addressCountry":"DE"},
"openingHoursSpecification":[
{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Thursday","Friday"],"opens":"08:00","closes":"13:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Thursday","Friday"],"opens":"15:00","closes":"18:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":["Wednesday","Saturday"],"opens":"08:00","closes":"13:00"}],
"priceRange":"€"}
</script>
"""

def subpage(file, title, desc, kicker, h1, lead, body, robots="", img=None, cta=True):
    html = head(title, desc, file, robots)
    html += f'<section class="page-head"><div class="wrap"><p class="kicker">{kicker}</p><h1>{h1}</h1><p>{lead}</p></div></section>\n'
    html += '<section><div class="wrap prose' + (' wide' if 'class="pricelist"' in body or 'class="az"' in body else '') + '">\n'
    if img:
        html += f'<img class="page-photo" src="{img[0]}" alt="{img[1]}" loading="lazy">\n'
    html += body
    if cta:
        html += f'<h2>Fragen?</h2><p>Rufen Sie uns an unter {TEL} oder kommen Sie vorbei: An der Kirche 10, 30457 Hannover-Wettbergen.</p>'
    html += "\n</div></section>\n" + FOOT
    (OUT / file).write_text(html, encoding="utf-8")
    print("✓", file)

# ---------------------------------------------------------------- Startseite
LEISTUNGEN = [
 ("Spezialreinigung", "Für empfindliche Stoffe wie Seide, Wolle, Kaschmir, Abend- und Brautmode."),
 ("Nassreinigung", "Schonende Reinigung mit Wasser für Kleidung, die keine chemische Reinigung verträgt."),
 ("Sofortdienst", "Wenn es eilig ist: Fragen Sie im Laden nach unserem Sofortdienst."),
 ("Appretur", "Neuform und Glanz für Kleidung, damit sie wieder in Form fällt."),
 ("Imprägnierung", "Schutz gegen Regen und Schmutz für Jacken, Mäntel und Outdoor-Kleidung."),
 ("Hemdendienst", 'Gewaschen und gebügelt, hängend oder gelegt. <a href="hemden-anzuege.html">Mehr</a>'),
 ("Großteilwäschedienst", "Bettdecken, Kissen, Wolldecken, Tagesdecken und Schlafsäcke."),
 ("Tischwäschedienst", "Tafeltücher, Tischdecken und Servietten – gewaschen und gemangelt."),
 ("Heimtextilienreinigung", 'Gardinen, Vorhänge, Polster und Auflagen. <a href="gardinenservice.html">Gardinenservice</a>'),
 ("Teppichreinigung", 'Vom Velours bis zum Orientteppich, mit Abholung. <a href="teppichreinigung.html">Mehr</a>'),
 ("Lederreinigung", "Lederjacken, -mäntel und -hosen, Lammfell, Pelz und Webpelz."),
 ("Änderungsschneiderei", "Kürzen, Enger- und Weitermachen, Reißverschlüsse und Reparaturen."),
]

def index():
    strips = "".join(f'<div class="strip"><h3>{t}</h3><p>{d}</p></div>' for t, d in LEISTUNGEN)
    tiles = [("hemden-anzuege.html", "hemden-holzbuegel.jpg", 1000, 1500, "Hemden &amp; Blusen", f"Hemd ab {P['Hemd, hängend']} €"),
             ("hemden-anzuege.html", "anzug-navy.jpg", 1000, 667, "Sakkos &amp; Hosen", f"Jacke {P['Jacke']} €"),
             ("preisliste.html#garderobe", "brautkleid.jpg", 1000, 1500, "Kleider &amp; Brautmode", f"Kleid ab {P['Kleid']} €"),
             ("preisliste.html#garderobe", "mantel-herbst.jpg", 1000, 1500, "Mäntel &amp; Jacken", f"Mantel {P['Mantel']} €"),
             ("#bettwaren", "schlafzimmer.jpg", 1600, 1067, "Bettdecken &amp; Kissen", f"Kissen ab {P['Kleines Kissen, kleines Daunenkissen, Kindersteppdecke']} €"),
             ("gardinenservice.html", "gardine.jpg", 1200, 1600, "Gardinen", "3,20 € pro m²")]
    tiles_html = "".join(f'<a class="tile" href="{h}"><img src="assets/fotos/{img}" alt="" loading="lazy" width="{w}" height="{hh}"><span>{t}<br><small>{pr}</small></span></a>' for h, img, w, hh, t, pr in tiles)
    auszug = [("Hemd, hängend", None), ("Hemd, gelegt", None), ("Bluse", None), ("Hose", None), ("Rock", None), ("Jacke", None),
              ("Kleid", None), ("Mantel", None), ("Daunenjacke mit Imprägnierung", None), ("Krawatte", None),
              ("Daunenbettdecke", None), ("Kissen, Daunenkissen, Kinderdaunendecke", None),
              ("Synthetische Gardinen, pro m²", None), ("Maschinell hergestellte Teppiche, Flokati, pro m²", None),
              ("Lederjacke bis 80 cm", None), ("Bettbezug", None)]
    auszug = [(n, P[n]) for n, _ in auszug]
    body = f"""
  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap">
      <div>
        <p class="kicker">Hannover-Wettbergen · An der Kirche 10</p>
        <h1 id="hero-title">Ihre Textilreinigung in <span>Wettbergen</span></h1>
        <p class="lead">Reinigung, Wäscherei, Lederpflege und Änderungsschneiderei unter einem Dach. Gardinen und Teppiche holen wir auch bei Ihnen ab.</p>
        <div class="btns"><a class="btn primary" href="preisliste.html">Zur Preisliste</a><a class="btn outline" href="tel:+49511464252">0511 464252 anrufen</a></div>
        <p class="open-now" data-open-now aria-live="polite">Mo–Sa ab 8 Uhr geöffnet</p>
        <dl class="hours">
          <dt>Mo, Di, Do, Fr</dt><dd>8–13 und 15–18 Uhr</dd>
          <dt>Mittwoch</dt><dd>8–13 Uhr</dd>
          <dt>Samstag</dt><dd>8–13 Uhr</dd>
        </dl>
      </div>
      <div class="hero-photo">
        <img src="assets/fotos/hemd-manschette.jpg" alt="Mann knöpft die Manschette eines frisch gebügelten weißen Hemdes zu" width="1000" height="1500" fetchpriority="high">
        <div class="stamp">Familienbetrieb<small>seit 2001</small></div>
      </div>
    </div>
  </section>

  <section id="angebote" class="deals" aria-labelledby="d-title">
    <div class="wrap">
      <p class="kicker">Angebote der Woche</p>
      <h2 id="d-title">Unsere Tipps im Schaufenster</h2>
      <div class="deal-grid">
        <article class="deal"><p class="day">Dienstags</p><h3>Hose</h3><p class="was">statt {P['Hose']} €</p><p class="now">{P['Dienstags: Hose']}<span> €</span></p></article>
        <article class="deal"><p class="day">Dienstags</p><h3>Oberhemd</h3><p class="was">ab 10 Hemden, je Hemd</p><p class="now">{P['Dienstags: Oberhemd, ab 10 Hemden, je Hemd']}<span> €</span></p></article>
        <article class="deal"><p class="day">Freitags</p><h3>Anzug-Reinigung</h3><p class="was">Sakko und Hose</p><p class="now">{P['Freitags: Anzug-Reinigung']}<span> €</span></p></article>
      </div>
      <p class="note">Gilt bei Abgabe am jeweiligen Tag im Laden An der Kirche 10.</p>
    </div>
  </section>

  <section id="leistungen" class="alt" aria-labelledby="l-title">
    <div class="wrap">
      <p class="kicker">Leistungen</p>
      <h2 id="l-title">Alles aus einer Hand</h2>
      <p class="intro">Was Sie bei uns im Schaufenster lesen, bekommen Sie auch im Laden: von der Spezialreinigung bis zur Änderungsschneiderei.</p>
      <div class="strips">{strips}</div>
      <p class="note" style="margin-top:18px"><a href="leistungen.html">Alle Leistungen von A bis Z</a></p>
    </div>
  </section>

  <section aria-labelledby="q-title">
    <div class="wrap">
      <p class="kicker">Beliebt</p>
      <h2 id="q-title">Was dürfen wir für Sie reinigen?</h2>
      <div class="tiles">{tiles_html}</div>
    </div>
  </section>

  <section id="abholservice" class="alt" aria-labelledby="a-title">
    <div class="wrap split">
      <div>
        <p class="kicker">Abhol- und Bringservice</p>
        <h2 id="a-title">Gardinen und Teppiche holen wir bei Ihnen ab</h2>
        <p class="intro">Große und schwere Textilien müssen Sie nicht selbst bringen. Wir kommen zu Ihnen nach Hause oder ins Büro.</p>
        <ul class="checklist">
          <li>Gardinen und Vorhänge abhängen, reinigen und wieder aufhängen</li>
          <li>Teppiche aufrollen, abholen, reinigen und wieder auslegen</li>
          <li>Abholung und Lieferung in Hannover und Umgebung</li>
        </ul>
        <p class="box">Die Kosten für Anfahrt, Ab- und Aufhängen oder Auf- und Ausrollen richten sich nach Aufwand. Wir nennen sie Ihnen vorher am Telefon.</p>
        <div class="btns" style="margin-top:22px"><a class="btn primary" href="#anfrage">Termin anfragen</a><a class="btn outline" href="tel:+49511464252">0511 464252</a></div>
      </div>
      <img class="photo" src="assets/fotos/gardine.jpg" alt="Helle Gardine vor einem sonnigen Fenster" loading="lazy" width="1200" height="1600">
    </div>
  </section>

  <section id="bettwaren" aria-labelledby="b-title">
    <div class="wrap">
      <p class="kicker">Großteilwäsche</p>
      <h2 id="b-title">Frisch gewaschen schläft es sich besser</h2>
      <p class="intro">Kissen, Decken und Bettwäsche sammeln über das Jahr Staub und Milben. Wir waschen alles schonend, trocknen es gründlich und schütteln Daunen wieder auf.</p>
      <figure class="callouts">
        <img src="assets/fotos/schlafzimmer.jpg" alt="Helles Schlafzimmer mit Kopfkissen, Wolldecke, Bettdecke und Laken" loading="lazy" width="1600" height="1067">
        <span class="pin" style="--x:52%;--y:42%"><i>1</i><b>Kissen {P['Kissen, Daunenkissen, Kinderdaunendecke']} €</b></span>
        <span class="pin" style="--x:11%;--y:44%"><i>2</i><b>Kleines Kissen {P['Kleines Kissen, kleines Daunenkissen, Kindersteppdecke']} €</b></span>
        <span class="pin" style="--x:16%;--y:76%"><i>3</i><b>Wolldecke {P['Wolldecke']} €</b></span>
        <span class="pin" style="--x:74%;--y:73%"><i>4</i><b>Bettbezug {P['Bettbezug']} €</b></span>
        <span class="pin" style="--x:5%;--y:93%"><i>5</i><b>Daunenbettdecke {P['Daunenbettdecke']} €</b></span>
      </figure>
      <ol class="legend">
        <li><span><strong>Kissen, Daunenkissen</strong> {P['Kissen, Daunenkissen, Kinderdaunendecke']} €</span></li>
        <li><span><strong>Kleines Kissen</strong> {P['Kleines Kissen, kleines Daunenkissen, Kindersteppdecke']} €</span></li>
        <li><span><strong>Wolldecke</strong> {P['Wolldecke']} €, Lama-Decke {P['Lama-Decke']} €</span></li>
        <li><span><strong>Bettbezug, Bettlaken</strong> {P['Bettbezug']} €</span></li>
        <li><span><strong>Daunenbettdecke</strong> {P['Daunenbettdecke']} €</span></li>
      </ol>
    </div>
  </section>

  <section id="preise" class="alt" aria-labelledby="p-title">
    <div class="wrap split">
      <div>
        <p class="kicker">Preise</p>
        <h2 id="p-title">Eine Auswahl unserer Preise</h2>
        <p class="intro">Alle Preise in Euro inklusive Mehrwertsteuer. Die vollständige Liste mit Leder, Pelz, Teppichen und Wäschedienst finden Sie in der Preisliste.</p>
        <div class="offers">
          <div class="offer"><span>Dienstags: Hose</span><span>{P['Dienstags: Hose']} €</span></div>
          <div class="offer"><span>Dienstags ab 10 Hemden: je Hemd</span><span>{P['Dienstags: Oberhemd, ab 10 Hemden, je Hemd']} €</span></div>
          <div class="offer"><span>Freitags: Anzug-Reinigung</span><span>{P['Freitags: Anzug-Reinigung']} €</span></div>
        </div>
        <div class="btns" style="margin-top:22px"><a class="btn primary" href="preisliste.html">Komplette Preisliste</a></div>
      </div>
      {table(auszug)}
    </div>
  </section>

  <section aria-labelledby="u-title">
    <div class="wrap story">
      <div class="mono">{mono_svg()}</div>
      <div>
        <p class="kicker">Über uns</p>
        <h2 id="u-title">Familienbetrieb seit 2001</h2>
        <p>Seit 2001 ist Textilpflege unser Familienhandwerk. In Wettbergen kennen uns viele Kundinnen und Kunden seit Jahren: Sie geben ihre Kleidung bei uns An der Kirche ab und bekommen sie sauber, gebügelt und auf Wunsch geändert zurück.</p>
        <p>Wir beraten Sie gern persönlich im Laden, auch bei schwierigen Flecken und empfindlichen Materialien.</p>
      </div>
    </div>
  </section>

  <section class="alt" aria-labelledby="faq-title">
    <div class="wrap split">
      <div>
        <p class="kicker">Häufige Fragen</p>
        <h2 id="faq-title">Gut zu wissen</h2>
      </div>
      <div>
        <details><summary>Holen Sie auch Kleidung ab?</summary><p>Kleidung, Bettwaren und Wäsche geben Sie bitte bei uns im Laden ab. Abholung und Lieferung bieten wir für Gardinen und Teppiche an.</p></details>
        <details><summary>Hängen Sie Gardinen auch ab und wieder auf?</summary><p>Ja. Wir nehmen Gardinen und Vorhänge bei Ihnen ab, reinigen sie und hängen sie wieder auf. Den Preis für den Service nennen wir Ihnen vorher.</p></details>
        <details><summary>Reinigen Sie auch Orientteppiche?</summary><p>Ja, auch handgeknüpfte Orient-, Berber-, China- und Seidenteppiche. Auf Wunsch rollen wir den Teppich bei Ihnen auf und legen ihn danach wieder aus.</p></details>
        <details><summary>Reinigen Sie Leder und Pelz?</summary><p>Ja, von der Lederjacke bis zum Pelzmantel. Die Preise finden Sie in unserer <a href="preisliste.html#leder">Preisliste</a>.</p></details>
        <details><summary>Ändern Sie auch Kleidung?</summary><p>Ja, unsere Änderungsschneiderei kürzt, ändert und repariert. Bringen Sie das Teil einfach vorbei, wir beraten Sie im Laden.</p></details>
        <details><summary>Wie lange dauert die Reinigung?</summary><p>Das hängt vom Teil ab. Wir nennen Ihnen bei der Abgabe den Abholtermin. Wenn es eilig ist, fragen Sie nach unserem Sofortdienst.</p></details>
      </div>
    </div>
  </section>

  <section id="kontakt" aria-labelledby="k-title">
    <div class="wrap split">
      <div class="contact">
        <p class="kicker">Kontakt</p>
        <h2 id="k-title">Besuchen Sie uns oder rufen Sie an</h2>
        <dl>
          <dt>Adresse</dt><dd>An der Kirche 10<br>30457 Hannover-Wettbergen</dd>
          <dt>Telefon</dt><dd>{TEL}</dd>
          <dt>WhatsApp</dt><dd><a href="{WA_FRAGE}" rel="noopener" target="_blank">0511 464252</a></dd>
          <dt>E-Mail</dt><dd><a href="mailto:info@tayfun-textilpflege.de">info@tayfun-textilpflege.de</a></dd>
          <dt>Mo, Di, Do, Fr</dt><dd>8–13 und 15–18 Uhr</dd>
          <dt>Mittwoch</dt><dd>8–13 Uhr</dd>
          <dt>Samstag</dt><dd>8–13 Uhr</dd>
        </dl>
        <div class="transit">
          <strong>Mit Bus und Bahn</strong>
          <span>Haltestelle „Wettbergen“, von dort ca. 7 Minuten zu Fuß</span>
          <span class="lines"><span class="line tram" title="Stadtbahn">3</span><span class="line tram" title="Stadtbahn">7</span><span class="line" title="Bus">129</span><span class="line" title="Bus">130</span><span class="line" title="Bus">363</span></span>
        </div>
        <a class="btn outline" href="https://www.google.com/maps/search/?api=1&amp;query=Tayfun+Textilpflege+An+der+Kirche+10+30457+Hannover" rel="noopener" target="_blank">Route in Google Maps</a>
      </div>
      <div id="anfrage" class="wa-box">
        <h3>Abholung per WhatsApp anfragen</h3>
        <p>Schreiben Sie uns kurz, was abgeholt werden soll, gern mit Foto und ungefährer Größe. Wir melden uns mit einem Termin.</p>
        <a class="btn wa" href="{WA_ABHOLUNG}" rel="noopener" target="_blank">{WA_ICON}WhatsApp öffnen</a>
        <figure class="wa-qr"><img src="assets/whatsapp-qr.svg" alt="QR-Code: WhatsApp-Nachricht an Tayfun Textilpflege" width="270" height="270"><figcaption>Am Computer? Mit dem Handy scannen.</figcaption></figure>
        <p class="note">Lieber anrufen? <a href="tel:+49511464252">0511 464252</a>. Beim Tippen auf „WhatsApp öffnen“ wechseln Sie zu WhatsApp, mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
      </div>
    </div>
  </section>
"""
    html = head("Tayfun Textilpflege · Textilreinigung in Hannover-Wettbergen",
                "Textilreinigung, Wäscherei, Lederreinigung und Änderungsschneiderei in Hannover-Wettbergen, An der Kirche 10. Gardinen und Teppiche mit Abhol- und Bringservice.",
                "", home=True) + body + FOOT
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print("✓ index.html")

index()

# ---------------------------------------------------------------- Preisliste
toc = "".join(f'<li><a href="#{k}">{t}</a></li>' for k, t, _ in PREISE)
groups = "".join(f'<div class="group" id="{k}"><h2>{t}</h2>{table(items)}</div>' for k, t, items in PREISE)
subpage("preisliste.html", "Preisliste · Tayfun Textilpflege Hannover-Wettbergen",
        "Preisliste der Tayfun Textilpflege: Garderobe, Haushalt, Gardinen, Leder und Pelz, Teppiche und Wäschedienst. Alle Preise inkl. MwSt.",
        "Preise", "Preisliste", "Alle Preise in Euro inklusive der gültigen Mehrwertsteuer. Für Teile, die nicht aufgeführt sind, nennen wir Ihnen den Preis gern im Laden.",
        f'<ul class="toc">{toc}</ul><div class="pricelist">{groups}</div><p class="note">Abhol- und Bringservice für Gardinen und Teppiche sowie Ab- und Aufhängen bzw. Auf- und Ausrollen nach Aufwand, Preis auf Anfrage.</p>')

# ---------------------------------------------------------------- Unterseiten
subpage("hemden-anzuege.html", "Hemdendienst & Anzugreinigung Hannover-Wettbergen · Tayfun",
        f"Hemden gewaschen und gebügelt ab {P['Hemd, hängend']} €, Sakko {P['Jacke']} €, Hose {P['Hose']} €. Tayfun Textilpflege in Hannover-Wettbergen.",
        "Hemden &amp; Anzüge", "Hemden und Anzüge, wie sie sein sollen",
        "Gewaschen, gebügelt und auf dem Bügel – bereit für den Schrank. Geben Sie Ihre Kleidung einfach bei uns im Laden ab.",
        f"""<h2>Hemdendienst</h2>
{table([(n, P[n]) for n in ["Hemd, hängend", "Hemd, gelegt", "Hemd, handgebügelt", "Frackhemd, Abendbluse", "Bluse"]])}
<p>Regelmäßig viele Hemden? Sprechen Sie uns im Laden an.</p>
<h2>Anzüge, Sakkos und Abendgarderobe</h2>
{table([(n, P[n]) for n in ["Jacke", "Hose", "Weste", "Krawatte", "Frack oder Smokingjacke", "Frackweste"]])}
<h2>Angebote</h2>
{table([(n, P[n]) for n in ["Dienstags: Hose", "Dienstags: Oberhemd, ab 10 Hemden, je Hemd", "Freitags: Anzug-Reinigung"]])}
<p class="note">Alle Preise in Euro inkl. MwSt. Weitere Preise in der <a href="preisliste.html">Preisliste</a>.</p>""",
        img=("assets/fotos/hemden-holzbuegel.jpg", "Weiße Hemden auf Holzbügeln"))

subpage("gardinenservice.html", "Gardinen reinigen lassen in Hannover · Ab- und Aufhängen · Tayfun",
        "Gardinenservice in Hannover: Wir hängen Ihre Gardinen und Vorhänge ab, reinigen sie und hängen sie wieder auf. Mit Abholung und Lieferung.",
        "Gardinenservice", "Gardinen ab, sauber, wieder dran",
        "Keine Leiter, kein Schleppen: Wir hängen Ihre Gardinen und Vorhänge ab, reinigen sie und hängen sie wieder auf.",
        f"""<h2>Unser Service</h2>
<ul>
<li>Abhängen bei Ihnen zu Hause oder im Büro</li>
<li>Waschen bzw. Reinigen passend zum Material</li>
<li>Glätten und faltenfrei zurückbringen</li>
<li>Wieder aufhängen</li>
</ul>
<p>Sie können Gardinen auch selbst bei uns im Laden abgeben. Die Kosten für Abholung, Ab- und Aufhängen richten sich nach Anzahl und Höhe der Fenster. Wir nennen sie Ihnen vorher.</p>
<h2>Preise</h2>
{table(PREISE[4][2])}
<div class="btns" style="margin-top:20px"><a class="btn primary" href="./#anfrage">Termin anfragen</a></div>""",
        img=("assets/fotos/gardine.jpg", "Helle Gardine vor einem sonnigen Fenster"))

subpage("teppichreinigung.html", "Teppichreinigung Hannover mit Abholung · Tayfun Textilpflege",
        "Teppichreinigung in Hannover: maschinell gefertigte Teppiche, Shaggy, Orient-, Berber- und Seidenteppiche. Wir rollen auf, holen ab und legen wieder aus.",
        "Teppichreinigung", "Teppichreinigung mit Abholung",
        "Vom pflegeleichten Velours bis zum handgeknüpften Orientteppich. Wir rollen Ihren Teppich zu Hause auf und legen ihn nach der Reinigung wieder aus.",
        f"""<h2>So läuft es ab</h2>
<ul>
<li>Termin am Telefon oder per WhatsApp vereinbaren</li>
<li>Wir rollen den Teppich bei Ihnen auf und nehmen ihn mit</li>
<li>Gründliche Reinigung passend zum Material</li>
<li>Wir bringen ihn zurück und legen ihn wieder aus</li>
</ul>
<p>Die Kosten für Abholung, Auf- und Ausrollen richten sich nach Größe und Aufwand. Wir nennen sie Ihnen vorher. Natürlich können Sie Ihren Teppich auch selbst im Laden abgeben.</p>
<h2>Preise</h2>
{table(PREISE[6][2])}
<div class="btns" style="margin-top:20px"><a class="btn primary" href="./#anfrage">Termin anfragen</a></div>""")

az = "".join(f"<li><strong>{t}</strong> – {d.split(' <a')[0]}</li>" for t, d in LEISTUNGEN)
subpage("leistungen.html", "Alle Leistungen · Textilreinigung Hannover-Wettbergen · Tayfun",
        "Spezialreinigung, Nassreinigung, Sofortdienst, Appretur, Imprägnierung, Hemdendienst, Wäschedienst, Teppich-, Leder- und Heimtextilienreinigung sowie Änderungsschneiderei in Hannover-Wettbergen.",
        "Leistungen", "Unsere Leistungen",
        "Was Sie bei uns im Schaufenster lesen, bekommen Sie auch im Laden. Fehlt etwas? Rufen Sie uns an.",
        f"""<ul>{az}</ul>
<div class="az">
<div><h2>Kleidung</h2><ul>
<li>Hemden, Blusen, Frackhemden</li><li>Hosen, Röcke, Kleider</li><li>Sakkos, Westen, Krawatten</li><li>Frack, Smoking, Abendkleider</li>
<li>Brautkleider, Taufkleider</li><li>Pullover, Strickwaren, Seidentücher</li><li>Mäntel, Anoraks, Daunenjacken</li><li>Skianzüge, Thermokleidung</li><li>Kinderkleidung</li></ul></div>
<div><h2>Haushalt und Bett</h2><ul>
<li>Daunenbettdecken, Kissen, Schlafsäcke</li><li>Wolldecken, Lama-Decken, Tagesdecken</li><li>Bettwäsche, Tischwäsche (auch nur Mangeln)</li>
<li>Gardinen, Vorhänge, Schonbezüge</li><li>Polster, Stuhl- und Liegenauflagen</li><li>Felle, Pferde- und Satteldecken</li><li>Badezimmergarnituren</li></ul></div>
<div><h2>Leder und Teppiche</h2><ul>
<li>Lederjacken, -mäntel, -hosen, -röcke</li><li>Lammfell, Pelz, Webpelz</li><li>Motorradkombis</li>
<li>Maschinell gefertigte Teppiche, Shaggy</li><li>Orient-, Berber-, China-, Seidenteppiche</li><li>Schmutzfangmatten</li>
<li>Abholung, Auf- und Ausrollen</li></ul></div>
</div>
<p class="note">Die Preise finden Sie in unserer <a href="preisliste.html">Preisliste</a>.</p>""")

subpage("impressum.html", "Impressum · Tayfun Textilpflege", "Impressum von Tayfun Textilpflege, Hannover-Wettbergen.",
        "Rechtliches", "Impressum", "Angaben gemäß § 5 DDG.", """
<p><strong>Tayfun Textilpflege</strong><br>
Inhaber: Duran Ince<br>
Einzelunternehmen<br>
An der Kirche 10<br>30457 Hannover</p>
<h2>Kontakt</h2>
<p>Telefon: 0511 464252<br>E-Mail: info@tayfun-textilpflege.de</p>
<h2>Bildnachweis</h2>
<p>Fotos: Unsplash (unsplash.com) und Pexels (pexels.com), lizenzfrei nach den Lizenzen der jeweiligen Plattform. Die abgebildeten Personen und Räume sind nicht Teil unseres Betriebs.</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
""", robots='<meta name="robots" content="noindex">\n', cta=False)

subpage("datenschutz.html", "Datenschutz · Tayfun Textilpflege", "Datenschutzerklärung von Tayfun Textilpflege.",
        "Rechtliches", "Datenschutzerklärung", "Entwurf – vor dem Livegang mit einem Generator (z. B. eRecht24) oder fachkundig prüfen lassen.", """
<h2>Verantwortlicher</h2>
<p>Tayfun Textilpflege, Inhaber Duran Ince, An der Kirche 10, 30457 Hannover, Telefon 0511 464252, E-Mail info@tayfun-textilpflege.de.</p>
<h2>Hosting</h2>
<p>Diese Website wird bei ALL-INKL.COM – Neue Medien Münnich, Inhaber René Münnich, Hauptstraße 68, 02742 Friedersdorf, Deutschland, betrieben. Beim Aufruf der Website verarbeitet der Anbieter technisch notwendige Daten (z. B. IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser) in Server-Protokollen, um die Website auszuliefern und die Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden in Deutschland verarbeitet. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung. <span class="placeholder">[Auftragsverarbeitungsvertrag im ALL-INKL-Kundenbereich abschließen]</span></p>
<h2>Schriften</h2>
<p>Die verwendete Schrift ist lokal eingebunden. Beim Aufruf der Seite wird keine Verbindung zu Servern von Google oder anderen Schriftanbietern aufgebaut.</p>
<h2>WhatsApp</h2>
<p>Auf dieser Website verlinken wir auf WhatsApp. Der Knopf „WhatsApp öffnen“ und der QR-Code sind einfache Links; beim Aufruf unserer Seite werden keine Daten an WhatsApp übertragen. Erst wenn Sie den Link öffnen, wechseln Sie zu WhatsApp, einem Dienst der WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland. Wenn Sie uns dort schreiben, verarbeiten wir Ihre Nachricht und Ihre Telefonnummer, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO). WhatsApp verarbeitet dabei Daten auch selbst, unter Umständen auch in den USA; es gilt die Datenschutzerklärung von WhatsApp. Wenn Sie das nicht möchten, erreichen Sie uns telefonisch oder im Laden.</p>
<h2>Google Maps</h2>
<p>Der Link „Route in Google Maps“ führt zu Google. Erst wenn Sie ihn anklicken, werden Daten an Google übertragen.</p>
<h2>Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (in Niedersachsen: Die Landesbeauftragte für den Datenschutz Niedersachsen).</p>
""", robots='<meta name="robots" content="noindex">\n', cta=False)

urls = ["", "preisliste.html", "leistungen.html", "hemden-anzuege.html", "gardinenservice.html", "teppichreinigung.html"]
(OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{DOMAIN}/{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
print("✓ sitemap.xml, robots.txt")
