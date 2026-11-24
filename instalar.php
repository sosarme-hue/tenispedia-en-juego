<?php
// Instalador de un solo uso: copia el mu-plugin de AdSense y crea/actualiza ads.txt. No borra nada.
header('Content-Type: text/plain; charset=utf-8');
$root = dirname(__DIR__);
$mu = $root . '/wp-content/mu-plugins';
$ok = is_dir($mu) && copy(__DIR__ . '/ssi-adsense.php', $mu . '/ssi-adsense.php');
echo ($ok ? "OK" : "ERROR") . " mu-plugins/ssi-adsense.php\n";
$line = 'google.com, pub-6250668607782976, DIRECT, f08c47fec0942fa0';
$ads = $root . '/ads.txt';
$cur = file_exists($ads) ? file_get_contents($ads) : '';
if (strpos($cur, 'pub-6250668607782976') !== false) { echo "OK ads.txt ya tenía la línea\n"; }
else {
	$new = rtrim($cur) . ($cur === '' ? '' : "\n") . $line . "\n";
	echo (file_put_contents($ads, $new) !== false ? "OK" : "ERROR") . " ads.txt\n";
}
if (function_exists('opcache_reset')) @opcache_reset();
echo "Hecho.\n";
