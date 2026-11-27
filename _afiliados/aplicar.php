<?php
/* Tenispedia: aviso de afiliación general (Awin y otros), 2026-11-26.
   Se ejecuta una vez desde cron. Cambia aviso-legal.html, en/aviso-legal.html y padel/tienda.html
   solo si siguen iguales a la versión revisada (md5). Copia previa en copia/. */
$AQUI = __DIR__; $RAIZ = dirname(dirname($AQUI)); $out = date('c') . "\n";
$F = ['aviso-legal.html' => '1bae02176e3c7e0c0263b21146673082', 'en/aviso-legal.html' => '05175747d412ca11b6394859fdf41026', 'padel/tienda.html' => '3becc8ee1eb0e6d840f5075f47098afa'];
foreach ($F as $f => $md5) {
  $p = "$RAIZ/$f"; $n = "$AQUI/nuevo/$f";
  if (!is_file($p)) { $out .= "ERROR no existe $f\n"; continue; }
  $h = md5_file($p);
  if ($h === md5_file($n)) { $out .= "ya estaba: $f\n"; continue; }
  if ($h !== $md5) { $out .= "NO SE TOCA (cambió desde la revisión): $f\n"; continue; }
  $c = "$AQUI/copia/$f"; @mkdir(dirname($c), 0755, true); if (!file_exists($c)) copy($p, $c);
  $out .= (file_put_contents($p, file_get_contents($n)) !== false) ? "APLICADO: $f\n" : "ERROR al escribir $f\n";
}
file_put_contents("$AQUI/informe.txt", $out); echo $out;
