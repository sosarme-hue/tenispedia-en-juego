# Uso: python subir_lista.py <web_generada> <lista.txt> <subir.py>
# Sube por TUS cada archivo de la lista (rutas relativas a la web), con la url y claves de subir.py. No borra nada.
import sys, re, os, urllib.request, time
web, lista, subir = sys.argv[1:4]
s = open(subir, encoding='utf-8').read()
url = re.search(r'https://srv\d+-files\.hstgr\.io/rest/[0-9a-f]+/api/tus/public_html', s).group(0)
xa = re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', s).group(0)
xr = re.search(r'[0-9a-f]{64}-[0-9a-f]{16}', s).group(0)
rels = [l.strip() for l in open(lista, encoding='utf-8') if l.strip()]
fallos = []
for n, rel in enumerate(rels, 1):
    data = open(os.path.join(web, rel), 'rb').read()
    h = {'X-Auth': xa, 'X-Auth-Rest': xr, 'Tus-Resumable': '1.0.0'}
    u = f'{url}/{urllib.request.quote(rel)}?override=true'
    for intento in range(4):
        try:
            urllib.request.urlopen(urllib.request.Request(u, method='POST', headers={**h, 'Upload-Length': str(len(data)), 'Upload-Offset': '0'}), timeout=120)
            urllib.request.urlopen(urllib.request.Request(u, data=data, method='PATCH', headers={**h, 'Content-Type': 'application/offset+octet-stream', 'Upload-Offset': '0'}), timeout=300)
            break
        except Exception as ex:
            if intento == 3: fallos.append(rel); print('FALLO', rel, ex)
            else: time.sleep(3 * (intento + 1))
    if n % 50 == 0 or n == len(rels): print(f'{n} de {len(rels)} archivos', flush=True)
print('Terminado.' if not fallos else f'Terminado con {len(fallos)} fallos: ' + ', '.join(fallos[:10]))
