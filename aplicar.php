<?php
/* Tenispedia: noindex en páginas de poco valor (2026-11-28).
   php aplicar.php            -> prueba en seco: no cambia nada, escribe informe.txt
   php aplicar.php aplicar    -> añade la etiqueta noindex (una sola vez, crea HECHO)
   php aplicar.php deshacer   -> quita la etiqueta de todas las páginas de la lista
   La etiqueta va marcada con <!--pocovalor--> y se quita igual de fácil. */
error_reporting(E_ALL); set_time_limit(0);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$AQUI = __DIR__; $RAIZ = dirname($AQUI);
$MODO = $argv[1] ?? 'prueba';
if ($MODO === 'aplicar' && file_exists("$AQUI/HECHO")) { echo "Ya aplicado\n"; exit; }
$TAG = '<meta name="robots" content="noindex,follow"><!--pocovalor-->';
$log = []; $err = 0; function L($s){ global $log; $log[] = $s; }
if (!is_file("$RAIZ/index.html") || !is_dir("$RAIZ/en-curso")) { echo "Raíz inesperada\n"; exit; }
$lista = array_values(array_filter(array_map('trim', file("$AQUI/lista.txt"))));
$rutas = [];
foreach ($lista as $r) {
  if (strpos($r, '..') !== false || $r[0] === '/' || strpos($r, 'en-curso/') === 0 || strpos($r, 'padel/') === 0) { L("se salta: $r"); continue; }
  $rutas[] = $r; $rutas[] = "en/$r";
}
$cambiar = []; $ya = 0; $falta = []; $raro = []; $otroRobots = [];
foreach ($rutas as $r) {
  $p = "$RAIZ/$r";
  if (!is_file($p) || is_link($p)) { $falta[] = $r; continue; }
  $h = file_get_contents($p);
  if (strpos($h, '<!--pocovalor-->') !== false) { $ya++; continue; }
  if (preg_match('#<meta[^>]+name=["\']robots#i', $h)) { $otroRobots[] = $r; continue; }
  if (substr_count($h, '</head>') !== 1) { $raro[] = $r; continue; }
  $cambiar[$r] = $h;
}
if ($MODO === 'deshacer') {
  $n = 0;
  foreach ($rutas as $r) { $p = "$RAIZ/$r"; if (!is_file($p)) continue; $h = file_get_contents($p);
    if (strpos($h, $TAG) !== false) { file_put_contents($p, str_replace($TAG, '', $h)) !== false ? $n++ : $err++; } }
  @unlink("$AQUI/HECHO"); L("DESHECHO: $n páginas, $err errores");
} else {
  L("Páginas en la lista: " . count($lista) . " (con la versión inglesa: " . count($rutas) . ")");
  L("Recibirán noindex: " . count($cambiar) . "; ya lo tenían: $ya; no existen: " . count($falta) . "; ya tenían otra etiqueta robots (se dejan): " . count($otroRobots) . "; sin </head> claro (se dejan): " . count($raro));
  foreach (array_slice($falta, 0, 15) as $s) L("  no existe: $s");
  foreach (array_slice($otroRobots, 0, 15) as $s) L("  otra robots: $s");
  foreach (array_slice($raro, 0, 15) as $s) L("  sin head: $s");
  foreach (array_slice(array_keys($cambiar), 0, 10) as $s) L("  ejemplo: $s");
  if ($MODO === 'aplicar') {
    $n = 0;
    foreach ($cambiar as $r => $h) {
      $t = filemtime("$RAIZ/$r");
      if (file_put_contents("$RAIZ/$r", str_replace('</head>', $TAG . '</head>', $h)) !== false) { $n++; @touch("$RAIZ/$r", $t); } else { $err++; L("ERROR al escribir $r"); }
    }
    L("APLICADO: $n páginas, $err errores"); touch("$AQUI/HECHO");
  }
}
$out = date('c') . " " . strtoupper($MODO) . "\n" . implode("\n", $log) . "\n\n";
$prev = @file_get_contents("$AQUI/informe.txt") ?: '';
file_put_contents("$AQUI/informe.txt", $out . $prev); echo $out;
