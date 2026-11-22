<?php
// Sitemaps de Cinematopedia en trozos (22-11-2026). Vive en public_html/_sitemaps/ y lo lanza un cron de Hostinger cada hora.
// Google solo lee 50.000 URL por sitemap, y sitemap-es.xml y sitemap-en.xml tienen 62.416 cada uno.
// Lee las URL de sitemap-es.xml y sitemap-en.xml (los escribe el generador de la web; aquí no se tocan),
// las parte en sitemap-parte-N.xml de 40.000 como máximo y rehace el índice sitemap.xml con esas partes
// y sitemap-blog.xml (que escribe el blog). Si un despliegue de la web vuelve a poner el sitemap.xml antiguo,
// la siguiente pasada lo arregla.
//   php trocear.php          -> escribe en la web
//   php trocear.php prueba   -> no toca la web; deja el resultado en prueba/ y un informe en log.txt
// No borra nada salvo partes sobrantes (sitemap-parte-N.xml) de una pasada anterior. Copia del sitemap.xml original en copia/.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
@set_time_limit(0);
$cerrojo = fopen(__DIR__ . '/.cerrojo', 'c');
if (!flock($cerrojo, LOCK_EX | LOCK_NB)) exit; // ya hay una pasada en marcha

$PRUEBA = in_array('prueba', $argv, true);
$DOM = 'cinematopedia.com';
$RAIZ = dirname(__DIR__);
$MAX = 40000;                                   // URL por fichero (el límite de Google es 50.000)
$FUENTES = ['sitemap-es.xml', 'sitemap-en.xml'];
$EXTRA = ['sitemap-blog.xml'];                  // se añaden al índice si existen

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

if (!is_file("$RAIZ/index.html")) { $log[] = "Raíz inesperada: $RAIZ"; fin($log); }

// 1) URL de las fuentes, sin repetir y en el mismo orden
$urls = [];
foreach ($FUENTES as $f) {
  $x = @file_get_contents("$RAIZ/$f");
  if ($x === false) { $log[] = "falta $f: no se toca nada"; fin($log); }
  if (strpos($x, '<urlset') === false) { $log[] = "$f no es una lista de URL: no se toca nada"; fin($log); }
  preg_match_all('#<loc>\s*([^<\s]+)\s*</loc>#', $x, $m);
  $log[] = "$f: " . count($m[1]) . " URL";
  foreach ($m[1] as $u) $urls[$u] = true;
}
$urls = array_keys($urls);
$n = count($urls);
$log[] = "total sin repetir: $n";
if ($n < 1000) { $log[] = "muy pocas URL: no se toca nada"; fin($log); }

// 2) partes
$dest = $PRUEBA ? __DIR__ . '/prueba' : $RAIZ;
if ($PRUEBA) @mkdir($dest, 0755, true);
$hijos = [];
foreach (array_chunk($urls, $MAX) as $i => $tr) {
  $x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
  foreach ($tr as $u) $x .= "<url><loc>$u</loc></url>\n";   // ya vienen escapadas de las fuentes
  $x .= "</urlset>\n";
  $nom = 'sitemap-parte-' . ($i + 1) . '.xml';
  if (@file_get_contents("$dest/$nom") !== $x && !escribir("$dest/$nom", $x)) { $log[] = "ERROR al escribir $nom: no se toca el índice"; fin($log); }
  $hijos[] = "https://$DOM/$nom";
  $log[] = "$nom: " . count($tr) . " URL";
}
for ($i = count($hijos) + 1; is_file("$dest/sitemap-parte-$i.xml"); $i++) @unlink("$dest/sitemap-parte-$i.xml");

// 3) índice sitemap.xml
foreach ($EXTRA as $e) if (is_file("$RAIZ/$e")) $hijos[] = "https://$DOM/$e";
$x = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
foreach ($hijos as $h) $x .= "<sitemap><loc>$h</loc></sitemap>\n";
$x .= "</sitemapindex>\n";
if (!$PRUEBA && is_file("$RAIZ/sitemap.xml") && !is_file(__DIR__ . '/copia/sitemap.xml')) {
  @mkdir(__DIR__ . '/copia', 0755, true);
  copy("$RAIZ/sitemap.xml", __DIR__ . '/copia/sitemap.xml');
}
if (@file_get_contents("$dest/sitemap.xml") !== $x) {
  if (escribir("$dest/sitemap.xml", $x)) $log[] = 'sitemap.xml reescrito con ' . count($hijos) . ' sitemaps';
  else $log[] = 'ERROR al escribir sitemap.xml';
} else $log[] = 'sitemap.xml ya estaba bien';

// 4) robots.txt: solo se avisa
$rob = @file_get_contents("$RAIZ/robots.txt");
if ($rob === false || stripos($rob, "sitemap: https://$DOM/sitemap.xml") === false) $log[] = "aviso: robots.txt sin «Sitemap: https://$DOM/sitemap.xml»";
fin($log);
