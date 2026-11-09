# Foto y textos al compartir: catdogpedia.com y celebraciones.org

Esta rama se despliega en Hostinger en la carpeta `_og/` de cada web
(hosting_git_deploy-website-repository, directory `_og`). No toca nada más.

- `og.php`: cuando WhatsApp, Facebook, X, Telegram y otros lectores de enlaces piden una página,
  la sirve con las etiquetas og:* y twitter:* completas. A las personas se les sirve la página de siempre.
  - CatDogPedia: solo portadas (`/` y `/en/`) cambian la foto genérica por la tarjeta de la web; las fichas conservan su foto.
  - celebraciones.org: todas las páginas, tarjeta según idioma (es, ca, en). La raíz `/` da la portada en castellano.
- `<web>-<idioma>.jpg`: tarjetas 1200x630.
- `instalar.php`: de un solo uso; añade el bloque «og-imagen» al .htaccess raíz de las dos webs
  (copia previa en `.htaccess.antes-og`). Se retira de la rama después de usarlo.
- Para desactivarlo en una web: quitar el bloque «og-imagen» de su .htaccess.
