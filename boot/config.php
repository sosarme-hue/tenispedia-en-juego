<?php
if (!defined('ABSPATH')) exit;
/* Puesta en marcha de cadaques.si a partir de las guías de la red (mismo servidor).
   CQS_BOOT_VER: al cambiarlo se repite la copia del núcleo y el informe (boot/boot.php).
   CQS_CORE: false mientras el núcleo copiado no esté revisado para Cadaqués. */
define('CQS_BOOT_VER', '6');
define('CQS_CORE', true);
define('CQS_BUILD_VER', '18');   // al cambiarlo se repite el montaje (boot/build.php)
define('CQS_SRC_CORE', 'eivissa.si');      // núcleo más reciente de la red
define('CQS_SRC_CORE_SLUG', 'eivissa-si');

function cqs_core_files() {
    return ['i18n','front','shortcodes','directorist','listing','single','antispam','lang-urls','events','seo','zona-head','security','perf',
            'listing-i18n','addform','settings','seo-extra','lang-fix','setup','analytics','fichas'];
}
