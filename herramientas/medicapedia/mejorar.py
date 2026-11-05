"""Mejoras de Medicapedia del 5 nov 2026 sobre una copia de la web publicada.
Uso: python3 -I mejorar.py <antes> <despues> <datos>
  antes:   copia completa de public_html
  despues: salida (solo los archivos que cambian o son nuevos)
  datos:   qids.json, afecciones.json, fotos-resultado.json, fotos/, hermanas/ (opcionales los tres últimos)
Cambios:
 1. Confianza: recuadro de fuentes con fecha de actualización, responsable y enlace a «Cómo se hace» (metodologia.html, nueva en es/en/ca).
 2. Datos estructurados JSON-LD (Article/MedicalWebPage + about Person/MedicalCondition/Drug/Hospital, BreadcrumbList, WebSite en portada).
 3. Webs hermanas en el HTML del pie y enlace de ficha a ficha (famosos y médicos) cuando la persona existe en la web hermana.
 4. Famosos <-> enfermedades (Wikidata P1050 y P509) y famosos nuevos en Épocas.
 5. Fotos alojadas en img/ para las fichas principales (retrato y og:image).
"""
import os, re, sys, json, html, shutil, unicodedata, collections

A, B, D = sys.argv[1:4]
HOY = '2026-11-05'
DOM = 'https://medicapedia.org/'
V = '20261105'
LS = ('es', 'en', 'ca')

T = {
 'es': dict(fuentes='Fuentes', act='Última actualización: 5 de noviembre de 2026', como='Cómo se hace Medicapedia',
            resp='Proyecto de <a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, médico de familia y especialista en medicina preventiva y salud pública.',
            error='¿Has visto un error? Escríbenos a <a href="mailto:info@medicapedia.org">info@medicapedia.org</a>.',
            img='Imagen: Wikimedia Commons', famosos_enf='Personajes famosos que la padecieron', mas='Más sobre', ver_todos='y {n} más',
            hermanas='Webs hermanas', tambien='También en', inicio='Inicio',
            hermanas_txt={'classicapedia.com': 'su música en Classicapedia', 'pinacopedia.com': 'su pintura en Pinacopedia', 'filopedia.com': 'su obra en Filopedia',
                          'cinematopedia.com': 'su carrera en Cinematopedia', 'newtonpedia.com': 'su ciencia en Newtonpedia'}),
 'en': dict(fuentes='Sources', act='Last updated: 5 November 2026', como='How Medicapedia is made',
            resp='A project by <a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, family physician and specialist in preventive medicine and public health.',
            error='Spotted a mistake? Write to <a href="mailto:info@medicapedia.org">info@medicapedia.org</a>.',
            img='Image: Wikimedia Commons', famosos_enf='Famous people who had it', mas='More about', ver_todos='and {n} more',
            hermanas='Sister sites', tambien='Also on', inicio='Home',
            hermanas_txt={'classicapedia.com': 'their music on Classicapedia', 'pinacopedia.com': 'their painting on Pinacopedia', 'filopedia.com': 'their work on Filopedia',
                          'cinematopedia.com': 'their career on Cinematopedia', 'newtonpedia.com': 'their science on Newtonpedia'}),
 'ca': dict(fuentes='Fonts', act='Darrera actualització: 5 de novembre de 2026', como='Com es fa Medicapedia',
            resp='Projecte d\'<a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, metge de família i especialista en medicina preventiva i salut pública.',
            error='Has vist un error? Escriu-nos a <a href="mailto:info@medicapedia.org">info@medicapedia.org</a>.',
            img='Imatge: Wikimedia Commons', famosos_enf='Personatges famosos que la van patir', mas='Més sobre', ver_todos='i {n} més',
            hermanas='Webs germanes', tambien='També a', inicio='Inici',
            hermanas_txt={'classicapedia.com': 'la seva música a Classicapedia', 'pinacopedia.com': 'la seva pintura a Pinacopedia', 'filopedia.com': 'la seva obra a Filopedia',
                          'cinematopedia.com': 'la seva carrera a Cinematopedia', 'newtonpedia.com': 'la seva ciència a Newtonpedia'}),
}

METODO = {
 'es': ('Cómo se hace Medicapedia', 'Cómo se elaboran los textos de Medicapedia, de dónde salen los datos y las imágenes, y cómo corregimos los errores.', '''
<p>Medicapedia es una enciclopedia de <strong>historia</strong> de la medicina. No da consejo médico ni sustituye la consulta con un profesional sanitario.</p>
<h2>De dónde salen los datos</h2>
<p>Las fechas, los lugares, los premios, las relaciones entre maestros y discípulos y las enfermedades registradas de cada personaje proceden de <a href="https://www.wikidata.org/">Wikidata</a>, una base de datos abierta. Los textos se apoyan en los artículos de Wikipedia en castellano y en inglés. Cada ficha enlaza al final a las fuentes concretas que se han usado.</p>
<h2>Cómo se redactan los textos</h2>
<p>Los textos son originales: se han redactado para esta web a partir de esas fuentes, con ayuda de inteligencia artificial y con instrucciones precisas de rigor. Después se comprueban de forma automática las fechas y los datos principales con Wikidata, y se descartan las fichas que no cuadran.</p>
<h2>Enfermedades de personajes famosos</h2>
<ul><li>Solo se incluyen <strong>personas fallecidas</strong>.</li><li>Los diagnósticos hechos a posteriori se presentan como hipótesis, señalando cuándo son discutidos.</li><li>Se evita el sensacionalismo: interesa cómo se vivía y se trataba la enfermedad en su época y cómo influyó en su vida y su obra.</li></ul>
<h2>Fármacos</h2>
<p>De cada fármaco se cuenta su historia: quién lo descubrió, de dónde salió y qué cambió. Nunca se dan dosis ni indicaciones de uso.</p>
<h2>Imágenes</h2>
<p>Las imágenes proceden de Wikimedia Commons, con su licencia y su autor en la página de cada archivo, enlazada bajo cada imagen.</p>
<h2>Quién está detrás</h2>
<p>Medicapedia es un proyecto personal y sin ánimo de lucro de <a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, médico de familia y especialista en medicina preventiva y salud pública.</p>
<h2>Correcciones</h2>
<p>Si encuentras un error, escríbenos a <a href="mailto:info@medicapedia.org">info@medicapedia.org</a> indicando la página. Lo revisamos y lo corregimos.</p>
<p class="nota">Última actualización: 5 de noviembre de 2026.</p>'''),
 'en': ('How Medicapedia is made', 'How Medicapedia texts are written, where the data and images come from, and how we correct mistakes.', '''
<p>Medicapedia is an encyclopedia of the <strong>history</strong> of medicine. It does not give medical advice and is no substitute for seeing a health professional.</p>
<h2>Where the data comes from</h2>
<p>Dates, places, awards, teacher–pupil relationships and the recorded illnesses of each person come from <a href="https://www.wikidata.org/">Wikidata</a>, an open database. The texts draw on the Spanish and English Wikipedia articles. Each entry links at the end to the specific sources used.</p>
<h2>How the texts are written</h2>
<p>The texts are original: they were written for this site from those sources, with the help of artificial intelligence and precise instructions on accuracy. Dates and key facts are then checked automatically against Wikidata, and entries that do not match are discarded.</p>
<h2>Illnesses of famous people</h2>
<ul><li>Only <strong>deceased people</strong> are included.</li><li>Retrospective diagnoses are presented as hypotheses, noting when they are disputed.</li><li>We avoid sensationalism: the focus is on how the illness was lived with and treated at the time and how it shaped the person's life and work.</li></ul>
<h2>Drugs</h2>
<p>For each drug we tell its history: who discovered it, where it came from and what it changed. Doses and indications are never given.</p>
<h2>Images</h2>
<p>Images come from Wikimedia Commons; the licence and author are on each file's page, linked below each image.</p>
<h2>Who is behind it</h2>
<p>Medicapedia is a personal, non-profit project by <a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, family physician and specialist in preventive medicine and public health.</p>
<h2>Corrections</h2>
<p>If you find a mistake, write to <a href="mailto:info@medicapedia.org">info@medicapedia.org</a> with the page. We review and correct it.</p>
<p class="nota">Last updated: 5 November 2026.</p>'''),
 'ca': ('Com es fa Medicapedia', 'Com s\'elaboren els textos de Medicapedia, d\'on surten les dades i les imatges, i com corregim els errors.', '''
<p>Medicapedia és una enciclopèdia d'<strong>història</strong> de la medicina. No dona consell mèdic ni substitueix la consulta amb un professional sanitari.</p>
<h2>D'on surten les dades</h2>
<p>Les dates, els llocs, els premis, les relacions entre mestres i deixebles i les malalties registrades de cada personatge provenen de <a href="https://www.wikidata.org/">Wikidata</a>, una base de dades oberta. Els textos es basen en els articles de la Viquipèdia en castellà i en anglès. Cada fitxa enllaça al final a les fonts concretes que s'han fet servir.</p>
<h2>Com es redacten els textos</h2>
<p>Els textos són originals: s'han redactat per a aquest web a partir d'aquestes fonts, amb ajuda d'intel·ligència artificial i amb instruccions precises de rigor. Després es comproven automàticament les dates i les dades principals amb Wikidata, i es descarten les fitxes que no quadren.</p>
<h2>Malalties de personatges famosos</h2>
<ul><li>Només s'hi inclouen <strong>persones mortes</strong>.</li><li>Els diagnòstics fets a posteriori es presenten com a hipòtesis, i s'indica quan són discutits.</li><li>S'evita el sensacionalisme: interessa com es vivia i es tractava la malaltia a la seva època i com va influir en la seva vida i la seva obra.</li></ul>
<h2>Fàrmacs</h2>
<p>De cada fàrmac se n'explica la història: qui el va descobrir, d'on va sortir i què va canviar. Mai no s'hi donen dosis ni indicacions d'ús.</p>
<h2>Imatges</h2>
<p>Les imatges provenen de Wikimedia Commons, amb la seva llicència i el seu autor a la pàgina de cada fitxer, enllaçada sota cada imatge.</p>
<h2>Qui hi ha al darrere</h2>
<p>Medicapedia és un projecte personal i sense ànim de lucre d'<a href="{r}sobre.html">Alejandro Rosàs Navarro</a>, metge de família i especialista en medicina preventiva i salut pública.</p>
<h2>Correccions</h2>
<p>Si trobes un error, escriu-nos a <a href="mailto:info@medicapedia.org">info@medicapedia.org</a> indicant la pàgina. El revisem i el corregim.</p>
<p class="nota">Darrera actualització: 5 de novembre de 2026.</p>'''),
}

WEBS = ['classicapedia.com', 'pinacopedia.com', 'filopedia.com', 'cinematopedia.com', 'medicapedia.org', 'tenispedia.com', 'newtonpedia.com', 'culinapedia.com', 'mythicapedia.com']  # zodiacopedia queda aparte de medicapedia

CSS = '''
/* mejoras 2026-11-05 */
.fuentes{margin:2em 0 0;padding:1em 1.2em;border:1px solid rgba(127,127,127,.3);border-radius:10px;font-size:.92em}
.fuentes h2{font-size:1.05em;margin:0 0 .4em}
.fuentes ul{margin:.2em 0 .6em;padding-left:1.2em}
.fuentes p{margin:.3em 0}
.enf-links,.hermana{margin:.4em 0;font-size:.95em}
.relacionados .personas{margin-top:.6em}
'''

def e(s): return html.escape(str(s or ''), quote=True)
def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

os.makedirs(D, exist_ok=True)
if not os.path.exists(f'{D}/qids.json'):   # QID de Wikidata de cada ficha, sacado de la propia web
    qids = {}
    for car in ('ec', 'enf', 'ep'):
        qids[car] = {}
        for f in os.listdir(f'{A}/{car}'):
            m = re.search(r'wikidata\.org/wiki/(Q\d+)', open(f'{A}/{car}/{f}', encoding='utf-8').read())
            if m: qids[car][f[:-5]] = m.group(1)
    json.dump(qids, open(f'{D}/qids.json', 'w'))
qids = json.load(open(f'{D}/qids.json'))
if not os.path.exists(f'{D}/afecciones.json'):   # Wikidata: afección (P1050) y causa de muerte (P509) de los famosos
    import urllib.request, urllib.parse
    res, ecq = [], list(qids['ec'].values())
    for i in range(0, len(ecq), 250):
        vals = ' '.join('wd:' + x for x in ecq[i:i + 250])
        sp = f'SELECT ?p ?prop ?d WHERE {{ VALUES ?p {{{vals}}} VALUES ?prop {{wdt:P1050 wdt:P509}} ?p ?prop ?d }}'
        rq = urllib.request.Request('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': sp, 'format': 'json'}), headers={'User-Agent': 'MedicapediaBot/1.0 (info@medicapedia.org)'})
        import time
        for intento in range(6):
            try: datos = json.load(urllib.request.urlopen(rq, timeout=180)); break
            except Exception: time.sleep(20 * (intento + 1))
        else: raise SystemExit('Wikidata no responde; vuelve a lanzarlo más tarde')
        for b in datos['results']['bindings']:
            res.append([b['p']['value'].rsplit('/', 1)[1], b['prop']['value'].rsplit('/', 1)[1], b['d']['value'].rsplit('/', 1)[1]])
    json.dump(res, open(f'{D}/afecciones.json', 'w'))
afec = json.load(open(f'{D}/afecciones.json'))
fotos = json.load(open(f'{D}/fotos-resultado.json')) if os.path.exists(f'{D}/fotos-resultado.json') else {}
fotos = {k: v for k, v in fotos.items() if v and os.path.exists(f'{D}/{v}')}

def leer(r): return open(f'{A}/{r}', encoding='utf-8').read()
def lang_of(r): return r.split('/', 1)[0] if r.split('/', 1)[0] in ('en', 'ca') else 'es'
def sin_lang(r): return r.split('/', 1)[1] if lang_of(r) != 'es' else r

# ---------- datos de las fichas en los tres idiomas (nombre, fechas, imagen, época)
import functools
@functools.lru_cache(maxsize=None)
def info(l, car, s):
    r = f'{"" if l == "es" else l + "/"}{car}/{s}.html'
    if not os.path.exists(f'{A}/{r}'): return None
    t = leer(r)
    h1 = re.search(r'<h1>(.*?)</h1>', t); sub = re.search(r'<p class="sub">(.*?)</p>', t)
    img = re.search(r'<figure class="retrato"><img src="([^"]+)"', t)
    ep = re.search(r'<a class="chip" href="\.\./e/([a-z-]+)\.html">', t)
    fech = re.match(r'([^·]*\d[^·]*?)\s*·', html.unescape(sub.group(1))) if sub else None
    return dict(n=html.unescape(h1.group(1)) if h1 else s, sub=html.unescape(sub.group(1)) if sub else '', img=img.group(1) if img else '',
                epoca=ep.group(1) if ep else None, fechas=fech.group(1).strip() if fech else '')

# famosos <-> enfermedades
q2 = {}
for car in ('enf', 'ep'):
    for s, q in qids[car].items(): q2.setdefault(q, (car, s))
ec_q = {q: s for s, q in qids['ec'].items()}
fam_enf = collections.defaultdict(list); enf_fam = collections.defaultdict(list)
for p, prop, d in afec:
    if d in q2 and p in ec_q:
        s = ec_q[p]
        if q2[d] not in fam_enf[s]: fam_enf[s].append(q2[d])
        if s not in enf_fam[q2[d]]: enf_fam[q2[d]].append(s)
# orden de fama de los famosos: número de Wikipedias (Wikidata), y si no, el de famosos.html
if not os.path.exists(f'{D}/fama.json'):
    import urllib.request, urllib.parse, time
    fama, ecq = {}, list(qids['ec'].values())
    for i in range(0, len(ecq), 250):
        vals = ' '.join('wd:' + x for x in ecq[i:i + 250])
        sp = f'SELECT ?p ?n WHERE {{ VALUES ?p {{{vals}}} ?p wikibase:sitelinks ?n }}'
        rq = urllib.request.Request('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': sp, 'format': 'json'}), headers={'User-Agent': 'MedicapediaBot/1.0 (info@medicapedia.org)'})
        for intento in range(6):
            try: datos = json.load(urllib.request.urlopen(rq, timeout=180)); break
            except Exception: time.sleep(20 * (intento + 1))
        else: raise SystemExit('Wikidata no responde; vuelve a lanzarlo más tarde')
        for b in datos['results']['bindings']: fama[b['p']['value'].rsplit('/', 1)[1]] = int(b['n']['value'])
    json.dump(fama, open(f'{D}/fama.json', 'w'))
fama = json.load(open(f'{D}/fama.json'))
orden_ec = {}
for m in re.finditer(r'href="ec/([^"]+)\.html"', leer('famosos.html')): orden_ec.setdefault(m.group(1), len(orden_ec))
orden_ec = {s: (-fama.get(q, 0), orden_ec.get(s, 99999)) for s, q in qids['ec'].items()}
for k in enf_fam: enf_fam[k].sort(key=lambda s: orden_ec.get(s, (0, 99999)))

# ---------- webs hermanas: ficha a ficha (solo si el sitemap trae la página y el oficio encaja)
HERM = {  # dominio: (carpeta de personas, palabras de oficio en el subtítulo en castellano)
 'classicapedia.com': ('b', r'compositor|músic|pianista|violinista|cantante|director de orquesta|organista|violonchelista|soprano|tenor|barítono'),
 'pinacopedia.com': ('b', r'pintor|pintora|escultor|grabador|dibujante|artista|ilustrador'),
 'filopedia.com': ('a', r'filósof|escritor|escritora|poeta|novelista|dramaturgo|ensayista|psicólog|psicoanalista|pensador|teólogo'),
 'cinematopedia.com': ('n', r'actor|actriz|cineasta|director de cine|directora de cine|guionista'),
 'newtonpedia.com': ('p', r'físic|químic|matemátic|astrónom|biólog|inventor|ingenier|naturalista|científic|botánic|fisiólog|bacteriólog|bioquímic|genetista'),
}
herm_urls = {}
for dom in HERM:
    urls = set(); base = f'{D}/hermanas/{dom}'
    if os.path.isdir(base):
        for f in os.listdir(base):
            urls.update(re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', open(f'{base}/{f}', encoding='utf-8', errors='ignore').read()))
    herm_urls[dom] = urls
def hermana(car, s, sub_es):
    """devuelve [(dominio, ruta_es, ruta_en)] de las webs hermanas con la misma persona"""
    out = []
    for dom, (carp, pat) in HERM.items():
        if car == 'p' and dom != 'newtonpedia.com': continue
        if car == 'ec' and not re.search(pat, sub_es, re.I): continue
        u = f'https://{dom}/{carp}/{s}.html'
        if u in herm_urls[dom]:
            ue = f'https://{dom}/en/{carp}/{s}.html'
            out.append((dom, u, ue if ue in herm_urls[dom] else None))
    return out

# ---------- piezas comunes
def pie_familia(l, raiz):
    t = T[l]; partes = []
    for d in WEBS:
        if d == 'medicapedia.org': partes.append('<strong>medicapedia.org</strong>'); continue
        sub = 'en/' if l == 'en' else ''
        partes.append(f'<a href="https://{d}/{sub}">{d}</a>')
    partes.append('<a href="https://farmacos.ai/">farmacos.ai</a>')
    return f'<p class="familia">{t["hermanas"]}: ' + ' · '.join(partes) + '</p>'

def jsonld(obj): return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'

PUBLISHER = {'@type': 'Organization', '@id': DOM + '#org', 'name': 'Medicapedia', 'url': DOM, 'logo': DOM + 'assets/apple-touch-icon.png',
             'email': 'info@medicapedia.org', 'founder': {'@type': 'Person', 'name': 'Alejandro Rosàs Navarro', 'jobTitle': 'Médico de familia', 'url': DOM + 'sobre.html'}}

def miga(t, url, l, h1):
    m = re.search(r'<nav class="miga">(.*?)</nav>', t)
    if not m: return None
    items = []
    for i, (h, n) in enumerate(re.findall(r'<a href="([^"]+)">(.*?)</a>', m.group(1)), 1):
        items.append({'@type': 'ListItem', 'position': i, 'name': html.unescape(n), 'item': abs_url(url, h)})
    items.append({'@type': 'ListItem', 'position': len(items) + 1, 'name': h1, 'item': url})
    return {'@type': 'BreadcrumbList', 'itemListElement': items}

def abs_url(base, h):
    from urllib.parse import urljoin
    return urljoin(base, h)

TIPO_ABOUT = {'p': 'Person', 'ec': 'Person', 'enf': 'MedicalCondition', 'ep': 'Thing', 'f': 'Drug', 'h': 'Hospital', 'av': 'Thing', 'esp': 'MedicalSpecialty'}

def anyo_iso(x):
    x = x.strip()
    m = re.match(r'^(\d{3,4})$', x)
    return m.group(1).zfill(4) if m else None

# ---------- procesado
os.makedirs(B, exist_ok=True)
cambiados = 0
def escribir(r, t):
    global cambiados
    os.makedirs(os.path.dirname(f'{B}/{r}') or B, exist_ok=True)
    open(f'{B}/{r}', 'w', encoding='utf-8').write(t); cambiados += 1

def procesar(r):
    l = lang_of(r); t0 = leer(r); t = t0; tt = T[l]
    rel = sin_lang(r); car = rel.split('/')[0] if '/' in rel else ''
    s = rel.split('/')[-1][:-5]
    raiz = '../' * rel.count('/')           # al inicio del idioma
    url = re.search(r'<link rel="canonical" href="([^"]+)"', t)
    url = url.group(1) if url else DOM
    h1m = re.search(r'<h1>(.*?)</h1>', t); h1 = html.unescape(re.sub('<[^>]+>', '', h1m.group(1))) if h1m else 'Medicapedia'
    desc = re.search(r'<meta name="description" content="([^"]*)"', t); desc = html.unescape(desc.group(1)) if desc else ''
    ficha = '<article class="ficha">' in t and car in TIPO_ABOUT

    # 5. foto alojada
    clave = f'{car}/{s}'
    if ficha and clave in fotos:
        ext = os.path.splitext(fotos[clave])[1]
        local = f'img/{car}/{s}{ext}'
        t = re.sub(r'(<figure class="retrato"><img src=")[^"]+(")', lambda m: m.group(1) + ('../' * rel.count('/')) + ('../' if l != 'es' else '') + local + m.group(2), t, count=1)
        t = re.sub(r'(<meta property="og:image" content=")[^"]+(")', lambda m: m.group(1) + DOM + local + m.group(2), t, count=1)

    if ficha:
        # 1. recuadro de fuentes
        def fuentes(m):
            intro, enlaces = m.group(1), re.findall(r'<a href="[^"]+" rel="noopener">[^<]+</a>', m.group(0))
            img = re.search(r'<figcaption>Imag\w*: (<a href="[^"]+" rel="noopener">Wikimedia Commons</a>)</figcaption>', t)
            lis = ''.join(f'<li>{a}</li>' for a in enlaces) + (f'<li>{tt["img"].split(":")[0]}: {img.group(1)}</li>' if img else '')
            return (f'<section class="fuentes"><h2>{tt["fuentes"]}</h2><p>{intro.strip()}:</p><ul>{lis}</ul>'
                    f'<p>{tt["act"]} · <a href="{raiz}metodologia.html">{tt["como"]}</a></p>'
                    f'<p>{tt["resp"].format(r=raiz)} {tt["error"]}</p></section>')
        t = re.sub(r'<p class="nota">([^<]*?)<a href[\s\S]*?</p>(?=</div></article>)', fuentes, t, count=1)

        sub_es = info('es', car, s)['sub'] if car in ('ec', 'p') else ''
        # 4. famosos -> enfermedades
        if car == 'ec' and fam_enf.get(s):
            links = []
            for c2, s2 in fam_enf[s]:
                i2 = info(l, c2, s2)
                if i2: links.append(f'<a href="../{c2}/{s2}.html">{e(i2["n"])}</a>')
            if links:
                bloque = f'<p class="enf-links">{tt["mas"]}: ' + ', '.join(links) + '</p>'
                t = re.sub(r'(<p class="enf">.*?</p>)', lambda m: m.group(1) + bloque, t, count=1) if '<p class="enf">' in t else t.replace('<div class="chips">', bloque + '<div class="chips">', 1)
        # enfermedades -> famosos
        if car in ('enf', 'ep') and enf_fam.get((car, s)):
            lst = enf_fam[(car, s)]; cards = []
            for s2 in lst[:24]:
                i2 = info(l, 'ec', s2)
                if not i2: continue
                im = i2['img'].replace('?width=440', '?width=250') if i2['img'].startswith('http') else i2['img']
                cards.append(f'<a class="persona" href="../ec/{s2}.html"><img src="{e(im)}" alt="" loading="lazy"><b>{e(i2["n"])}</b><span>{e(i2["fechas"])}</span></a>')
            extra = ''
            if len(lst) > 24:
                resto = [f'<li><a href="../ec/{s2}.html">{e(info(l, "ec", s2)["n"])}</a></li>' for s2 in lst[24:] if info(l, 'ec', s2)]
                extra = '<ul class="lista">' + ''.join(resto) + '</ul>'
            sec = f'<section class="relacionados"><h2>{tt["famosos_enf"]} <span class="nota">{len(lst)}</span></h2><div class="personas">{"".join(cards)}</div>{extra}</section>'
            t = t.replace('<section class="fuentes">', sec + '<section class="fuentes">', 1) if '<section class="fuentes">' in t else t.replace('</div></article>', sec + '</div></article>', 1)
        # 3. ficha a ficha con las webs hermanas
        if car in ('ec', 'p'):
            hs = hermana(car, s, sub_es)
            if hs:
                links = []
                for dom, ues, uen in hs:
                    u = uen if (l == 'en' and uen) else ues
                    links.append(f'<a href="{u}">{tt["hermanas_txt"][dom]}</a>')
                bloque = f'<p class="hermana">{tt["tambien"]}: ' + ' · '.join(links) + '</p>'
                t = t.replace('<p class="compartir">', bloque + '<p class="compartir">', 1)

    # 4b. épocas: famosos nuevos
    if car == 'e' and s in EPOCA_FAM:
        t = epoca_famosos(t, l, s)

    # 3. pie: webs hermanas en HTML + enlace a «Cómo se hace»
    t = re.sub(r' · (?:Webs hermanas|Sister sites|Webs germanes|Webs germans): .*?</p>', '</p>', t, count=1)
    if '<p class="familia">' not in t:
        t = t.replace('</footer>', pie_familia(l, raiz) + '\n</footer>', 1)
    if 'metodologia.html">' not in t.split('<footer', 1)[-1]:
        t = re.sub(r'(<footer class="pie">[\s\S]*?<a href="[^"]*sobre\.html">[^<]*</a>)', lambda m: m.group(1) + f' · <a href="{raiz}metodologia.html">{tt["como"]}</a>', t, count=1)

    # 2. JSON-LD
    if 'application/ld+json' not in t:
        graf = []
        og = re.search(r'<meta property="og:image" content="([^"]+)"', t)
        if rel == 'index.html':
            graf += [PUBLISHER, {'@type': 'WebSite', '@id': DOM + '#web', 'url': url, 'name': 'Medicapedia', 'inLanguage': l, 'publisher': {'@id': DOM + '#org'},
                     'potentialAction': {'@type': 'SearchAction', 'target': url + 'explorar.html?q={q}', 'query-input': 'required name=q'}}]
        elif ficha:
            sames = [m for m in re.findall(r'<a href="(https://(?:www\.wikidata\.org|[a-z]+\.wikipedia\.org)/wiki/[^"]+)"', t)]
            about = {'@type': TIPO_ABOUT[car], 'name': h1}
            if sames: about['sameAs'] = sorted(set(sames))
            if og: about['image'] = og.group(1)
            if car in ('p', 'ec'):
                inf = info(l, car, s); fe = (inf or {}).get('fechas', '')
                pz = [x.strip() for x in re.split('–', fe)] if fe else []
                if pz and anyo_iso(pz[0]): about['birthDate'] = anyo_iso(pz[0])
                if len(pz) > 1 and anyo_iso(pz[1]): about['deathDate'] = anyo_iso(pz[1])
            if car == 'ec' and fam_enf.get(s):
                about['@type'] = 'Person'
            pagina = {'@type': 'MedicalWebPage' if car in ('enf', 'f') else 'Article', 'headline': h1, 'name': h1, 'description': desc, 'url': url,
                      'mainEntityOfPage': url, 'inLanguage': l, 'dateModified': HOY, 'isPartOf': {'@id': DOM + '#web'},
                      'author': {'@id': DOM + '#org'}, 'publisher': PUBLISHER, 'about': about}
            if og: pagina['image'] = og.group(1)
            if car == 'ec' and fam_enf.get(s):
                pagina['mentions'] = [{'@type': 'MedicalCondition', 'name': info(l, c2, s2)['n'], 'url': abs_url(url, f'../{c2}/{s2}.html')} for c2, s2 in fam_enf[s] if info(l, c2, s2)]
            if car == 'enf': pagina['audience'] = {'@type': 'Audience', 'audienceType': 'general public'}
            graf.append(pagina)
        else:
            graf.append({'@type': 'CollectionPage' if car in ('e', 'pa', 'cu') or rel in ('medicos.html', 'famosos.html', 'enfermedades.html', 'farmacos.html', 'centros.html', 'epidemias.html', 'especialidades.html', 'curiosidades.html') else 'WebPage',
                         'name': h1, 'description': desc, 'url': url, 'inLanguage': l, 'dateModified': HOY, 'isPartOf': {'@id': DOM + '#web'}, 'publisher': {'@id': DOM + '#org'}})
        b = miga(t, url, l, h1)
        if b: graf.append(b)
        t = t.replace('</head>', jsonld({'@context': 'https://schema.org', '@graph': graf}) + '\n</head>', 1)

    # css nuevo (versionado)
    t = re.sub(r'(href="[^"]*assets/estilo\.css)(\?v=[^"]*)?"', lambda m: m.group(1) + '?v=' + V + '"', t)
    if t != t0: escribir(r, t)

# épocas: famosos que faltan
EPOCA_FAM = collections.defaultdict(list)
for s in sorted(qids['ec'], key=lambda s: orden_ec.get(s, (0, 99999))):
    i = info('es', 'ec', s)
    if i and i['epoca']: EPOCA_FAM[i['epoca']].append(s)
def epoca_famosos(t, l, ep):
    m = re.search(r'(<section><h2>[^<]*<span class="nota">)([\d.,]+)(</span></h2><div class="personas">)([\s\S]*?)(</div>)(<ul class="lista">)?([\s\S]*?)(</ul>)?(</section>)', t)
    ya = set(re.findall(r'href="\.\./ec/([^"]+)\.html"', t))
    faltan = [s for s in EPOCA_FAM[ep] if s not in ya]
    if not faltan: return t
    lis = ''.join(f'<li><a href="../ec/{s}.html">{e(info(l, "ec", s)["n"])}</a> <span class="num">{e(info(l, "ec", s)["fechas"])}</span></li>' for s in faltan if info(l, 'ec', s))
    total = len(ya | set(faltan)); num = f'{total:,}'.replace(',', ',' if l == 'en' else '.')
    # localizar la sección de famosos: la que enlaza a ../ec/
    secs = list(re.finditer(r'<section><h2>[^<]*<span class="nota">[\d.,]+</span></h2>[\s\S]*?</section>', t))
    for sm in secs:
        if '../ec/' in sm.group(0):
            sec = sm.group(0)
            sec = re.sub(r'(<span class="nota">)[\d.,]+(</span>)', lambda x: x.group(1) + num + x.group(2), sec, count=1)
            sec = sec.replace('</ul></section>', lis + '</ul></section>') if '<ul class="lista">' in sec else sec.replace('</section>', f'<ul class="lista">{lis}</ul></section>')
            return t[:sm.start()] + sec + t[sm.end():]
    return t

todas = []
for raiz_, _, fs in os.walk(A):
    for f in fs:
        if f.endswith('.html'):
            todas.append(os.path.relpath(os.path.join(raiz_, f), A).replace(os.sep, '/'))
todas.sort()
for n, r in enumerate(todas, 1):
    procesar(r)
    if n % 3000 == 0: print(n, 'de', len(todas), flush=True)

# página nueva «Cómo se hace» a partir de sobre.html
for l in LS:
    pre = '' if l == 'es' else l + '/'
    t = leer(pre + 'sobre.html') if not os.path.exists(f'{B}/{pre}sobre.html') else open(f'{B}/{pre}sobre.html', encoding='utf-8').read()
    tit, des, cuerpo = METODO[l]
    url = DOM + pre + 'metodologia.html'
    t = re.sub(r'<title>.*?</title>', f'<title>{e(tit)} · Medicapedia</title>', t, count=1)
    t = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(des)}">', t, count=1)
    t = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(tit)}">', t, count=1)
    t = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(des)}">', t, count=1)
    t = t.replace('sobre.html"', 'metodologia.html"').replace('metodologia.html">' + ('Sobre Medicapedia' if l != 'en' else 'About Medicapedia'), 'sobre.html">' + ('Sobre Medicapedia' if l != 'en' else 'About Medicapedia'))
    t = re.sub(r'<script type="application/ld\+json">.*?</script>', jsonld({'@context': 'https://schema.org', '@graph': [
        {'@type': 'AboutPage', 'name': tit, 'description': des, 'url': url, 'inLanguage': l, 'dateModified': HOY, 'publisher': PUBLISHER}]}), t, count=1, flags=re.S)
    t = re.sub(r'<main>[\s\S]*?</main>', f'<main>\n<section class="hero texto"><h1>{e(tit)}</h1>{cuerpo.format(r="")}</section>\n</main>', t, count=1)
    escribir(pre + 'metodologia.html', t)

# sitemaps: lastmod y la página nueva
for f in ('sitemap-es.xml', 'sitemap-en.xml', 'sitemap-ca.xml', 'sitemap-nuevas.xml'):
    if not os.path.exists(f'{A}/{f}'): continue
    t = leer(f)
    t = re.sub(r'<url><loc>([^<]+)</loc>(?:<lastmod>[^<]*</lastmod>)?</url>', lambda m: f'<url><loc>{m.group(1)}</loc><lastmod>{HOY}</lastmod></url>', t)
    l = {'sitemap-es.xml': '', 'sitemap-en.xml': 'en/', 'sitemap-ca.xml': 'ca/'}.get(f)
    if l is not None and 'metodologia.html' not in t:
        t = t.replace('</urlset>', f'<url><loc>{DOM}{l}metodologia.html</loc><lastmod>{HOY}</lastmod></url>\n</urlset>')
    escribir(f, t)

# css
css = leer('assets/estilo.css')
if '/* mejoras 2026-11-05 */' not in css: escribir('assets/estilo.css', css + CSS)

# fotos
for k, v in fotos.items():
    car, s = k.split('/'); ext = os.path.splitext(v)[1]
    os.makedirs(f'{B}/img/{car}', exist_ok=True)
    destino = f'{B}/img/{car}/{s}{ext}'
    try:   # reducir a 600 px de ancho y comprimir; se mantiene el nombre (y la extensión) que usan las páginas
        from PIL import Image
        im = Image.open(f'{D}/{v}')
        if im.width > 600: im = im.resize((600, round(im.height * 600 / im.width)), Image.LANCZOS)
        if ext == '.jpg':
            if im.mode != 'RGB':
                fondo = Image.new('RGB', im.size, (255, 255, 255)); im = im.convert('RGBA'); fondo.paste(im, mask=im.split()[-1]); im = fondo
            im.save(destino, 'JPEG', quality=82, optimize=True, progressive=True)
        else:
            im.save(destino, 'PNG', optimize=True)
        if os.path.getsize(destino) > os.path.getsize(f'{D}/{v}'): shutil.copyfile(f'{D}/{v}', destino)
    except ImportError:
        shutil.copyfile(f'{D}/{v}', destino)
    cambiados += 1

print('archivos escritos:', cambiados)
print('famosos con enlaces a enfermedades:', len(fam_enf), '· enfermedades con famosos:', len(enf_fam))
print('fotos alojadas:', len(fotos), '· enlaces a webs hermanas: sitemaps cargados', {d: len(u) for d, u in herm_urls.items()})
