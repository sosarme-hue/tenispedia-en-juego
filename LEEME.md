# AdSense en las guías .si

Rama temporal. Se despliega en `_adsense/` de cada guía, se abre https://<guía>/_adsense/instalar.php una vez y después se vacía la rama y se vuelve a desplegar.

Instala `wp-content/mu-plugins/ssi-adsense.php` (código AdSense ca-pub-6250668607782976 + aviso en privacidad/cookies) y `ads.txt` en la raíz.

- 24/11/2026: instalado en sitges, santcugat, castelldefels, santperederibes, vilanova, garraf y eivissa. En castelldefels.si el mu-plugin
  cambia el Gmail personal por info@castelldefels.si en el contenido. El código está en el commit 6a3febf de esta rama; los archivos se
  quitaron de la rama después de instalar.
