<?php
// Ajustes de sitemaps (22-11-2026). Vive en catdogpedia.com/public_html/_sitemaps-ajustes/ y lo lanza un cron de Hostinger cada hora (minuto 55).
// Idempotente: si otra herramienta rehace un sitemap y quita lo añadido, la siguiente pasada lo vuelve a poner.
//  1) Añade páginas que faltaban en sitemaps estáticos (solo si la página existe, no tiene noindex y su canonical es ella misma).
//  2) Instala el mu-plugin ssi-sitemap-agenda.php en las guías locales .si (agenda /events/ y categorías de eventos en el sitemap).
//     Después comprueba que la portada y wp-sitemap.xml responden 200; si no, quita el mu-plugin al momento.
//   php ajustes.php          -> aplica
//   php ajustes.php prueba   -> no toca las webs; deja los sitemaps resultantes en prueba/ y un informe en log.txt
// No borra nada. Copia de cada archivo antes de tocarlo por primera vez en copia/.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
@set_time_limit(0);
date_default_timezone_set('Europe/Madrid');
$cerrojo = fopen(__DIR__ . '/.cerrojo', 'c');
if (!flock($cerrojo, LOCK_EX | LOCK_NB)) exit;
$PRUEBA = in_array('prueba', $argv, true);
$BASE = getenv('AJUSTES_BASE') ?: '/home/u235595016/domains';

// web => [sitemap => [archivo html => URL]]
$ANADIR = [
  'catdogpedia.com'   => ['sitemap.xml'    => ['herramientas/index.html' => 'https://catdogpedia.com/herramientas/',
                                               'en/tools/index.html'     => 'https://catdogpedia.com/en/tools/']],
  'cinematopedia.com' => ['sitemap-es.xml' => ['quiz.html'    => 'https://cinematopedia.com/quiz.html'],
                          'sitemap-en.xml' => ['en/quiz.html' => 'https://cinematopedia.com/en/quiz.html']],
  'filopedia.com'     => ['sitemap-es.xml' => ['quiz.html'    => 'https://filopedia.com/quiz.html'],
                          'sitemap-en.xml' => ['en/quiz.html' => 'https://filopedia.com/en/quiz.html']],
];
$GUIAS = ['sitges.si', 'santcugat.si', 'castelldefels.si', 'vilanova.si', 'santperederibes.si', 'garraf.si', 'eivissa.si'];
$MU = 'ssi-sitemap-agenda.php';

$log = [date('Y-m-d H:i:s') . ($PRUEBA ? ' (prueba)' : '')];
function L($s) { global $log; $log[] = $s; }
function escribir($ruta, $txt) {
  $tmp = $ruta . '.tmp' . getmypid();
  if (file_put_contents($tmp, $txt, LOCK_EX) === false) return false;
  return rename($tmp, $ruta);
}
function copia($dom, $raiz, $rel) {
  $d = __DIR__ . "/copia/$dom/$rel";
  if (!file_exists($d) && file_exists("$raiz/$rel")) { @mkdir(dirname($d), 0755, true); copy("$raiz/$rel", $d); }
}
function estado($url) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 30,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ajustes-sitemaps)']);
  $b = curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$c, (string) $b];
}

// 1) páginas que faltaban
foreach ($ANADIR as $dom => $mapas) {
  $raiz = "$BASE/$dom/public_html";
  if (!is_file("$raiz/index.html")) { L("$dom: no encuentro la web"); continue; }
  foreach ($mapas as $sm => $pags) {
    $f = "$raiz/$sm";
    $x = @file_get_contents($f);
    if ($x === false || strpos($x, '<urlset') === false || ($p = strrpos($x, '</urlset>')) === false) { L("$dom/$sm: no existe o no es una lista de URL; no se toca"); continue; }
    $conLastmod = strpos($x, '<lastmod>') !== false;
    $add = '';
    foreach ($pags as $rel => $url) {
      if (strpos($x, "<loc>$url</loc>") !== false) continue;
      if (!is_file("$raiz/$rel")) { L("$dom: falta el archivo $rel; no se añade $url"); continue; }
      $h = file_get_contents("$raiz/$rel", false, null, 0, 30000);
      if (preg_match('#<meta[^>]+name=["\']robots["\'][^>]*noindex#i', $h)) { L("$dom: $rel tiene noindex; no se añade"); continue; }
      if (preg_match('#<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)#i', $h, $m) && rtrim($m[1], '/') !== rtrim($url, '/')) { L("$dom: el canonical de $rel es {$m[1]}; no se añade"); continue; }
      $add .= "<url><loc>$url</loc>" . ($conLastmod ? '<lastmod>' . date('Y-m-d', filemtime("$raiz/$rel")) . '</lastmod>' : '') . "</url>\n";
      L("$dom/$sm: + $url");
    }
    if ($add === '') continue;
    $nuevo = substr($x, 0, $p) . $add . substr($x, $p);
    if ($PRUEBA) { @mkdir(__DIR__ . "/prueba/$dom", 0755, true); file_put_contents(__DIR__ . "/prueba/$dom/$sm", $nuevo); continue; }
    copia($dom, $raiz, $sm);
    if (!escribir($f, $nuevo)) L("  ERROR al escribir $dom/$sm");
  }
}

// 2) mu-plugin de la agenda en las guías .si
$src = __DIR__ . "/$MU";
if (!function_exists('curl_init')) { L('PHP sin cURL: no se instala el mu-plugin (no se podría comprobar la web)'); $GUIAS = []; }
foreach ($GUIAS as $dom) {
  $dir = "$BASE/$dom/public_html/wp-content/mu-plugins";
  if (!is_dir("$BASE/$dom/public_html/wp-content")) { L("$dom: no es WordPress; no se toca"); continue; }
  $dest = "$dir/$MU";
  if (is_file($dest) && md5_file($dest) === md5_file($src)) continue;
  if ($PRUEBA) { L("$dom: se instalaría $MU"); continue; }
  @mkdir($dir, 0755, true);
  if (!copy($src, "$dest.tmp") || !rename("$dest.tmp", $dest)) { L("$dom: ERROR al copiar $MU"); continue; }
  [$c1] = estado("https://$dom/?nocache=" . time());
  [$c2, $b2] = estado("https://$dom/wp-sitemap.xml?nocache=" . time());
  if ($c1 !== 200 || $c2 !== 200) {
    @unlink($dest);
    L("$dom: tras instalar $MU la web respondió $c1 / sitemap $c2; QUITADO otra vez");
    continue;
  }
  L("$dom: $MU instalado" . (strpos($b2, 'wp-sitemap-ssiagenda-1.xml') !== false ? ' y la agenda ya sale en wp-sitemap.xml' : ' (el índice aún no muestra la agenda: puede ser la caché)'));
}

if (count($log) === 1) $log[] = 'nada que cambiar';
$txt = implode("\n", $log) . "\n\n";
$lf = __DIR__ . '/log.txt';
$prev = @file_get_contents($lf) ?: '';
file_put_contents($lf, $txt . substr($prev, 0, 60000));
echo $txt;
