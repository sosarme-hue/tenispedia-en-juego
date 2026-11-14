<?php
// Sitemaps automáticos (14-11-2026). Lo lanza un cron de Hostinger cada hora.
// Recorre las páginas .html publicadas de cada web y rehace sus sitemaps.
//   php generar.php            -> rehace los sitemaps de todas las webs
//   php generar.php prueba     -> no toca las webs; deja el resultado en prueba/ y un informe en log.txt
// Solo escribe sitemap.xml (salvo en webs publicadas con git) y sitemap-auto-N.xml.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
@set_time_limit(0);
$PRUEBA = in_array('prueba', $argv, true);
$BASE = '/home/u235595016/domains';
$MAX = 40000;                       // URL por fichero (el límite de Google es 50.000)
$SALTAR_DIRS = ['assets','img','css','js','fotos','datos','api','privado','cgi-bin','node_modules','copias','copia','payload','wp-admin','wp-includes','wp-content'];
$SALTAR_FICH = '/^(404|plantilla.*|google[0-9a-f]+|default)\.html?$/i';

// modo 'completo': escribe sitemap.xml (índice) + sitemap-auto-N.xml
// modo 'git': la web se publica con git; sitemap.xml está en el repo y apunta a sitemap-auto-1.xml; aquí solo se escriben los hijos
$WEBS = [
  'enfermeria.si'         => ['modo' => 'git'],
  'saberparainvertir.com' => ['modo' => 'git'],
  'ludicopedia.com'       => ['modo' => 'completo'],
  'mythicapedia.com'      => ['modo' => 'completo'],
  'medicapedia.org'       => ['modo' => 'completo'],
  'classicapedia.com'     => ['modo' => 'completo'],
  'zodiacopedia.com'      => ['modo' => 'completo', 'excluir' => ['blog/'], 'extra' => ['sitemap-blog.php']],
];
if (isset($argv[1]) && $argv[1] !== 'prueba' && isset($argv[2])) { // uso local: php generar.php DOMINIO RAIZ [prueba]
  $WEBS = [$argv[1] => ['modo' => 'completo', 'raiz' => $argv[2]]];
}

$log = [];
function L($s) { global $log; $log[] = $s; }
L(date('Y-m-d H:i:s') . ($PRUEBA ? ' (prueba)' : ''));

function escribir($ruta, $txt) {
  $tmp = $ruta . '.tmp' . getmypid();
  if (file_put_contents($tmp, $txt, LOCK_EX) === false) return false;
  return rename($tmp, $ruta);
}
function locs_de($fich) { // URL de un sitemap (sigue los índices locales)
  if (!is_file($fich)) return [];
  $x = file_get_contents($fich);
  preg_match_all('#<loc>\s*([^<\s]+)\s*</loc>#', $x, $m);
  if (strpos($x, '<sitemapindex') === false) return $m[1];
  $r = [];
  foreach ($m[1] as $u) {
    $p = parse_url($u, PHP_URL_PATH);
    if ($p && preg_match('/\.xml$/', $p)) $r = array_merge($r, locs_de(dirname($fich) . $p));
  }
  return $r;
}
function url_ruta($dom, $rel) {
  $rel = preg_replace('#(^|/)index\.html?$#i', '$1', $rel);
  $seg = array_map('rawurlencode', explode('/', $rel));
  return 'https://' . $dom . '/' . implode('/', $seg);
}
function norm($u) { return preg_replace('#^https?://(www\.)?#i', 'https://', html_entity_decode(trim($u), ENT_QUOTES)); }

foreach ($WEBS as $dom => $cfg) {
  $raiz = $cfg['raiz'] ?? "$BASE/$dom/public_html";
  if (!is_dir($raiz)) { L("$dom: no encuentro $raiz"); continue; }
  $excluir = $cfg['excluir'] ?? [];
  $urls = []; $vistas = 0; $saltadas = ['noindex' => 0, 'redirige' => 0, 'canonica-fuera' => 0];
  $it = new RecursiveIteratorIterator(
    new RecursiveCallbackFilterIterator(new RecursiveDirectoryIterator($raiz, FilesystemIterator::SKIP_DOTS),
      function ($f) use ($SALTAR_DIRS) {
        $n = $f->getFilename();
        if ($f->isDir()) return !($n[0] === '_' || $n[0] === '.' || in_array($n, $SALTAR_DIRS, true) || $f->isLink());
        return true;
      }));
  foreach ($it as $f) {
    $n = $f->getFilename();
    if (!preg_match('/\.html?$/i', $n) || preg_match($GLOBALS['SALTAR_FICH'], $n) || $f->getSize() < 200) continue;
    $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($raiz) + 1));
    $fuera = false;
    foreach ($excluir as $e) if (strpos($rel, $e) === 0) $fuera = true;
    if ($fuera) continue;
    $vistas++;
    $h = file_get_contents($f->getPathname(), false, null, 0, 20000);
    if (preg_match('#<meta[^>]+name=["\']robots["\'][^>]*noindex#i', $h) || preg_match('#<meta[^>]+content=["\'][^"\']*noindex[^>]*name=["\']robots#i', $h)) { $saltadas['noindex']++; continue; }
    if (preg_match('#<meta[^>]+http-equiv=["\']refresh#i', $h)) { $saltadas['redirige']++; continue; }
    $u = url_ruta($dom, $rel);
    if (preg_match('#<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)#i', $h, $m) || preg_match('#<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']canonical#i', $h, $m)) {
      $c = norm($m[1]);
      if (strpos($c, '/') === 0) $c = 'https://' . $dom . $c;
      if (parse_url($c, PHP_URL_HOST) !== $dom) { $saltadas['canonica-fuera']++; continue; }
      $u = $c;
    }
    $t = $f->getMTime();
    if (!isset($urls[$u]) || $urls[$u] < $t) $urls[$u] = $t;
  }
  ksort($urls);
  // la portada primero
  $port = "https://$dom/";
  if (isset($urls[$port])) { $tp = $urls[$port]; unset($urls[$port]); $urls = [$port => $tp] + $urls; }
  $n = count($urls);

  // comparación con lo que hay ahora
  $antes = array_unique(array_map('norm', locs_de("$raiz/sitemap.xml")));
  $antes = array_values(array_filter($antes, function ($u) { return !preg_match('#/sitemap[^/]*\.(xml|php)$#', $u); }));
  $nuevas = array_keys($urls);
  $faltan = array_values(array_diff($antes, $nuevas));
  $sobran = array_values(array_diff($nuevas, $antes));
  L("$dom: " . count($antes) . " URL antes -> $n ahora ($vistas páginas leídas; sin indexar " . $saltadas['noindex'] . ", redirecciones " . $saltadas['redirige'] . ", canónica a otra web " . $saltadas['canonica-fuera'] . ")");
  L("  ya no salen: " . count($faltan) . (count($faltan) ? ' p. ej. ' . implode(' ', array_slice($faltan, 0, 8)) : ''));
  L("  nuevas: " . count($sobran) . (count($sobran) ? ' p. ej. ' . implode(' ', array_slice($sobran, 0, 8)) : ''));

  if ($n === 0) { L("  0 URL: no se toca nada"); continue; }
  if (!$PRUEBA && count($antes) > 50 && $n < 0.7 * count($antes)) { L("  ¡salen muchas menos URL que antes! No se toca nada"); continue; }

  $dest = $PRUEBA ? __DIR__ . "/prueba/$dom" : $raiz;
  if ($PRUEBA) @mkdir($dest, 0755, true);
  $trozos = array_chunk($urls, $MAX, true);
  $hijos = [];
  foreach ($trozos as $i => $tr) {
    $x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    foreach ($tr as $u => $t) $x .= '<url><loc>' . htmlspecialchars($u, ENT_XML1) . '</loc><lastmod>' . date('Y-m-d', $t) . "</lastmod></url>\n";
    $x .= "</urlset>\n";
    $nom = 'sitemap-auto-' . ($i + 1) . '.xml';
    $actual = @file_get_contents("$dest/$nom");
    if ($actual !== $x && !escribir("$dest/$nom", $x)) L("  ERROR al escribir $nom");
    $hijos[] = "https://$dom/$nom";
  }
  // borra trozos que ya no hacen falta
  for ($i = count($trozos) + 1; is_file("$dest/sitemap-auto-$i.xml"); $i++) @unlink("$dest/sitemap-auto-$i.xml");

  if ($cfg['modo'] === 'completo') {
    foreach ($cfg['extra'] ?? [] as $e) $hijos[] = "https://$dom/$e";
    $x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    foreach ($hijos as $h2) $x .= "<sitemap><loc>$h2</loc></sitemap>\n";
    $x .= "</sitemapindex>\n";
    if (!$PRUEBA && is_file("$raiz/sitemap.xml") && !is_file(__DIR__ . "/copia/$dom-sitemap.xml")) {
      @mkdir(__DIR__ . '/copia', 0755, true);
      copy("$raiz/sitemap.xml", __DIR__ . "/copia/$dom-sitemap.xml");
    }
    if (@file_get_contents("$dest/sitemap.xml") !== $x && !escribir("$dest/sitemap.xml", $x)) L("  ERROR al escribir sitemap.xml");
  } else {
    $idx = @file_get_contents("$raiz/sitemap.xml");
    if ($idx === false || strpos($idx, 'sitemap-auto-1.xml') === false) L("  aviso: el sitemap.xml del repo aún no apunta a sitemap-auto-1.xml");
  }
  // robots.txt: que tenga la línea Sitemap
  $rob = @file_get_contents("$raiz/robots.txt");
  if ($rob === false || stripos($rob, "sitemap: https://$dom/sitemap.xml") === false) L("  aviso: robots.txt sin «Sitemap: https://$dom/sitemap.xml»");
  L("  " . count($trozos) . " fichero(s) sitemap-auto escritos" . ($PRUEBA ? ' en prueba/' : ''));
}
$txt = implode("\n", $log) . "\n\n";
$lf = __DIR__ . '/log.txt';
$prev = @file_get_contents($lf) ?: '';
file_put_contents($lf, $txt . substr($prev, 0, 60000));
if (PHP_SAPI === 'cli') echo $txt;
