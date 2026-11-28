# Tenispedia: ocultar a Google las páginas de poco valor (AdSense, 2026-11-28)
Rama de subida, no fusionar. Se despliega en public_html/_poco-valor/ (no accesible desde la web).
- `php aplicar.php` -> prueba en seco, escribe informe.txt
- `php aplicar.php aplicar` -> añade `<meta name="robots" content="noindex,follow"><!--pocovalor-->` a cada página de lista.txt y a su versión /en/
- `php aplicar.php deshacer` -> quita esa línea de todas las páginas
El sitemap lo rehace solo el cron de _sitemaps/generar.php, que ya se salta las páginas con noindex.
