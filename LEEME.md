# Sitemaps automáticos

`generar.php` rehace cada hora (cron de Hostinger) los sitemaps de enfermeria.si, saberparainvertir.com,
ludicopedia.com, mythicapedia.com, medicapedia.org, classicapedia.com y zodiacopedia.com a partir de las
páginas .html publicadas. El resultado de cada pasada queda en `log.txt`. La primera copia del sitemap.xml
anterior de cada web se guarda en `copia/`.
