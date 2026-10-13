# Tayfun-Logo, Buchstabe für Buchstabe nach dem Ladenschild An der Kirche 10 nachgezeichnet.
# Keine Schrift nötig: alles sind Flächen (SVG-Pfade). Wird von seiten.py und marke/_werkzeug genutzt.
#
# Aufbau des Schildes (Maße im Rahmen 1355 × 325):
#   Kreis mit zwei versetzten „T“ links, rechts „TAYFUN“ (breit, fett) über „TEXTILPFLEGE“ (breit, dünn),
#   beide Zeilen gleich breit.

def _r(x, y, w, h):
    return f"M{x:g} {y:g}h{w:g}v{h:g}h{-w:g}Z"

# ---------------------------------------------------------------- TAYFUN (Höhe 100)
TAYFUN_PARTS = [
    # T
    _r(0, 0, 112.7, 26), _r(44, 25, 32, 75),
    # A: breit, oben abgeflacht, dreieckiges Innenloch, Querbalken, unten offen
    "M84 100L148 0H182L226 100H190L179.9 77H134.7L120 100Z M161.5 35.2L174.2 64H143Z",
    # Y: senkrechter Strich rechts, schräger Arm von links oben
    _r(258, 0, 32, 100), "M206 0H242L259 45V85Z",
    # F
    _r(303, 0, 107, 26), _r(303, 25, 32, 75), _r(334, 39, 71, 23),
    # U: kantig mit gerundeten unteren Ecken
    "M428 0H460V68Q460 74 466 74H497Q503 74 503 68V0H535V84Q535 100 519 100H444Q428 100 428 84Z",
    # N
    "M558 100V0H596L659 72V0H691V100H653L590 28V100Z",
]
TAYFUN = "".join(f'<path d="{d}" fill-rule="evenodd"/>' for d in TAYFUN_PARTS)
TAYFUN_W = 691

# ---------------------------------------------------------------- TEXTILPFLEGE (Höhe 100, Strich 15)
T = 17
def _letters():
    x = 0
    L = {}
    L["T"] = (120, [_r(0, 0, 120, T), _r((120 - T) / 2, 0, T, 100)])
    L["E"] = (104, [_r(0, 0, T, 100), _r(0, 0, 104, T), _r(0, 50 - T / 2, 96, T), _r(0, 100 - T, 104, T)])
    L["X"] = (125, ["M0 0H30L125 100H95Z", "M95 0H125L30 100H0Z"])
    L["I"] = (15, [_r(0, 0, T, 100)])
    L["L"] = (96, [_r(0, 0, T, 100), _r(0, 100 - T, 96, T)])
    L["P"] = (112, [_r(0, 0, T, 100), f"M0 0H90Q112 0 112 22V36Q112 58 90 58H0Z M{T} {T}V{58-T}H88Q{112-T} {58-T} {112-T} {58-T-6}V{T+6}Q{112-T} {T} 88 {T}Z"])
    L["F"] = (98, [_r(0, 0, T, 100), _r(0, 0, 98, T), _r(0, 48 - T / 2, 88, T)])
    L["G"] = (128, [f"M20 0H128V{T}H26Q{T} {T} {T} 26V74Q{T} {100-T} 26 {100-T}H102Q{128-T} {100-T} {128-T} 74V{60}H66V{60-T}H128V80Q128 100 108 100H20Q0 100 0 80V20Q0 0 20 0Z"])
    groups = []
    for ch in "TEXTILPFLEGE":
        w, parts = L[ch]
        groups.append(f'<g transform="translate({x:g} 0)">' + "".join(f'<path d="{d}" fill-rule="evenodd"/>' for d in parts) + "</g>")
        x += w + 44
    return "".join(groups), x - 44
TEXTIL, TEXTIL_W = _letters()

# ---------------------------------------------------------------- Monogramm: Kreis mit zwei versetzten T (Rahmen 100 × 100)
MONO = ('<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.6"/>'
        '<path d="M18 20h35v9H18Z M28 29H38V76H48V84H37Q28 84 28 75Z M45 31h40v8.5H45Z M63 39.5H73V75Q73 84 64 84H53V76H63Z"/>')

def body():
    """Inhalt im Rahmen 1355 × 325, Farbe über currentColor."""
    sx = 920 / TAYFUN_W          # TAYFUN auf 920 breit, 125 hoch (breiter als hoch, wie auf dem Schild)
    st = 920 / TEXTIL_W          # TEXTILPFLEGE gleich breit
    return (f'<g fill="currentColor">'
            f'<g transform="translate(62 72) scale(2.565)">{MONO}</g>'
            f'<g transform="translate(372 70) scale({sx:.4f} 1.25)">{TAYFUN}</g>'
            f'<g transform="translate(374 220) scale({st:.4f} 0.64)">{TEXTIL}</g>'
            f'</g>')

def svg(variant="inline", label=True):
    """inline: nur Schriftzug (für die Website, Farbe vom Text); rot: weiß auf rotem Feld; weiss: rot, transparent."""
    aria = ' role="img" aria-label="Tayfun Textilpflege"' if label else ' aria-hidden="true"'
    if variant == "inline":
        return f'<svg viewBox="52 60 1252 258"{aria} xmlns="http://www.w3.org/2000/svg">{body()}</svg>'
    if variant == "rot":
        return (f'<svg viewBox="0 0 1355 325" width="1355" height="325"{aria} xmlns="http://www.w3.org/2000/svg">'
                f'<rect width="1355" height="325" fill="#D7262E"/><g style="color:#FFFFFF">{body()}</g></svg>')
    if variant == "weiss":
        return (f'<svg viewBox="52 60 1252 258" width="1252" height="258"{aria} xmlns="http://www.w3.org/2000/svg">'
                f'<g style="color:#D7262E">{body()}</g></svg>')
    if variant == "negativ":
        return (f'<svg viewBox="52 60 1252 258" width="1252" height="258"{aria} xmlns="http://www.w3.org/2000/svg">'
                f'<g style="color:#FFFFFF">{body()}</g></svg>')
    raise ValueError(variant)

def mono_svg(bg=None, fg="currentColor", size=None):
    rect = f'<rect width="120" height="120" fill="{bg}"/>' if bg else ""
    wh = f' width="{size}" height="{size}"' if size else ""
    return (f'<svg viewBox="0 0 120 120"{wh} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">{rect}'
            f'<g transform="translate(10 10)" style="color:{fg}" fill="currentColor">{MONO}</g></svg>')
