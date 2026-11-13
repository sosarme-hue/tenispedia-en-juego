# Google Analytics en zodiacopedia.com (13-11-2026)

Rama desplegada en Hostinger en la carpeta `_ga/` de zodiacopedia.com (hosting_git_deploy-website-repository, directory `_ga`).

- `bloque-ga.js`: Google Analytics G-G9V5XT19RM con modo de consentimiento v2 (todo denegado por defecto) + aviso de cookies común de las pedias (versión 2) con colores de Zodiacopedia. Se añade al final de `js/medir.js`, que cargan todas las páginas.
- `instalar.php`: revisa las páginas, guarda copias en `_ga/copia/` y añade el bloque a `js/medir.js`; actualiza `cookies.html` y `privacidad.html`. Se retira de la rama después de usarlo.
- Si se regenera la web desde los archivos fuente, hay que volver a añadir `bloque-ga.js` al final de `js/medir.js`.
