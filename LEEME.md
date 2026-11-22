# Sitemaps de Cinematopedia en trozos (rama de subida, no fusionar)

Se despliega con hosting_git_deploy-website-repository en `public_html/_sitemaps/` de cinematopedia.com.
La carpeta no es accesible desde la web (`.htaccess`).

`trocear.php` lo lanza cada hora un cron de Hostinger (`/usr/bin/php .../cinematopedia.com/public_html/_sitemaps/trocear.php`).
Lee `sitemap-es.xml` y `sitemap-en.xml` (62.416 URL cada uno, más de las 50.000 que lee Google), los parte en
`sitemap-parte-N.xml` de 40.000 URL como máximo y rehace el índice `sitemap.xml` con las partes y `sitemap-blog.xml`.
`php trocear.php prueba` deja el resultado en `prueba/` sin tocar la web. Copia del `sitemap.xml` original en `copia/`.
Para deshacer: quitar el cron, restaurar `copia/sitemap.xml` y borrar `sitemap-parte-*.xml`.
