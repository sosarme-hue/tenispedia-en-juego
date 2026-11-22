<?php
// Sitemaps de Tenispedia (22-11-2026). Vive en public_html/_sitemaps/ y lo lanza un cron de Hostinger cada hora.
// Recorre todas las páginas .html publicadas de tenispedia.com (también /en-curso/, /padel/ y /blog/)
// y rehace:
//   sitemap-auto-N.xml   -> listas de URL (40.000 como máximo cada una) con la fecha de cada página
//   sitemap.xml          -> índice con las sitemap-auto-N.xml (es el que se envía en Search Console)
//   sitemap-en-juego.xml -> copia de en-curso/sitemap-en-juego.xml (el antiguo de la raíz ya no se actualizaba)
// Se salta las páginas con noindex, las que solo redirigen (meta refresh) y las carpetas que empiezan por _ o .
//   php generar.php          -> escribe en la web
//   php generar.php prueba   -> no toca la web; deja el resultado en prueba/ y un informe en log.txt
// La primera vez guarda copia de sitemap.xml y sitemap-en-juego.xml en copia/.
// Para deshacer: quitar el cron, volver a poner copia/sitemap.xml y copia/sitemap-en-juego.xml y borrar sitemap-auto-*.xml.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
@set_time_limit(0);
$cerrojo = fopen(__DIR__ . '/.cerrojo', 'c');
if (!flock($cerrojo, LOCK_EX | LOCK_NB)) exit; // ya hay una pasada en marcha

$PRUEBA = in_array('prueba', $argv, true);
$DOM = 'tenispedia.com';
$RAIZ = dirname(__DIR__);
$MAX = 40000;                                   // URL por fichero (el límite de Google es 50.000)
$SALTAR_DIRS = ['assets', 'img', 'css', 'js', 'fotos', 'datos', 'api', 'privado', 'cgi-bin', 'node_modules', 'copias', 'copia'];
$SALTAR_FICH = '/^(404|plantilla.*|google[0-9a-f]+|default)\.html?$/i';

$log = [date('Y-m-d H:i:s') . ($PRUEBA ? ' (prueba)' : '')];
function fin($log) {
  $txt = implode("\n", $log) . "\n\n";
  $lf = __DIR__ . '/log.txt';
  $prev = @file_get_contents($lf) ?: '';
  file_put_contents($lf, $txt . substr($prev, 0, 60000));
  echo $txt;
  exit;
}
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
    if ($p && preg_match('/\.xml$/', $p)) $r = array_merge($r, locs_de($GLOBALS['RAIZ'] . $p));
  }
  return $r;
}
function url_ruta($dom, $rel) {
  $rel = preg_replace('#(^|/)index\.html?$#i', '$1', $rel);
  $seg = array_map('rawurlencode', explode('/', $rel));
  return 'https://' . $dom . '/' . implode('/', $seg);
}
function norm($u) { return preg_replace('#^https?://(www\.)?#i', 'https://', html_entity_decode(trim($u), ENT_QUOTES)); }

if (!is_file("$RAIZ/index.html") || !is_dir("$RAIZ/en-curso")) { $log[] = "Raíz inesperada: $RAIZ"; fin($log); }

// 1) páginas publicadas
$urls = []; $vistas = 0; $saltadas = ['noindex' => 0, 'redirige' => 0, 'canonica-fuera' => 0];
$it = new RecursiveIteratorIterator(
  new RecursiveCallbackFilterIterator(new RecursiveDirectoryIterator($RAIZ, FilesystemIterator::SKIP_DOTS),
    function ($f) use ($SALTAR_DIRS) {
      $n = $f->getFilename();
      if ($f->isDir()) return !($n[0] === '_' || $n[0] === '.' || in_array($n, $SALTAR_DIRS, true) || $f->isLink());
      return true;
    }));
foreach ($it as $f) {
  $n = $f->getFilename();
  if (!preg_match('/\.html?$/i', $n) || preg_match($SALTAR_FICH, $n) || $f->getSize() < 200) continue;
  $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($RAIZ) + 1));
  $vistas++;
  $h = file_get_contents($f->getPathname(), false, null, 0, 20000);
  if (preg_match('#<meta[^>]+name=["\']robots["\'][^>]*noindex#i', $h) || preg_match('#<meta[^>]+content=["\'][^"\']*noindex[^>]*name=["\']robots#i', $h)) { $saltadas['noindex']++; continue; }
  if (preg_match('#<meta[^>]+http-equiv=["\']refresh#i', $h)) { $saltadas['redirige']++; continue; }
  $u = url_ruta($DOM, $rel);
  if (preg_match('#<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)#i', $h, $m) || preg_match('#<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']canonical#i', $h, $m)) {
    $c = norm($m[1]);
    if (strpos($c, '/') === 0) $c = 'https://' . $DOM . $c;
    if (parse_url($c, PHP_URL_HOST) !== $DOM) { $saltadas['canonica-fuera']++; continue; }
    $u = $c;
  }
  $t = $f->getMTime();
  if (!isset($urls[$u]) || $urls[$u] < $t) $urls[$u] = $t;
}
ksort($urls);
$port = "https://$DOM/";
if (isset($urls[$port])) { $tp = $urls[$port]; unset($urls[$port]); $urls = [$port => $tp] + $urls; }
$n = count($urls);

// 2) comparación con los sitemaps de ahora (sitemap.xml, en-curso, blog y pádel)
$antes = [];
foreach (['sitemap.xml', 'sitemap-blog.xml', 'en-curso/sitemap-en-juego.xml', 'en-curso/sitemap-tienda.xml', 'padel/sitemap-padel.xml'] as $s)
  $antes = array_merge($antes, locs_de("$RAIZ/$s"));
$antes = array_values(array_filter(array_unique(array_map('norm', $antes)), function ($u) { return !preg_match('#/sitemap[^/]*\.(xml|php)$#', $u); }));
$nuevas = array_keys($urls);
$faltan = array_values(array_diff($antes, $nuevas));
$sobran = array_values(array_diff($nuevas, $antes));
$log[] = count($antes) . " URL en los sitemaps de ahora -> $n ahora ($vistas páginas leídas; sin indexar {$saltadas['noindex']}, redirecciones {$saltadas['redirige']}, canónica a otra web {$saltadas['canonica-fuera']})";
$log[] = "  ya no salen: " . count($faltan) . (count($faltan) ? ': ' . implode(' ', array_slice($faltan, 0, 30)) : '');
$log[] = "  nuevas: " . count($sobran) . (count($sobran) ? ': ' . implode(' ', array_slice($sobran, 0, 30)) : '');
if ($n < 1000) { $log[] = "muy pocas URL: no se toca nada"; fin($log); }
if (!$PRUEBA && count($antes) > 50 && $n < 0.7 * count($antes)) { $log[] = "¡salen muchas menos URL que antes! No se toca nada"; fin($log); }

// 3) copia de seguridad (solo la primera vez)
if (!$PRUEBA) {
  @mkdir(__DIR__ . '/copia', 0755, true);
  foreach (['sitemap.xml', 'sitemap-en-juego.xml'] as $s)
    if (is_file("$RAIZ/$s") && !is_file(__DIR__ . "/copia/$s")) copy("$RAIZ/$s", __DIR__ . "/copia/$s");
}

// 4) sitemap-auto-N.xml
$dest = $PRUEBA ? __DIR__ . '/prueba' : $RAIZ;
if ($PRUEBA) @mkdir($dest, 0755, true);
$hijos = [];
foreach (array_chunk($urls, $MAX, true) as $i => $tr) {
  $x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
  foreach ($tr as $u => $t) $x .= '<url><loc>' . htmlspecialchars($u, ENT_XML1) . '</loc><lastmod>' . date('Y-m-d', $t) . "</lastmod></url>\n";
  $x .= "</urlset>\n";
  $nom = 'sitemap-auto-' . ($i + 1) . '.xml';
  if (@file_get_contents("$dest/$nom") !== $x && !escribir("$dest/$nom", $x)) { $log[] = "ERROR al escribir $nom: no se toca el índice"; fin($log); }
  $hijos[] = "https://$DOM/$nom";
  $log[] = "$nom: " . count($tr) . " URL";
}
for ($i = count($hijos) + 1; is_file("$dest/sitemap-auto-$i.xml"); $i++) @unlink("$dest/sitemap-auto-$i.xml");

// 5) índice sitemap.xml
$x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
foreach ($hijos as $h) $x .= "<sitemap><loc>$h</loc><lastmod>" . date('Y-m-d') . "</lastmod></sitemap>\n";
$x .= "</sitemapindex>\n";
$viejo = @file_get_contents("$dest/sitemap.xml");
if ($viejo === false || preg_replace('#<lastmod>[^<]*</lastmod>#', '', $viejo) !== preg_replace('#<lastmod>[^<]*</lastmod>#', '', $x) || strpos($viejo, '<sitemapindex') === false) {
  if (escribir("$dest/sitemap.xml", $x)) $log[] = 'sitemap.xml reescrito (índice con ' . count($hijos) . ' sitemap)';
  else $log[] = 'ERROR al escribir sitemap.xml';
} else $log[] = 'sitemap.xml ya estaba bien';

// 6) sitemap-en-juego.xml de la raíz = copia del de en-curso (lo rehace la actualización de En juego)
$ej = @file_get_contents("$RAIZ/en-curso/sitemap-en-juego.xml");
if ($ej !== false && strpos($ej, '<urlset') !== false) {
  if (@file_get_contents("$dest/sitemap-en-juego.xml") !== $ej) {
    if (escribir("$dest/sitemap-en-juego.xml", $ej)) $log[] = 'sitemap-en-juego.xml de la raíz puesto al día';
    else $log[] = 'ERROR al escribir sitemap-en-juego.xml';
  }
} else $log[] = 'aviso: no encuentro en-curso/sitemap-en-juego.xml';

// 7) robots.txt: solo se avisa
$rob = @file_get_contents("$RAIZ/robots.txt");
if ($rob === false || stripos($rob, "sitemap: https://$DOM/sitemap.xml") === false) $log[] = "aviso: robots.txt sin «Sitemap: https://$DOM/sitemap.xml»";
fin($log);
