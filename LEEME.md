# Foto al compartir (og:image) de las pedias

Esta rama se despliega en Hostinger en la carpeta `_og/` de cada pedia (hosting_git_deploy-website-repository, directory `_og`).

- `og.php`: cuando WhatsApp, Facebook, X, Telegram y otros lectores de enlaces piden una página, la sirve con las etiquetas og:image, og:title, og:description, og:url y twitter:card que le falten. A las personas se les sirve la página de siempre. No modifica ningún archivo.
- `<dominio>.jpg`: imagen 1200x630 de cada web. Ludicopedia, Zodiacopedia y Classicapedia usan la imagen que ya tenían.
- `instalar.php`: añade el bloque «og-imagen» al .htaccess de la raíz de cada web que ya tenga `_og/og.php` (copia previa en `.htaccess.antes-og`). Si ya está, no hace nada.
- Para desactivarlo en una web: quitar el bloque «og-imagen» de su .htaccess.
