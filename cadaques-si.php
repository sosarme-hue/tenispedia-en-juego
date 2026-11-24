<?php
/**
 * Plugin Name: Cadaqués Sí — Núcleo
 * Description: Diseño Cadaqués Sí (cabecera, pie, estilos), buscador trilingüe y bloques dinámicos de agenda y directorio para cadaques.si, la guía de Cadaqués. Basado en el núcleo de eivissa.si, sitges.si y castelldefels.si.
 * Version: 0.0.1
 * Author: Cadaqués Sí
 * Text Domain: cadaques-si
 */
if (!defined('ABSPATH')) exit;
define('CQS_FILE', __FILE__);
define('SSI_DIR', plugin_dir_path(__FILE__));
define('SSI_URL', plugin_dir_url(__FILE__));
define('SSI_VER', '0.0.1');
define('SSI_BRAND', 'Cadaqués Sí');
define('SSI_LAT0', 42.2886); // centro de referencia (plaça del Doctor Pont, Cadaqués)
define('SSI_LNG0', 3.2776);

/* Núcleo de la red: se activa cuando está revisado para Cadaqués (CQS_CORE en boot/config.php) */
require_once SSI_DIR.'boot/config.php';
require_once SSI_DIR.'boot/boot.php';

/* Cadaqués Sí: población de una dirección (las fichas son de Cadaqués y Portlligat) */
function ssi_town($a) {
    $a = (string)$a;
    foreach (['Portlligat'=>'Cadaqués','Port Lligat'=>'Cadaqués','Cadaqués'=>'Cadaqués','Cadaques'=>'Cadaqués'] as $k => $t) if (stripos($a, $k) !== false) return $t;
    if (preg_match('/\b17488\b/', $a)) return 'Cadaqués';
    return '';
}

if (CQS_CORE && file_exists(SSI_DIR.'inc/i18n.php')) {
    foreach (cqs_core_files() as $f) if (file_exists(SSI_DIR.'inc/'.$f.'.php')) require_once SSI_DIR.'inc/'.$f.'.php';
    if (file_exists(SSI_DIR.'inc/site.php')) require_once SSI_DIR.'inc/site.php';
}
