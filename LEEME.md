# Ajustes de sitemaps

Se despliega en `catdogpedia.com/public_html/_sitemaps-ajustes/` (deploy por Git de Hostinger) y lo lanza un cron cada hora:

    55 * * * * /usr/bin/php /home/u235595016/domains/catdogpedia.com/public_html/_sitemaps-ajustes/ajustes.php

Qué hace (idempotente, no borra nada, copia de cada archivo en `copia/`):

1. Añade a sus sitemaps páginas que faltaban: Catdogpedia `/herramientas/` y `/en/tools/`; Cinematopedia y Filopedia `quiz.html` y `en/quiz.html`. Solo si la página existe, no tiene noindex y su canonical es ella misma.
2. Instala `ssi-sitemap-agenda.php` en `wp-content/mu-plugins/` de las 7 guías locales .si. Añade a `wp-sitemap.xml` un sitemap con la agenda `/events/` y las categorías de eventos. Si tras instalarlo la portada o `wp-sitemap.xml` no responden 200, lo quita al momento.

Para probar sin tocar nada: `php ajustes.php prueba` (resultado en `prueba/` e informe en `log.txt`).
