<?php
/* Tenispedia: prepara AdSense (2026-11-18).
   php aplicar.php           -> prueba en seco: no cambia nada, escribe informe.txt
   php aplicar.php aplicar   -> aplica los cambios una sola vez (crea HECHO al terminar)
   Copia de cada archivo de texto cambiado en _adsense/copia/. El código de AdSense se
   añade como una línea marcada <!--adsense--> y se puede quitar igual. */
error_reporting(E_ALL); set_time_limit(0);
$AQUI = __DIR__; $RAIZ = dirname($AQUI);
$APLICAR = (($argv[1] ?? '') === 'aplicar');
if ($APLICAR && file_exists("$AQUI/HECHO")) { echo "Ya aplicado\n"; exit; }
if ($APLICAR && file_exists("$AQUI/EN_MARCHA")) { echo "En marcha\n"; exit; }
if ($APLICAR) touch("$AQUI/EN_MARCHA");
$log = []; $err = 0;
function L($s){ global $log; $log[] = $s; }

$SNIP = '<!--adsense--><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'consent\',\'default\',{ad_storage:\'denied\',ad_user_data:\'denied\',ad_personalization:\'denied\'});try{var v=JSON.parse(localStorage.getItem(\'aviso-cookies\'));if(v&&v.v===2&&v.publicidad&&Date.now()-v.d<31536e6)gtag(\'consent\',\'update\',{ad_storage:\'granted\',ad_user_data:\'granted\',ad_personalization:\'granted\'});}catch(e){}</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6250668607782976" crossorigin="anonymous"></script>';

/* 1) Textos: [archivo, buscar, reemplazar] — cada búsqueda debe aparecer exactamente una vez */
$T = [
 ['sobre.html', 'Es un proyecto personal y sin ánimo de lucro de Alejandro Rosàs Navarro, que forma parte',
                'Es un proyecto personal de Alejandro Rosàs Navarro, gratuito para el lector y financiado con publicidad, que forma parte'],
 ['en/sobre.html', 'It is a personal, non-profit project by Alejandro Rosàs Navarro, part of',
                   'It is a personal project by Alejandro Rosàs Navarro, free for readers and funded by advertising, part of'],
 ['privacidad.html', 'Esta web no tiene formularios ni cuentas de usuario, y no usa herramientas de publicidad. Solo se tratan estos datos:',
                     'Esta web no tiene formularios ni cuentas de usuario. Solo se tratan estos datos:'],
 ['privacidad.html', 'Detalles en la política de cookies.</li>',
                     'Detalles en la política de cookies.</li>'."\n".'<li><strong>Publicidad.</strong> La web muestra anuncios de Google AdSense (Google Ireland Ltd.) para cubrir sus gastos. Si no aceptas la publicidad en el aviso de cookies, los anuncios no son personalizados: Google no usa cookies para mostrarlos y solo trata datos técnicos limitados, como la dirección IP aproximada, para evitar fraudes y limitar cuántas veces ves un anuncio. Si la aceptas, Google puede usar cookies para mostrarte anuncios según tus intereses. Puedes cambiar tu elección en «Configurar cookies», al pie de la página. Más información: policies.google.com/technologies/ads.</li>'],
 ['en/privacidad.html', 'This site has no forms or user accounts and uses no advertising tools. Only the following data is processed:',
                        'This site has no forms or user accounts. Only the following data is processed:'],
 ['en/privacidad.html', 'Details in the cookie policy.</li>',
                        'Details in the cookie policy.</li>'."\n".'<li><strong>Advertising.</strong> The site shows Google AdSense ads (Google Ireland Ltd.) to cover its costs. If you do not accept advertising in the cookie notice, ads are not personalised: Google uses no cookies to show them and only processes limited technical data, such as your approximate IP address, to prevent fraud and cap how often you see an ad. If you accept, Google may use cookies to show ads based on your interests. You can change your choice in “Cookie settings” at the bottom of the page. More information: policies.google.com/technologies/ads.</li>'],
 ['cookies.html', 'cookies de estadísticas de Google Analytics. No usa cookies de publicidad.</p>',
                  'cookies de estadísticas de Google Analytics y de publicidad de Google AdSense.</p>'],
 ['cookies.html', '<li><strong>Publicidad</strong>: no se usan.</li>',
                  '<li><strong>Publicidad</strong> (solo si las aceptas): Google AdSense, de Google Ireland Ltd., muestra anuncios para cubrir los gastos de la web. Si aceptas la publicidad, Google puede instalar cookies como <code>__gads</code>, <code>__gpi</code> e <code>IDE</code> (hasta 13 meses) para personalizar los anuncios y medirlos. Si no la aceptas, los anuncios siguen apareciendo, pero no son personalizados y Google no usa cookies para mostrarlos. Más información: policies.google.com/technologies/ads.</li>'],
 ['en/cookies.html', 'Google Analytics statistics cookies. It uses no advertising cookies.</p>',
                     'Google Analytics statistics cookies and Google AdSense advertising cookies.</p>'],
 ['en/cookies.html', '<li><strong>Advertising</strong>: not used.</li>',
                     '<li><strong>Advertising</strong> (only if you accept): Google AdSense, by Google Ireland Ltd., shows ads to cover the site\'s costs. If you accept advertising, Google may set cookies such as <code>__gads</code>, <code>__gpi</code> and <code>IDE</code> (up to 13 months) to personalise and measure ads. If you do not accept, ads still appear, but they are not personalised and Google uses no cookies to show them. More information: policies.google.com/technologies/ads.</li>'],
 ['assets/tenis.js', "gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});",
                     "gtag('consent','default',{analytics_storage:'denied'});"],
 ['assets/tenis.js', "mejorar la web. No usamos cookies de publicidad. Puedes cambiar",
                     "mejorar la web. Si aceptas también la publicidad, Google podrá mostrarte anuncios según tus intereses; si no, los anuncios no serán personalizados. Puedes cambiar"],
 ['assets/tenis.js', "improve the site. We do not use advertising cookies. You can change",
                     "improve the site. If you also accept advertising, Google may show you ads based on your interests; if not, ads will not be personalised. You can change"],
 ['assets/tenis.js', "de forma agregada. Solo si lo aceptas.'},",
                     "de forma agregada. Solo si lo aceptas.',pubD:'Google AdSense: anuncios según tus intereses. Si no lo aceptas, los anuncios no son personalizados.'},"],
 ['assets/tenis.js', "in aggregate. Only if you accept.'}}};",
                     "in aggregate. Only if you accept.',pubD:'Google AdSense: ads based on your interests. If you do not accept, ads are not personalised.'}}};"."\n".
                     "/* AdSense: consentimiento de publicidad según el aviso de cookies · 2026-11-18 */\n".
                     "document.addEventListener('avisocookies',function(e){var s=e.detail&&e.detail.publicidad?'granted':'denied';gtag('consent','update',{ad_storage:s,ad_user_data:s,ad_personalization:s});});"],
];
$nuevo = [];
foreach ($T as $t) {
  [$f, $a, $b] = $t; $p = "$RAIZ/$f";
  if (!isset($nuevo[$f])) { if (!is_file($p)) { L("ERROR no existe $f"); $err++; continue; } $nuevo[$f] = file_get_contents($p); }
  $n = substr_count($nuevo[$f], $a);
  if ($n === 0 && strpos($nuevo[$f], $b) !== false) { L("ya hecho: $f"); continue; }
  if ($n !== 1) { L("ERROR $f: el texto aparece $n veces: ".substr($a,0,60)); $err++; continue; }
  $nuevo[$f] = str_replace($a, $b, $nuevo[$f]); L("texto: $f");
}
if ($err) { L("Hay errores en los textos: no se cambia nada."); }

/* 2) Código de AdSense en el <head> de cada página .html (salvo carpetas que se publican con Git) */
$SALTAR = ['_adsense','_og','en-curso','padel','img','.git'];
$lista = []; $ya = 0; $sinHead = [];
$it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(
  new RecursiveDirectoryIterator($RAIZ, FilesystemIterator::SKIP_DOTS),
  function ($c, $k, $i) use ($RAIZ, $SALTAR) { if ($i->hasChildren()) { $rel = substr($c->getPathname(), strlen($RAIZ)+1); return !in_array(explode('/', $rel)[0], $SALTAR, true) && !$c->isLink(); } return true; }));
foreach ($it as $fi) {
  if (strtolower($fi->getExtension()) !== 'html' || $fi->isLink()) continue;
  $p = $fi->getPathname(); $rel = substr($p, strlen($RAIZ)+1);
  $h = isset($nuevo[$rel]) ? $nuevo[$rel] : file_get_contents($p);
  if (strpos($h, 'adsbygoogle.js') !== false) { $ya++; continue; }
  if (substr_count($h, '</head>') !== 1) { $sinHead[] = $rel; continue; }
  $lista[$rel] = 1;
}
L("Páginas .html que recibirán el código: ".count($lista)."; ya lo tenían: $ya; sin </head> claro (se dejan igual): ".count($sinHead));
foreach (array_slice($sinHead, 0, 20) as $s) L("  sin head: $s");
$adsOk = !file_exists("$RAIZ/ads.txt") || trim(file_get_contents("$RAIZ/ads.txt")) === trim(file_get_contents("$AQUI/ads.txt"));
L(file_exists("$RAIZ/ads.txt") ? "ads.txt ya existe".($adsOk?" (igual)":" (DISTINTO: no se toca)") : "ads.txt: se crea");

if ($APLICAR && !$err) {
  @mkdir("$AQUI/copia", 0755, true);
  foreach ($nuevo as $f => $c) { $d = "$AQUI/copia/$f"; @mkdir(dirname($d), 0755, true); if (!file_exists($d)) copy("$RAIZ/$f", $d); }
  $hechos = 0;
  foreach ($nuevo as $f => $c) { if (substr($f, -5) !== '.html') { file_put_contents("$RAIZ/$f", $c) !== false ? $hechos++ : $err++; } }
  foreach ($lista as $rel => $_) {
    $p = "$RAIZ/$rel"; $h = isset($nuevo[$rel]) ? $nuevo[$rel] : file_get_contents($p);
    $h = str_replace('</head>', $SNIP.'</head>', $h);
    if (file_put_contents($p, $h) !== false) $hechos++; else { $err++; L("ERROR al escribir $rel"); }
  }
  foreach ($nuevo as $f => $c) { if (substr($f, -5) === '.html' && !isset($lista[$f])) { file_put_contents("$RAIZ/$f", $c) !== false ? $hechos++ : $err++; } }
  if (!file_exists("$RAIZ/ads.txt")) copy("$AQUI/ads.txt", "$RAIZ/ads.txt");
  L("APLICADO: $hechos archivos escritos, $err errores");
  touch("$AQUI/HECHO");
}
if ($APLICAR) @unlink("$AQUI/EN_MARCHA");
$out = date('c')." ".($APLICAR?'APLICAR':'PRUEBA')."\n".implode("\n", $log)."\n";
file_put_contents("$AQUI/informe.txt", $out); echo $out;
