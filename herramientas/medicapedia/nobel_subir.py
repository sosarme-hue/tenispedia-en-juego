# Uso: python nobel_subir.py <carpeta_web_generada> <carpeta_nobel> <subir.py> [--solo-preparar]
# Copia nobel.html (es/en/ca), añade la tarjeta en index.html, el enlace en medicos.html
# y la URL en sitemap-xx.xml de la carpeta generada, y sube esos 12 archivos por TUS.
# Lee url y claves de subir.py. No borra nada.
import sys, re, os, shutil, urllib.request
web, nob, subir = sys.argv[1], sys.argv[2], sys.argv[3]
solo = '--solo-preparar' in sys.argv
DOM = 'https://medicapedia.org/'
T = {'es': ('Premio Nobel de Medicina año a año', 'Nobel de Medicina', 'Todos los premiados desde 1901, año a año.', 'premiados'),
     'en': ('Nobel Prize in Medicine year by year', 'Nobel Prize in Medicine', 'Every laureate since 1901, year by year.', 'laureates'),
     'ca': ('Premi Nobel de Medicina any per any', 'Nobel de Medicina', 'Tots els premiats des del 1901, any per any.', 'premiats')}
TOTAL = 235
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8', newline='\n').write(s)
cambiados = []
for l, (tit, sec, secd, nm) in T.items():
    pre = '' if l == 'es' else l + '/'
    shutil.copyfile(os.path.join(nob, pre, 'nobel.html'), os.path.join(web, pre, 'nobel.html'))
    cambiados.append(pre + 'nobel.html')
    p = os.path.join(web, pre, 'index.html'); ix = rd(p)
    if 'href="nobel.html"' not in ix:
        i = ix.find('<div class="secciones">'); j = ix.find('</a></div>', i)
        if i < 0 or j < 0: sys.exit('No encuentro las secciones en ' + p)
        ix = ix[:j] + f'</a><a class="sec" href="nobel.html"><b>{sec}</b><p>{secd}</p><span>{TOTAL} {nm} →</span></a></div>' + ix[j + 10:]
        wr(p, ix)
    cambiados.append(pre + 'index.html')
    p = os.path.join(web, pre, 'medicos.html'); md = rd(p)
    if 'href="nobel.html"' not in md:
        md2 = re.sub(r'(<section class="hero"><h1>[^<]*</h1><p class="entradilla">[^<]*)(</p>)', lambda m: m.group(1) + f' <a href="nobel.html">{tit} →</a>' + m.group(2), md, count=1)
        if md2 == md: print('Aviso: no he podido poner el enlace en', p)
        wr(p, md2)
    cambiados.append(pre + 'medicos.html')
    p = os.path.join(web, f'sitemap-{l}.xml'); sm = rd(p)
    if (DOM + pre + 'nobel.html') not in sm:
        sm = sm.replace('</urlset>', f'<url><loc>{DOM}{pre}nobel.html</loc><lastmod>2026-11-05</lastmod></url>\n</urlset>')
        wr(p, sm)
    cambiados.append(f'sitemap-{l}.xml')
print('Preparados:', len(cambiados), 'archivos')
if solo: sys.exit()
s = rd(subir)
url = re.search(r'https://srv\d+-files\.hstgr\.io/rest/[0-9a-f]+/api/tus/public_html', s).group(0)
xa = re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', s).group(0)
xr = re.search(r'[0-9a-f]{64}-[0-9a-f]{16}', s).group(0)
for rel in cambiados:
    data = open(os.path.join(web, rel), 'rb').read()
    h = {'X-Auth': xa, 'X-Auth-Rest': xr, 'Tus-Resumable': '1.0.0'}
    u = f'{url}/{rel}?override=true'
    r = urllib.request.urlopen(urllib.request.Request(u, method='POST', headers={**h, 'Upload-Length': str(len(data)), 'Upload-Offset': '0'}))
    r = urllib.request.urlopen(urllib.request.Request(u, data=data, method='PATCH', headers={**h, 'Content-Type': 'application/offset+octet-stream', 'Upload-Offset': '0'}))
    print('Subido', rel, r.status)
print('Listo: página del Nobel subida.')
