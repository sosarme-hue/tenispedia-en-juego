<?php
// Limpieza de inodos: comprime /home/u235595016/copias-mariano en un zip,
// lo verifica y solo entonces borra los archivos sueltos. Despues cuenta
// los inodos por carpeta. Se ejecuta por cron una sola vez.
if (php_sapi_name() !== 'cli') { http_response_code(403); exit; }
@set_time_limit(0);
@ini_set('memory_limit', '1024M');

$HOME   = '/home/u235595016';
$ORIGEN = $HOME . '/copias-pie';
$ZIP    = $HOME . '/copias-pie-2026-11-28.zip';
$DIR    = __DIR__;
$ESTADO = $DIR . '/estado-pie.txt';
$INF    = $DIR . '/informe-pie.txt';

if (file_exists($ESTADO)) exit; // ya en marcha o hecho
file_put_contents($ESTADO, "en marcha " . date('c') . "\n");
function log_($m) { global $INF; file_put_contents($INF, date('H:i:s') . " $m\n", FILE_APPEND); }

function contar($ruta) { // archivos y carpetas (sin seguir enlaces)
  $f = 0; $d = 0;
  if (!is_dir($ruta) || is_link($ruta)) return [is_file($ruta) ? 1 : 0, 0];
  $it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($ruta, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST, RecursiveIteratorIterator::CATCH_GET_CHILD);
  foreach ($it as $x) { if ($x->isLink() || $x->isFile()) $f++; elseif ($x->isDir()) $d++; }
  return [$f, $d + 1];
}

try {
  log_("Inicio");
  if (!is_dir($ORIGEN)) { log_("No existe $ORIGEN"); }
  else {
    // 1. Lista de archivos
    $lista = []; $carpetas = [];
    $it = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($ORIGEN, FilesystemIterator::SKIP_DOTS),
      RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $x) {
      if ($x->isDir() && !$x->isLink()) $carpetas[] = $x->getPathname();
      else $lista[] = $x->getPathname();
    }
    $reciente = 0;
    foreach ($lista as $p) { $m = @filemtime($p); if ($m > $reciente) $reciente = $m; }
    log_("Ultimo cambio en la carpeta: " . date('c', $reciente));
    if (time() - $reciente < 3600) throw new Exception('la carpeta se ha modificado hace menos de 1 hora, puede estar en uso: no toco nada');
    log_("copias-pie: " . count($lista) . " archivos, " . count($carpetas) . " carpetas");

    // 2. Zip
    if (file_exists($ZIP)) { log_("Ya existe $ZIP, no lo sobrescribo. PARO."); throw new Exception('zip existe'); }
    $z = new ZipArchive();
    if ($z->open($ZIP, ZipArchive::CREATE) !== true) throw new Exception('no abre zip');
    $base = strlen($HOME) + 1;
    foreach ($lista as $p) $z->addFile($p, substr($p, $base));
    if (!$z->close()) throw new Exception('fallo al cerrar zip');
    log_("Zip creado: " . round(filesize($ZIP) / 1048576, 1) . " MB");

    // 3. Verificar: mismo numero de entradas y mismos tamanos
    $z = new ZipArchive();
    if ($z->open($ZIP, ZipArchive::CHECKCONS) !== true) throw new Exception('zip no pasa CHECKCONS');
    $ok = ($z->numFiles === count($lista)); $malos = 0;
    if ($ok) foreach ($lista as $p) {
      $s = $z->statName(substr($p, $base));
      if ($s === false || $s['size'] !== filesize($p)) { $malos++; if ($malos > 0) { $ok = false; break; } }
    }
    $z->close();
    log_("Verificacion: entradas zip " . ($ok ? "OK" : "FALLO") . " (malos: $malos)");
    if (!$ok) throw new Exception('verificacion fallida, no borro nada');

    // 4. Borrar sueltos
    $b = 0;
    foreach ($lista as $p) if (@unlink($p)) $b++;
    foreach ($carpetas as $c) @rmdir($c);
    @rmdir($ORIGEN);
    log_("Borrados $b archivos sueltos. carpeta existe aun: " . (file_exists($ORIGEN) ? 'si' : 'no'));
  }

  // 5. Recuento de inodos por carpeta
  $total = 0; $filas = [];
  foreach (scandir($HOME) as $n) {
    if ($n === '.' || $n === '..') continue;
    $p = "$HOME/$n";
    if ($n === 'domains' && is_dir($p)) {
      foreach (scandir($p) as $dn) {
        if ($dn === '.' || $dn === '..') continue;
        [$f, $d] = contar("$p/$dn"); $filas["domains/$dn"] = $f + $d; $total += $f + $d;
        foreach (scandir("$p/$dn") ?: [] as $sub) {
          if ($sub === '.' || $sub === '..' || $sub === 'public_html') continue;
          [$f2, $d2] = contar("$p/$dn/$sub");
          if ($f2 + $d2 > 500) $filas["  domains/$dn/$sub (fuera de la web)"] = $f2 + $d2;
        }
      }
    } else { [$f, $d] = contar($p); $filas[$n] = $f + $d; $total += $f + $d; }
  }
  arsort($filas);
  log_("RECUENTO (archivos + carpetas), total aprox: $total");
  foreach ($filas as $k => $v) if ($v >= 200) log_(sprintf("%9d  %s", $v, $k));
  log_("Fin");
  file_put_contents($ESTADO, "hecho " . date('c') . "\n");
} catch (Throwable $e) {
  log_("ERROR: " . $e->getMessage());
  file_put_contents($ESTADO, "error " . date('c') . "\n");
}
