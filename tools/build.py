"""Genera index.html y proyectos/*.html a partir de tools/projects.json.

Uso, desde la carpeta de la web:

    python tools/build.py

Para cambiar un texto, un título o la foto de portada, edita projects.json y
vuelve a ejecutarlo. Esta carpeta tools/ no hace falta subirla al hosting.
"""
import json
from collections import Counter
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = "20261106"
EMAIL = "aerografiachus@gmail.com"
BLOG = "https://aerografiachus.blogspot.com/"
SITE = "Aerografía Chus"
LEMA = "Cualquier cosa es susceptible de ser dibujada."
HERO = (50, 3)  # proyecto y foto del inicio: la Lambretta completa

CATS = {"moto": "Moto", "rally": "Rally", "karting": "Karting", "ski": "Ski", "otros": "Otros"}
CAT_LONG = {"moto": "Moto", "rally": "Rally", "karting": "Karting", "ski": "Ski", "otros": "Otros soportes"}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]

projects = json.loads((ROOT / "tools" / "projects.json").read_text(encoding="utf-8"))
total_fotos = sum(len(p["images"]) for p in projects)
years = sorted(p["date"][:4] for p in projects)
periodo = f"{years[0]}–{years[-1]}"


def num(p):
    return f"{p['n']:03d}"


def img_path(p, k, small=False):
    return f"assets/img/{num(p)}/{k:02d}{'-s' if small else ''}.webp"


def image(p, k):
    return next(i for i in p["images"] if i["k"] == k)


def fecha(p):
    y, m, _ = p["date"].split("-")
    mes = MESES[int(m) - 1]
    return f"{mes.capitalize()} de {y}"


def head(title, desc, root=""):
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title>
<meta name="description" content="{escape(desc, quote=True)}">
<meta property="og:title" content="{escape(title, quote=True)}">
<meta property="og:description" content="{escape(desc, quote=True)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta name="theme-color" content="#e7e7e4">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{root}assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{root}assets/favicon-180.png">
<link rel="stylesheet" href="{root}styles.css?v={VERSION}">
<script>document.documentElement.classList.add("js");addEventListener("pagereveal",function(e){{var t=e.viewTransition;if(t){{t.ready.catch(function(){{}});t.finished.catch(function(){{}})}}}})</script>
<script defer src="{root}main.js?v={VERSION}"></script>
"""


def nav(root="", home=True):
    pre = "" if home else f"{root}index.html"
    return f"""<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="nav">
  <a class="nav__brand" href="{root}index.html"><img src="{root}assets/logo.webp" alt="{SITE}" width="312" height="73"></a>
  <nav class="nav__links" aria-label="Principal">
    <a href="{pre}#proyectos">Proyectos</a>
    <a href="{pre}#sobre">Sobre</a>
    <a href="{pre}#contacto">Contacto</a>
  </nav>
</header>
"""


def footer(root=""):
    return f"""<footer class="foot">
  <img src="{root}assets/logo.webp" alt="{SITE}" width="312" height="73" loading="lazy">
  <p class="mono"><a class="link" href="{BLOG}" rel="noopener">Archivo original en Blogger</a></p>
</footer>
"""


def mailto():
    return f"mailto:{EMAIL}?subject=Consulta%20de%20aerograf%C3%ADa"


def tile(p):
    cover = image(p, p["cover"])
    others = [i["k"] for i in p["images"] if i["k"] != p["cover"]]
    alt_attr = ""
    if others:
        after = [k for k in others if k > p["cover"]]
        second = after[0] if after else others[0]
        alt_attr = f' data-alt="{img_path(p, second, True)}"'
    return f"""      <li class="tile" data-cat="{p['cat']}"{alt_attr}>
        <a href="proyectos/{p['slug']}.html">
          <span class="tile__media" style="background:{cover['c']}"><img src="{img_path(p, p['cover'], True)}" alt="{escape(p['title'], quote=True)}" width="{cover['w']}" height="{cover['h']}" loading="lazy" decoding="async" style="view-transition-name:p{num(p)}"></span>
          <span class="tile__cap"><span class="tile__meta mono">{num(p)} · {p['date'][:4]}</span><span class="tile__title">{escape(p['title'])}</span></span>
        </a>
      </li>"""


def build_index():
    counts = Counter(p["cat"] for p in projects)
    buttons = [f'<button type="button" data-cat="todos" aria-pressed="true">Todos<sup>{len(projects)}</sup></button>']
    buttons += [f'<button type="button" data-cat="{c}" aria-pressed="false">{label}<sup>{counts[c]}</sup></button>'
                for c, label in CATS.items()]
    hero = next(p for p in projects if p["n"] == HERO[0])
    hero_img = image(hero, HERO[1])
    tiles = "\n".join(tile(p) for p in sorted(projects, key=lambda p: -p["n"]))
    desc = (f"{len(projects)} proyectos de aerografía sobre cascos de moto, rally, karting y ski, "
            "guitarras, bicicletas, motos y lienzos.")
    html = head(f"{SITE}: proyectos de aerografía", desc) + f"""<link rel="preload" as="image" href="{img_path(hero, HERO[1])}" fetchpriority="high">
</head>
<body>
{nav()}
<main id="contenido">
  <section class="hero">
    <div class="hero__text">
      <p class="hero__meta mono">Aerografía · {periodo}</p>
      <div>
        <h1>{LEMA}</h1>
        <a class="hero__cta link" href="#proyectos">Ver los {len(projects)} proyectos</a>
      </div>
    </div>
    <figure class="hero__art" data-spray>
      <img src="{img_path(hero, HERO[1])}" alt="Lambretta completa en verde y plata, con el número 23 aerografiado" width="{hero_img['w']}" height="{hero_img['h']}" fetchpriority="high" decoding="async">
      <canvas aria-hidden="true"></canvas>
    </figure>
  </section>

  <section class="section" id="proyectos">
    <div class="section__head">
      <h2>Proyectos</h2>
      <div class="filters" data-filters role="group" aria-label="Filtrar por tipo">
        {' '.join(buttons)}
      </div>
    </div>
    <ul class="grid">
{tiles}
    </ul>
  </section>

  <section class="section about" id="sobre">
    <h2>Sobre</h2>
    <div>
      <p class="about__lead">Un archivo de los proyectos realizados en aerografía por Chus. Cascos de moto, rally, karting y ski, y también guitarras, bicicletas, lienzos, una careta de soldar o la tapa de una rueda de repuesto.</p>
      <dl class="stats">
        <div><dt class="mono">Proyectos</dt><dd>{len(projects)}</dd></div>
        <div><dt class="mono">Fotografías</dt><dd>{total_fotos}</dd></div>
        <div><dt class="mono">Periodo</dt><dd>{periodo}</dd></div>
      </dl>
    </div>
  </section>

  <section class="section contact" id="contacto">
    <p>Si te interesa aerografiar algo, escribe. Si tienes una idea, un diseño o simplemente una duda, no dudes en consultarlo.</p>
    <a class="contact__mail" href="{mailto()}">{EMAIL}</a>
  </section>
</main>
{footer()}</body>
</html>
"""
    (ROOT / "index.html").write_text(html, encoding="utf-8")


def build_project(i, ordered):
    p = ordered[i]
    newer = ordered[(i - 1) % len(ordered)]
    older = ordered[(i + 1) % len(ordered)]
    root = "../"
    total = len(p["images"])
    lead = image(p, p["cover"])
    rest = [im for im in p["images"] if im["k"] != p["cover"]]
    title = escape(p["title"])
    alt = escape(p["title"], quote=True)

    # El número de foto del texto alternativo sigue el orden en que se muestran
    shots = []
    for pos, im in enumerate(rest, 2):
        shots.append(
            f'      <a class="shot" href="{root}{img_path(p, im["k"])}" data-lb style="background:{im["c"]}">'
            f'<img src="{root}{img_path(p, im["k"], True)}" alt="{alt}, foto {pos} de {total}" '
            f'width="{im["w"]}" height="{im["h"]}" loading="lazy" decoding="async"></a>'
        )
    grid = f'\n    <div class="work__grid">\n' + "\n".join(shots) + "\n    </div>" if shots else ""
    kicker = f'\n    <p class="work__kicker mono">{escape(p["kicker"])}</p>' if p.get("kicker") else ""
    paras = "".join(f"<p>{escape(t)}</p>" for t in p["text"])
    text = f'\n    <div class="work__text">{paras}</div>' if paras else ""
    desc = p["text"][0] if p["text"] else f"Proyecto de aerografía {num(p)}, {fecha(p).lower()}."
    foto = "fotografía" if total == 1 else "fotografías"

    html = head(f"{p['title']} · {SITE}", desc, root) + f"""</head>
<body>
{nav(root, home=False)}
<main class="work" id="contenido">
  <header class="work__head">
    <p class="work__meta mono"><span>{num(p)}</span><span>{fecha(p)}</span><a class="link" href="{root}index.html#{p['cat']}">{CAT_LONG[p['cat']]}</a></p>{kicker}
    <h1>{title}</h1>{text}
    <p class="work__count mono">{total} {foto}</p>
  </header>
  <div class="work__photos">
    <a class="shot shot--lead" href="{root}{img_path(p, p['cover'])}" data-lb style="--w:{lead['w']};background:{lead['c']}"><img src="{root}{img_path(p, p['cover'])}" alt="{alt}, foto 1 de {total}" width="{lead['w']}" height="{lead['h']}" fetchpriority="high" decoding="async" style="view-transition-name:p{num(p)}"></a>{grid}
  </div>
</main>
<nav class="pager" aria-label="Otros proyectos">
  <a href="{newer['slug']}.html"><span class="mono">Anterior · {num(newer)}</span><strong>{escape(newer['title'])}</strong></a>
  <a href="{older['slug']}.html"><span class="mono">Siguiente · {num(older)}</span><strong>{escape(older['title'])}</strong></a>
</nav>
{footer(root)}</body>
</html>
"""
    (ROOT / "proyectos" / f"{p['slug']}.html").write_text(html, encoding="utf-8")


def main():
    (ROOT / "proyectos").mkdir(exist_ok=True)
    build_index()
    ordered = sorted(projects, key=lambda p: -p["n"])
    for i in range(len(ordered)):
        build_project(i, ordered)
    print(f"{len(projects)} proyectos, {total_fotos} fotos")


if __name__ == "__main__":
    main()
