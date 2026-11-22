# Sitemaps de Tenispedia (rama de subida, no fusionar)

Se despliega con hosting_git_deploy-website-repository en `public_html/_sitemaps/` de tenispedia.com.
La carpeta no es accesible desde la web (`.htaccess`).

`generar.php` lo lanza cada hora un cron de Hostinger (`/usr/bin/php .../tenispedia.com/public_html/_sitemaps/generar.php`).
Recorre todas las páginas .html publicadas (también /en-curso/, /padel/ y /blog/), se salta las que redirigen o llevan noindex,
escribe `sitemap-auto-N.xml` (40.000 URL como máximo, con fecha) y el índice `sitemap.xml`, y copia
`en-curso/sitemap-en-juego.xml` sobre el `sitemap-en-juego.xml` antiguo de la raíz.
`php generar.php prueba` deja el resultado en `prueba/` sin tocar la web. Copias de los originales en `copia/`.
Para deshacer: quitar el cron, restaurar `copia/sitemap.xml` y `copia/sitemap-en-juego.xml` y borrar `sitemap-auto-*.xml`.
