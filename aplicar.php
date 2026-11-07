<?php
// Copia mythicapedia-payload/ sobre public_html. Sobrescribe, no borra nada.
header('Content-Type: text/html; charset=utf-8');
if (($_GET['k'] ?? '') !== 'fb55beaac45593461c168cae') { http_response_code(403); exit('No autorizado'); }
$src = __DIR__ . '/mythicapedia-payload';
$dst = dirname(__DIR__);
$n = 0; $err = 0;
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
foreach ($it as $f) {
  $rel = substr($f->getPathname(), strlen($src) + 1);
  if (strpos($rel, 'img/') === 0) continue;
  $t = $dst . '/' . $rel;
  if ($f->isDir()) { if (!is_dir($t)) @mkdir($t, 0755, true); continue; }
  if (@copy($f->getPathname(), $t)) $n++; else $err++;
}
file_put_contents(__DIR__ . '/ultima-copia.txt', date('c') . " copiados=$n errores=$err\n");
// Script temporal: si todo ha ido bien, se borra a sí mismo junto con la carpeta _subida.
if (!$err) {
  $del = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
  foreach ($del as $f) { $f->isDir() && !$f->isLink() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); }
  @rmdir(__DIR__);
}
echo '<div style="font:20px sans-serif;text-align:center;margin-top:20vh">';
echo $err ? "Copiados $n archivos, $err con error. Avisa a Claude." : '✅ ¡Listo! Mythicapedia ya está actualizada. Puedes cerrar esta página.';
echo '</div>';
