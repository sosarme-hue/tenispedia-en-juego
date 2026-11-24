<?php
/* Se ejecuta solo desde la línea de órdenes (tarea cron de Hostinger), nunca desde la web:
   /usr/bin/php .../wp-content/plugins/cadaques-si/boot/run.php
   Carga WordPress completo, activa el plugin si hace falta y avanza el montaje (boot/build.php). */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$_SERVER['HTTP_HOST'] = 'cadaques.si'; $_SERVER['HTTPS'] = 'on'; $_SERVER['REQUEST_URI'] = '/';
define('WP_USE_THEMES', false);
require dirname(__DIR__, 4).'/wp-load.php';
$plugin = 'cadaques-si/cadaques-si.php';
if (!is_plugin_active($plugin) && !function_exists('cqs_build_tick')) {
    require_once ABSPATH.'wp-admin/includes/plugin.php';
    wp_set_current_user(1);
    $r = activate_plugin($plugin);
    echo is_wp_error($r) ? 'activar: '.$r->get_error_message() : 'activado', "\n";
    exit;
}
if (function_exists('cqs_build_tick')) echo wp_json_encode(cqs_build_tick()), "\n"; else echo "sin núcleo\n";
