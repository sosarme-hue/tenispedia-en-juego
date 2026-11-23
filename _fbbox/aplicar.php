<?php
/* Tenispedia: añade el recuadro «Síguenos en Facebook» al final de assets/tenis.js (2026-11-23).
   Se ejecuta una vez desde cron. Copia previa en copia/tenis.js. Marca: fbbox. */
$AQUI = __DIR__; $RAIZ = dirname(dirname($AQUI));
$f = "$RAIZ/assets/tenis.js"; $out = date('c') . "\n";
if (!is_file($f)) { $out .= "ERROR no existe assets/tenis.js\n"; }
else {
  $js = file_get_contents($f);
  if (strpos($js, '/*fbbox') !== false) { $out .= "ya estaba\n"; }
  else {
    @mkdir("$AQUI/copia", 0755, true); if (!file_exists("$AQUI/copia/tenis.js")) copy($f, "$AQUI/copia/tenis.js");
    $n = file_put_contents($f, rtrim($js) . "\n" . file_get_contents("$AQUI/fbbox-tenispedia.js") . "\n");
    $out .= $n ? "APLICADO: " . strlen($js) . " -> $n bytes\n" : "ERROR al escribir\n";
  }
}
file_put_contents("$AQUI/informe.txt", $out); echo $out;
