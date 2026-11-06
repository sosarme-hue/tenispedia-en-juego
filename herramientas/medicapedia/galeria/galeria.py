# Galería de láminas de anatomía y página de recursos de Medicapedia.
# Uso: python galeria.py <web_generada> <carpeta_laminas> <textos.json> <carpeta_pdf>
#   <carpeta_laminas> tiene laminas.json e img/<id>.jpg (900 px)
#   <carpeta_pdf> tiene genios-es.pdf, genios-en.pdf, genios-ca.pdf, aula-es.pdf, aula-en.pdf, aula-ca.pdf
# Escribe en <web_generada>: img/laminas/<id>.jpg, img/laminas/p/<id>.jpg (miniatura),
# laminas.html y recursos.html (es, en, ca), recursos/*.pdf, y añade tarjetas en index.html
# y URLs en sitemap-xx.xml. Deja la lista de archivos cambiados en galeria-subir.txt. No borra nada.
import sys, os, re, json, html, shutil
from PIL import Image
web, lam, tx, pdfs = sys.argv[1:5]
DOM = 'https://medicapedia.org/'
e = lambda s: html.escape(str(s or ''), quote=True)
L = json.load(open(os.path.join(lam, 'laminas.json'), encoding='utf-8'))
L = {x['id']: x for x in (L if isinstance(L, list) else L.values())}
T = json.load(open(tx, encoding='utf-8'))
cambiados = []
def wr(rel, s):
    p = os.path.join(web, rel); os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='\n').write(s); cambiados.append(rel)
def rd(rel): return open(os.path.join(web, rel), encoding='utf-8').read()

# Imágenes
ids = [i for o in T['obras'] for i in o['ids'] if i in L and i in T['laminas'] and os.path.exists(os.path.join(lam, 'img', i + '.jpg'))]
for i in ids:
    src = os.path.join(lam, 'img', i + '.jpg')
    for sub, w in (('', 900), ('p/', 360)):
        rel = f'img/laminas/{sub}{i}.jpg'; dst = os.path.join(web, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = Image.open(src).convert('RGB'); im.thumbnail((w, w * 2)); im.save(dst, quality=80 if sub else 82, optimize=True)
        cambiados.append(rel)
# PDF
for f in sorted(os.listdir(pdfs)):
    if f.endswith('.pdf') and f.split('-')[0] in ('genios', 'aula'):
        os.makedirs(os.path.join(web, 'recursos'), exist_ok=True)
        shutil.copyfile(os.path.join(pdfs, f), os.path.join(web, 'recursos', f)); cambiados.append('recursos/' + f)

TX = {
 'es': dict(gt='Láminas de anatomía antigua', gd='194 láminas de anatomía de dominio público, de Vesalio y Leonardo a Gray, explicadas una a una.',
   gi='Durante siglos, los grandes atlas de anatomía fueron también obras de arte. Aquí tienes una selección de láminas de dominio público, de la Fabrica de Vesalio (1543) a la Anatomía de Gray (1918), cada una con una breve explicación. Pulsa una imagen para verla en grande.',
   cred='Imagen', via='vía Wikimedia Commons', ver='Ver en grande', ind='Obras', sec='Láminas de anatomía', secd='De Vesalio a Gray: 194 láminas antiguas explicadas.', nm='láminas',
   rt='Recursos para el aula', rd='Materiales gratuitos de Medicapedia para profesores y curiosos: PDF imprimibles, láminas de anatomía y el Nobel de Medicina año a año.',
   ri='Materiales gratuitos para usar en clase o leer en casa. Puedes imprimirlos y compartirlos citando Medicapedia.',
   rsec='Recursos', rsecd='PDF para el aula, láminas antiguas y más.', rnm='recursos',
   r=[('recursos/aula-es.pdf', 'Historia de la medicina en el aula (PDF)', 'Ocho fichas imprimibles, una por época, con línea del tiempo, personajes clave, una curiosidad, tres actividades y las soluciones.'),
      ('recursos/genios-es.pdf', 'Las enfermedades de los genios (PDF)', 'Treinta personajes célebres y las enfermedades que marcaron su vida y su obra, de Beethoven a Frida Kahlo.'),
      ('laminas.html', 'Láminas de anatomía antigua', '194 láminas de dominio público de los grandes atlas, de Vesalio a Gray, con una explicación de cada una.'),
      ('nobel.html', 'Premio Nobel de Medicina año a año', 'Todos los premiados desde 1901, con enlace a su ficha.'),
      ('epocas.html', 'La medicina por épocas', 'De la Antigüedad a hoy: médicos, avances y famosos de cada época.')],
   nota='Medicapedia es un proyecto divulgativo: estos materiales no sustituyen la consulta con un profesional sanitario.'),
 'en': dict(gt='Old anatomy plates', gd='194 public-domain anatomy plates, from Vesalius and Leonardo to Gray, explained one by one.',
   gi='For centuries, the great anatomy atlases were also works of art. Here is a selection of public-domain plates, from Vesalius\'s Fabrica (1543) to Gray\'s Anatomy (1918), each with a short explanation. Click an image to see it larger.',
   cred='Image', via='via Wikimedia Commons', ver='View larger', ind='Works', sec='Anatomy plates', secd='From Vesalius to Gray: 194 old plates explained.', nm='plates',
   rt='Classroom resources', rd='Free Medicapedia materials for teachers and curious readers: printable PDFs, anatomy plates and the Nobel Prize in Medicine year by year.',
   ri='Free materials to use in class or read at home. You can print and share them, crediting Medicapedia.',
   rsec='Resources', rsecd='Classroom PDFs, old plates and more.', rnm='resources',
   r=[('../recursos/aula-en.pdf', 'History of medicine in the classroom (PDF)', 'Eight printable worksheets, one per era, with a timeline, key figures, a curiosity, three activities and answers.'),
      ('../recursos/genios-en.pdf', 'The illnesses of geniuses (PDF)', 'Thirty famous people and the illnesses that shaped their lives and work, from Beethoven to Frida Kahlo.'),
      ('laminas.html', 'Old anatomy plates', '194 public-domain plates from the great atlases, from Vesalius to Gray, each explained.'),
      ('nobel.html', 'Nobel Prize in Medicine year by year', 'Every laureate since 1901, with a link to their entry.'),
      ('epocas.html', 'Medicine through the ages', 'From Antiquity to today: physicians, advances and famous people of each era.')],
   nota='Medicapedia is an educational project: these materials are not a substitute for advice from a health professional.'),
 'ca': dict(gt="Làmines d'anatomia antiga", gd="194 làmines d'anatomia de domini públic, de Vesali i Leonardo a Gray, explicades una a una.",
   gi="Durant segles, els grans atles d'anatomia van ser també obres d'art. Aquí tens una selecció de làmines de domini públic, de la Fabrica de Vesali (1543) a l'Anatomia de Gray (1918), cadascuna amb una breu explicació. Fes clic en una imatge per veure-la en gran.",
   cred='Imatge', via='via Wikimedia Commons', ver='Veure en gran', ind='Obres', sec="Làmines d'anatomia", secd='De Vesali a Gray: 194 làmines antigues explicades.', nm='làmines',
   rt="Recursos per a l'aula", rd="Materials gratuïts de Medicapedia per a professors i curiosos: PDF imprimibles, làmines d'anatomia i el Nobel de Medicina any per any.",
   ri='Materials gratuïts per fer servir a classe o llegir a casa. Els pots imprimir i compartir citant Medicapedia.',
   rsec='Recursos', rsecd="PDF per a l'aula, làmines antigues i més.", rnm='recursos',
   r=[('../recursos/aula-ca.pdf', "Història de la medicina a l'aula (PDF)", 'Vuit fitxes imprimibles, una per època, amb línia del temps, personatges clau, una curiositat, tres activitats i les solucions.'),
      ('../recursos/genios-ca.pdf', 'Les malalties dels genis (PDF)', 'Trenta personatges cèlebres i les malalties que van marcar la seva vida i la seva obra, de Beethoven a Frida Kahlo.'),
      ('laminas.html', "Làmines d'anatomia antiga", '194 làmines de domini públic dels grans atles, de Vesali a Gray, amb una explicació de cadascuna.'),
      ('nobel.html', 'Premi Nobel de Medicina any per any', 'Tots els premiats des del 1901, amb enllaç a la seva fitxa.'),
      ('epocas.html', 'La medicina per èpoques', "De l'Antiguitat a avui: metges, avenços i famosos de cada època.")],
   nota="Medicapedia és un projecte divulgatiu: aquests materials no substitueixen la consulta amb un professional sanitari."),
}
CSS = ('<style>.lam-ind{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 8px}.lam-obra{padding:18px 0;border-top:1px solid #e5e0d6}'
       '.lam-obra>p{max-width:760px}.lam-rej{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:22px;margin-top:14px}'
       '.lam{margin:0}.lam a.im{display:block;background:#f4efe6;border-radius:6px;overflow:hidden}.lam img{display:block;width:100%;height:300px;object-fit:contain}'
       '.lam h3{font-size:1.02em;margin:8px 0 4px}.lam p{font-size:.92em;margin:0 0 6px;line-height:1.45}.lam small{display:block;font-size:.76em;color:#777;line-height:1.35}'
       '.rec{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin:18px 0}</style>\n</head>')
def pagina(l, nombre, tit, desc, cuerpo, css=''):
    pre = '' if l == 'es' else l + '/'
    s = rd(f'{pre}sobre.html'); url = DOM + pre + nombre
    s = re.sub(r'<title>.*?</title>', f'<title>{e(tit)} · Medicapedia</title>', s, count=1)
    for k, v in (('name="description"', desc), ('property="og:title"', tit), ('property="og:description"', desc)):
        s = re.sub(rf'<meta {k} content="[^"]*">', f'<meta {k} content="{e(v)}">', s, count=1)
    s = s.replace(f'{DOM}{pre}sobre.html', url)
    for a, b in (('href="en/sobre.html"', f'href="en/{nombre}"'), ('href="ca/sobre.html"', f'href="ca/{nombre}"'),
                 ('href="../sobre.html"', f'href="../{nombre}"'), ('href="../en/sobre.html"', f'href="../en/{nombre}"'), ('href="../ca/sobre.html"', f'href="../ca/{nombre}"')):
        s = s.replace(a, b)
    s = re.sub(r'(<link rel="alternate" hreflang="\w+" href="[^"]*)sobre\.html">', lambda m: m.group(1) + nombre + '">', s)
    ld = {'@context': 'https://schema.org', '@graph': [{'@type': 'CollectionPage', 'name': tit, 'description': desc, 'url': url, 'inLanguage': l,
          'dateModified': '2026-11-06', 'isPartOf': {'@id': DOM + '#web'}, 'publisher': {'@id': DOM + '#org'}}]}
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>', s, count=1, flags=re.S)
    s = s.replace('</head>', css, 1) if css else s
    s = re.sub(r'<main>[\s\S]*?</main>', lambda m: f'<main>\n{cuerpo}\n</main>', s, count=1)
    wr(pre + nombre, s)

NOM = {  # clave: (autor corto, {idioma: (autor, obra)})
 'vesalius': ('Vesalio|Vesalius|Vesali', 'Andrés Vesalio|Andreas Vesalius|Andreu Vesali', 'De humani corporis fabrica'),
 'leonardo': ('Leonardo', 'Leonardo da Vinci', 'Estudios anatómicos (Royal Collection, Windsor)|Anatomical studies (Royal Collection, Windsor)|Estudis anatòmics (Royal Collection, Windsor)'),
 'eustachius': ('Eustachi', 'Bartolomeo Eustachi', 'Tabulae anatomicae (grabadas hacia 1552, publicadas en 1714)|Tabulae anatomicae (engraved c. 1552, published 1714)|Tabulae anatomicae (gravades cap al 1552, publicades el 1714)'),
 'bidloo': ('Bidloo', 'Govert Bidloo y Gérard de Lairesse|Govert Bidloo and Gérard de Lairesse|Govert Bidloo i Gérard de Lairesse', 'Anatomia humani corporis'),
 'cheselden': ('Cheselden', 'William Cheselden', 'Osteographia, or the anatomy of the bones'),
 'albinus': ('Albinus', 'Bernhard Siegfried Albinus y Jan Wandelaar|Bernhard Siegfried Albinus and Jan Wandelaar|Bernhard Siegfried Albinus i Jan Wandelaar', 'Tabulae sceleti et musculorum corporis humani'),
 'gautier': ("Gautier d'Agoty", "Jacques-Fabien Gautier d'Agoty", 'Láminas anatómicas en color (mezzotinta)|Colour anatomical plates (mezzotint)|Làmines anatòmiques en color (mezzotinta)'),
 'mascagni': ('Mascagni', 'Paolo Mascagni', 'Vasorum lymphaticorum historia y Anatomia universa|Vasorum lymphaticorum historia and Anatomia universa|Vasorum lymphaticorum historia i Anatomia universa'),
 'bourgery': ('Bourgery', 'Jean-Baptiste Bourgery y Nicolas-Henri Jacob|Jean-Baptiste Bourgery and Nicolas-Henri Jacob|Jean-Baptiste Bourgery i Nicolas-Henri Jacob', "Traité complet de l'anatomie de l'homme"),
 'gray': ('Gray', 'Henry Gray y Henry Vandyke Carter|Henry Gray and Henry Vandyke Carter|Henry Gray i Henry Vandyke Carter', "Gray's Anatomy"),
}
def nom(k, campo, l):
    v = NOM[k][campo].split('|'); return v[('es', 'en', 'ca').index(l)] if len(v) == 3 else v[0]
n = len(ids)
for l, t in TX.items():
    pre = '' if l == 'es' else l + '/'; up = '' if l == 'es' else '../'
    t = {k: (v.replace('194', str(n)) if isinstance(v, str) else v) for k, v in t.items()}
    obras = [o for o in T['obras'] if any(i in ids for i in o['ids'])]
    c = f'<section class="hero"><h1>{e(t["gt"])}</h1><p class="entradilla">{e(t["gi"])}</p></section>'
    c += '<p class="lam-ind"><b>' + e(t['ind']) + ':</b> ' + ' '.join(f'<a href="#{o["k"]}">{e(nom(o["k"], 0, l))}</a>' for o in obras) + '</p>'
    for o in obras:
        c += f'<section class="lam-obra" id="{o["k"]}"><h2>{e(nom(o["k"], 2, l))} <span class="nota">{e(nom(o["k"], 1, l))} · {e(o["ano"])}</span></h2><p>{e(T["intro"][o["k"]][l])}</p><div class="lam-rej">'
        for i in o['ids']:
            if i not in ids: continue
            x = T['laminas'][i][l]; m = L[i]
            art = re.sub(r'\s+', ' ', m.get('artista') or nom(o['k'], 1, l)).strip()[:120]
            cr = f'{e(t["cred"])}: {e(art)} · {e(m.get("licencia", ""))} · <a href="{e(m.get("pagina", ""))}" rel="noopener">{e(t["via"])}</a>'
            c += (f'<figure class="lam" id="{i}"><a class="im" href="{up}img/laminas/{i}.jpg" title="{e(t["ver"])}"><img src="{up}img/laminas/p/{i}.jpg" alt="{e(x["t"])}" loading="lazy"></a>'
                  f'<figcaption><h3>{e(x["t"])}</h3><p>{e(x["x"])}</p><small>{cr}</small></figcaption></figure>')
        c += '</div></section>'
    pagina(l, 'laminas.html', t['gt'], t['gd'], c, CSS)
    c = f'<section class="hero"><h1>{e(t["rt"])}</h1><p class="entradilla">{e(t["ri"])}</p></section><div class="rec">'
    for href, a, b in t['r']:
        href = href if l != 'es' else href.replace('../', '')
        c += f'<a class="sec" href="{href}"><b>{e(a)}</b><p>{e(b)}</p></a>'
    c += f'</div><p class="nota">{e(t["nota"])}</p>'
    pagina(l, 'recursos.html', t['rt'], t['rd'], c, CSS)
    # Portada: dos tarjetas nuevas
    ix = rd(pre + 'index.html')
    for href, sec, secd, num in (('laminas.html', t['sec'], t['secd'], f'{n} {t["nm"]} →'), ('recursos.html', t['rsec'], t['rsecd'], f'{len(t["r"])} {t["rnm"]} →')):
        if f'href="{href}"' in ix: continue
        i0 = ix.find('<div class="secciones">'); j = ix.find('</a></div>', i0)
        if i0 < 0 or j < 0: sys.exit('No encuentro las secciones en ' + pre + 'index.html')
        ix = ix[:j] + f'</a><a class="sec" href="{href}"><b>{e(sec)}</b><p>{e(secd)}</p><span>{num}</span></a></div>' + ix[j + 10:]
    wr(pre + 'index.html', ix)
    sm = rd(f'sitemap-{l}.xml')
    for nombre in ('laminas.html', 'recursos.html'):
        if DOM + pre + nombre not in sm:
            sm = sm.replace('</urlset>', f'<url><loc>{DOM}{pre}{nombre}</loc><lastmod>2026-11-06</lastmod></url>\n</urlset>')
    wr(f'sitemap-{l}.xml', sm)
open(os.path.join(web, '..', 'galeria-subir.txt'), 'w', encoding='utf-8').write('\n'.join(dict.fromkeys(cambiados)) + '\n')
print('Láminas:', n, '· archivos para subir:', len(dict.fromkeys(cambiados)), '· lista en galeria-subir.txt')
