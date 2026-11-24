<?php
if (!defined('ABSPATH')) exit;
/* Puesta en marcha de cadaques.si a partir de las guías de la red (mismo servidor).
   CQS_BOOT_VER: al cambiarlo se repite la copia del núcleo y el informe (boot/boot.php).
   CQS_CORE: false mientras el núcleo copiado no esté revisado para Cadaqués. */
define('CQS_BOOT_VER', '1');
define('CQS_CORE', false);
define('CQS_SRC_CORE', 'eivissa.si');      // núcleo más reciente de la red
define('CQS_SRC_CORE_SLUG', 'eivissa-si');
define('CQS_SRC_PAGES', ['castelldefels.si', 'sitges.si', 'eivissa.si']); // modelos de páginas y ajustes

function cqs_core_files() {
    return ['i18n','front','shortcodes','directorist','listing','single','antispam','lang-urls','events','seo','zona-head','security','perf',
            'listing-i18n','addform','settings','seo-extra','lang-fix','guardia','setup','analytics','fichas','feeds'];
}
