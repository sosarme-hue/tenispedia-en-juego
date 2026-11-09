<?php
/* Instala o actualiza wp-content/mu-plugins/ssi-baja-form.php (enlace «Solicita la baja») y vacía la caché. Idempotente: se puede abrir varias veces. */
header('Content-Type: text/plain; charset=utf-8'); header('X-Robots-Tag: noindex');
require dirname(__DIR__).'/wp-load.php';
$codigo = file_get_contents(__DIR__.'/ssi-baja-form.txt');
if (!$codigo || strpos($codigo, 'ssi_bf_regla') === false) { echo "ERROR: falta ssi-baja-form.txt\n"; exit; }
$f = WP_CONTENT_DIR.'/mu-plugins/ssi-baja-form.php';
if (!is_dir(dirname($f))) wp_mkdir_p(dirname($f));
if (!is_file($f) || file_get_contents($f) !== $codigo) echo 'ssi-baja-form.php: '.(file_put_contents($f, $codigo, LOCK_EX) ? 'instalado' : 'ERROR')."\n"; else echo "ssi-baja-form.php: ya instalado\n";
wp_cache_flush(); do_action('litespeed_purge_all'); if (!headers_sent()) header('X-LiteSpeed-Purge: *');
echo "Caché vaciada\n";
