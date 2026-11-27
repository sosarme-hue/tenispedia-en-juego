<?php
// Arreglos de la revisión de Mariano (27-11-2026). Solo línea de comandos (tarea programada).
// Lee orden.json: {"id": "...", "modo": "informe" | "aplicar"}.
// informe: no toca nada; escribe informes/<id>.txt y muestras/<id>/... con cómo quedarían algunos archivos.
// aplicar: copia cada archivo antes de tocarlo en ~/copias-mariano/<id>/<dominio>/<ruta> y lo escribe.
// Idempotente: cada operación comprueba si ya está hecha. Un id ya aplicado no se repite.
if (php_sapi_name() !== 'cli') { http_response_code(403); exit('No autorizado'); }
date_default_timezone_set('Europe/Madrid');
@ini_set('memory_limit', '1024M'); @set_time_limit(0);
$AQUI = __DIR__;
$DOMS = getenv('PARCHE_DOMS') ?: dirname(__DIR__, 3);          // /home/u.../domains
$COPIAS = getenv('PARCHE_COPIAS') ?: dirname($DOMS) . '/copias-mariano';
$orden = json_decode(file_get_contents("$AQUI/orden.json"), true);
$ID = preg_replace('/[^a-z0-9_-]/i', '', $orden['id']); $MODO = $orden['modo'];
$hecho = "$AQUI/hecho-$ID.txt";
if (file_exists($hecho)) { echo date('c') . " · $ID ya hecho\n"; exit; }
@mkdir("$AQUI/informes", 0755, true);
$INF = []; $ESCRITOS = 0; $MUESTRAS = [];
function inf($s) { global $INF; $INF[] = $s; }
function raiz($d) { global $DOMS; return "$DOMS/$d/public_html"; }
function guardar($dom, $rel, $nuevo, $etiqueta) {
  global $MODO, $COPIAS, $ID, $ESCRITOS, $MUESTRAS, $AQUI;
  $f = raiz($dom) . "/$rel";
  if ($MODO === 'aplicar') {
    $c = "$COPIAS/$ID/$dom/$rel"; @mkdir(dirname($c), 0755, true);
    if (!file_exists($c) && !copy($f, $c)) { inf("  ERROR copia $dom/$rel"); return false; }
    if (file_put_contents($f, $nuevo) === false) { inf("  ERROR escribir $dom/$rel"); return false; }
    $ESCRITOS++;
  } else {
    $k = "$etiqueta|$dom"; $MUESTRAS[$k] = ($MUESTRAS[$k] ?? 0) + 1;
    if ($MUESTRAS[$k] <= 2 || $rel === 'index.html' || $rel === 'en/index.html') {
      $m = "$AQUI/muestras/$ID/$dom/$rel"; @mkdir(dirname($m), 0755, true); file_put_contents($m, $nuevo);
    }
  }
  return true;
}
// recorre los archivos de texto de un dominio
function recorrer($dom, $exts, $saltar) {
  $r = raiz($dom); $out = [];
  $it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(
    new RecursiveDirectoryIterator($r, FilesystemIterator::SKIP_DOTS),
    function ($f, $k, $it) use ($r, $saltar) {
      $rel = substr($f->getPathname(), strlen($r) + 1);
      if ($f->isLink()) return false;
      foreach ($saltar as $p) if (preg_match($p, $rel)) return false;
      return true;
    }));
  foreach ($it as $f) {
    if (!$f->isFile() || $f->getSize() > 30 * 1048576) continue;
    $e = strtolower(pathinfo($f->getFilename(), PATHINFO_EXTENSION));
    if (in_array($e, $exts)) $out[] = substr($f->getPathname(), strlen($r) + 1);
  }
  sort($out); return $out;
}
$OTRAS = ['classicapedia','pinacopedia','filopedia','cinematopedia','medicapedia','tenispedia','newtonpedia','culinapedia','mythicapedia','zodiacopedia','ludicopedia','catdogpedia','celebraciones','enfermeria','planetpedia','escolapedia','psycholopedia','worldwinepedia','leypedia','iapedia','saberparainvertir','geneticapedia','oncolopedia','hormonapedia','neurolopedia','cardiolopedia'];
function saltar_base($dom) {
  global $OTRAS; $yo = explode('.', $dom)[0]; $s = [];
  foreach ($OTRAS as $o) if ($o !== $yo) $s[] = '#^_blog/' . $o . '(/|$)#';
  return array_merge($s, ['#^_blog/(fuente|extraido|herramientas)(/|$)#', '#(^|/)copias(/|$)#', '#(^|/)\.git(/|$)#', '#^_parches#', '#(^|/)node_modules(/|$)#', '#\.bak$#', '#(^|/)_limpieza(/|$)#']);
}

$ops = json_decode(file_get_contents("$AQUI/ops.json"), true);
$SOLO = $orden['solo'] ?? null; // lista de secciones a ejecutar; null = licencia, dia y celebraciones
function toca($sec) { global $SOLO; return $SOLO === null ? $sec !== 'extra' : in_array($sec, $SOLO); }
inf("Arreglos Mariano · id $ID · modo $MODO · " . date('c'));

// 1) Licencia: sustituciones literales en todo el árbol
foreach (toca('licencia') ? $ops['licencia']['dominios'] : [] as $dom) {
  if (!is_dir(raiz($dom))) { inf("[licencia] $dom: NO EXISTE"); continue; }
  $n = 0; $nf = 0; $lista = [];
  foreach (recorrer($dom, $ops['licencia']['ext'], saltar_base($dom)) as $rel) {
    $s = file_get_contents(raiz($dom) . "/$rel"); $t = $s; $k = 0;
    foreach ($ops['licencia']['pares'] as [$a, $b]) { $t = str_replace($a, $b, $t, $c); $k += $c; }
    if ($k) { $nf++; $n += $k; if (count($lista) < 8) $lista[] = $rel; guardar($dom, $rel, $t, 'licencia'); }
  }
  inf("[licencia] $dom: $nf archivos, $n cambios. Ej.: " . implode(', ', $lista));
  // avisos: restos de NC en otras extensiones
  $resto = 0; $ej = [];
  foreach (recorrer($dom, ['xml', 'md', 'txt', 'csv'], saltar_base($dom)) as $rel) {
    if (stripos(file_get_contents(raiz($dom) . "/$rel"), 'by-nc') !== false) { $resto++; if (count($ej) < 5) $ej[] = $rel; }
  }
  if ($resto) inf("  aviso: 'by-nc' en $resto archivos no tocados: " . implode(', ', $ej));
}

// 2) Bloques del día: operaciones por archivo
$porArchivo = [];
foreach (toca('dia') ? $ops['dia'] : [] as $o) $porArchivo[$o['dominio'] . '|' . $o['archivo']][] = $o;
foreach ($porArchivo as $k => $lista) {
  [$dom, $rel] = explode('|', $k); $f = raiz($dom) . "/$rel";
  if (!file_exists($f)) { inf("[dia] $dom/$rel: NO EXISTE"); continue; }
  $s = file_get_contents($f); $hechos = []; $saltados = [];
  foreach ($lista as $o) {
    $et = $o['id'] ?? ($o['ancla'] ?? $o['buscar'] ?? 'op');
    if ($o['tipo'] === 'rellenar' || $o['tipo'] === 'insertar_tras') {
      $ancla = $o['tipo'] === 'rellenar' ? 'id="' . $o['id'] . '"' : $o['ancla'];
      if (substr_count($s, $ancla) !== 1) { $saltados[] = "$et (ancla " . substr_count($s, $ancla) . " veces)"; continue; }
      $p = strpos($s, $ancla) + strlen($ancla);
      if (substr($ancla, -1) !== '>') { $p = strpos($s, '>', $p); if ($p === false) { $saltados[] = "$et (sin >)"; continue; } $p++; }
      if ($o['tipo'] === 'rellenar') {
        if (substr($s, $p, 2) !== '</') { $saltados[] = "$et (ya tiene contenido)"; continue; }
      } else {
        $tras = $o['tras'] ?? '';
        if (substr($s, $p, strlen($tras)) !== $tras) { $saltados[] = "$et (contenido inesperado)"; continue; }
        $p += strlen($tras);
        if (strpos(substr($s, $p, 80), 'data-respaldo') !== false) { $saltados[] = "$et (ya hecho)"; continue; }
      }
      $s = substr($s, 0, $p) . $o['texto'] . substr($s, $p); $hechos[] = $et;
    } elseif ($o['tipo'] === 'reemplazar') {
      if (strpos($s, $o['por']) !== false) { $saltados[] = "$et (ya hecho)"; continue; }
      if (substr_count($s, $o['buscar']) !== 1) { $saltados[] = "$et (" . substr_count($s, $o['buscar']) . " veces)"; continue; }
      $s = str_replace($o['buscar'], $o['por'], $s); $hechos[] = $et;
    } elseif ($o['tipo'] === 'anteponer') {
      if (strpos($s, $o['texto']) === 0) { $saltados[] = "$et (ya hecho)"; continue; }
      $s = $o['texto'] . $s; $hechos[] = 'anteponer';
    }
  }
  if ($hechos) guardar($dom, $rel, $s, 'dia');
  inf("[dia] $dom/$rel: hecho " . implode(', ', $hechos) . ($saltados ? ' · SALTADO: ' . implode(', ', $saltados) : ''));
}

// 3) Celebraciones: quitar notas de Google guardadas
if (toca('celebraciones')) {
$cel = $ops['celebraciones']; $dom = $cel['dominio'];
$nf = 0; $nn = 0; $nv = 0; $sinpid = 0; $ej = []; $quedan = [];
foreach (recorrer($dom, ['html', 'htm'], saltar_base($dom)) as $rel) {
  $s = file_get_contents(raiz($dom) . "/$rel");
  if (strpos($s, '★') === false) continue;
  $t = preg_replace('#<span class="nota">★[^<]*<small>\([^<]*\)</small></span>#u', '', $s, -1, $c1);
  $c2 = 0;
  $t = preg_replace_callback('#<div>(Valoración|Valoració|Rating)<b>★[^<]*</b></div>#u', function ($m) use ($t, $cel, &$c2, &$sinpid) {
    $c2++;
    $l = ['Valoración' => 'es', 'Valoració' => 'ca', 'Rating' => 'en'][$m[1]];
    $q = null;
    if (preg_match('#class="galeria[^"]*" data-pid="([^"]+)"[^>]*data-nom="([^"]*)"#', $t, $g))
      $q = 'https://www.google.com/maps/search/?api=1&amp;query=' . rawurlencode(html_entity_decode($g[2])) . '&amp;query_place_id=' . rawurlencode($g[1]);
    if (!$q) { $sinpid++; return ''; }
    return '<div>' . $cel['etiqueta'][$l] . '<b><a rel="nofollow noopener" target="_blank" href="' . $q . '">' . $cel['enlace'][$l] . '</a></b></div>';
  }, $t);
  if ($c1 + $c2) {
    $nf++; $nn += $c1; $nv += $c2; if (count($ej) < 6) $ej[] = $rel; guardar($dom, $rel, $t, 'celebraciones');
  }
  if (preg_match('#★\s?\d#u', $t) || preg_match('#(opiniones en Google|opinions a Google|Google reviews)#', $t)) { if (count($quedan) < 10) $quedan[] = $rel; }
}
inf("[celebraciones] $nf archivos · $nn notas quitadas de tarjetas · $nv filas de valoración cambiadas por enlace ($sinpid sin place_id, quitadas) · Ej.: " . implode(', ', $ej));
if ($quedan) inf("  aviso: aún quedan notas en: " . implode(', ', $quedan));
// datos públicos: fichas.json guarda nota y votos de Google; se dejan en null
$fj = raiz($dom) . '/fichas.json';
if (file_exists($fj)) {
  $s = file_get_contents($fj);
  $t = preg_replace('#"(rating|votos)":\s*[0-9.]+#', '"$1": null', $s, -1, $c);
  if ($c) guardar($dom, 'fichas.json', $t, 'celebraciones');
  inf("  fichas.json: $c valores de nota/votos puestos a null");
}
// generadores que podrían volver a ponerlas
$gen = [];
foreach (recorrer($dom, ['php', 'js', 'json', 'py'], saltar_base($dom)) as $rel) {
  $s = file_get_contents(raiz($dom) . "/$rel");
  if (preg_match('#(opiniones en Google|opinions a Google|Google reviews|userRatingCount|"rating")#', $s)) $gen[] = $rel;
}
inf("  archivos de código o datos que mencionan valoraciones: " . ($gen ? implode(', ', array_slice($gen, 0, 30)) : 'ninguno'));
}
// 4) Extra: sustituciones literales por dominio (solo con "solo": ["extra"])
foreach (toca('extra') ? ($ops['extra'] ?? []) : [] as $x) {
  $dom = $x['dominio']; $nf = 0; $n = 0;
  foreach (recorrer($dom, $x['ext'], saltar_base($dom)) as $rel) {
    $s = file_get_contents(raiz($dom) . "/$rel"); $t = $s; $k = 0;
    foreach ($x['pares'] as [$a, $b]) { if (strpos($t, $b) !== false) continue; $t = str_replace($a, $b, $t, $c); $k += $c; }
    if ($k) { $nf++; $n += $k; guardar($dom, $rel, $t, 'extra'); }
  }
  inf("[extra] $dom: $nf archivos, $n cambios");
}

$r = implode("\n", $INF) . "\nArchivos escritos: $ESCRITOS\n";
file_put_contents("$AQUI/informes/$ID.txt", $r);
if ($MODO === 'aplicar') file_put_contents($hecho, date('c') . "\n");
echo $r;
