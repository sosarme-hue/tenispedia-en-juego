<?php
// Google Analytics G-G9V5XT19RM con aviso de cookies en zodiacopedia.com (13-11-2026).
// ?clave=...           -> solo mira (no cambia nada)
// ?clave=...&hacer=1   -> copia de seguridad en _ga/copia/ y cambia js/medir.js, cookies.html y privacidad.html
// ?clave=...&deshacer=1 -> vuelve a poner las copias
header('Content-Type: text/plain; charset=utf-8');
if (($_GET['clave'] ?? '') !== 'zp-ga-7f3k9q2m') { http_response_code(404); exit; }
$raiz = realpath(__DIR__ . '/..');
$copia = __DIR__ . '/copia';
$ID = 'G-G9V5XT19RM';
$archivos = ['js/medir.js', 'cookies.html', 'privacidad.html'];

// 1. Revisión: páginas sin medir.js y etiquetas de Google ya puestas
$sin = []; $con_google = []; $total = 0;
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($raiz, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
    $p = substr($f->getPathname(), strlen($raiz) + 1);
    if (!preg_match('/\.html?$/i', $p) || preg_match('#^(_ga|_og|privado)/#', $p)) continue;
    $total++;
    $h = file_get_contents($f->getPathname());
    if (strpos($h, 'medir.js') === false) $sin[] = $p;
    if (preg_match('/googletagmanager|gtag\(|G-[A-Z0-9]{8,}/', $h)) $con_google[] = $p;
}
echo "Páginas HTML: $total\n";
echo "Sin js/medir.js (no tendrían Analytics): " . count($sin) . "\n";
foreach (array_slice($sin, 0, 60) as $p) echo "  - $p\n";
echo "Con alguna etiqueta de Google ya puesta: " . count($con_google) . "\n";
foreach (array_slice($con_google, 0, 30) as $p) echo "  - $p\n";
$m = file_get_contents("$raiz/js/medir.js");
echo "medir.js ya tiene $ID: " . (strpos($m, $ID) !== false ? 'sí' : 'no') . "\n\n";

if (isset($_GET['deshacer'])) {
    foreach ($archivos as $a) {
        if (is_file("$copia/$a")) { copy("$copia/$a", "$raiz/$a"); echo "$a: devuelto a la copia\n"; }
        else echo "$a: no hay copia\n";
    }
    exit;
}
$escribir = isset($_GET['hacer']);
if (!$escribir) echo "Solo revisión (nada se cambia):\n";

// 2. Copias de seguridad (solo la primera vez)
if ($escribir) foreach ($archivos as $a) {
    if (!is_file("$copia/$a")) { @mkdir(dirname("$copia/$a"), 0755, true); copy("$raiz/$a", "$copia/$a"); }
}

// 3. medir.js: añadir Analytics + aviso al final
if (strpos($m, $ID) === false && !$escribir) echo "js/medir.js: se añadiría Analytics + aviso\n";
elseif (strpos($m, $ID) === false) {
    $ok = file_put_contents("$raiz/js/medir.js", rtrim($m) . "\n" . file_get_contents(__DIR__ . '/bloque-ga.js'), LOCK_EX);
    echo "js/medir.js: " . ($ok ? "añadido Analytics + aviso" : "ERROR al escribir") . "\n";
} else echo "js/medir.js: ya estaba\n";

// 4. Textos legales: cambios exactos; si algún texto no coincide, ese archivo no se toca
function cambiar($ruta, $pares) {
    global $escribir;
    $h = file_get_contents($ruta); $n = $h;
    foreach ($pares as $viejo => $nuevo) {
        if (substr_count($n, $viejo) !== 1) { echo basename($ruta) . ": no encuentro «" . mb_substr($viejo, 0, 60) . "…», no se toca\n"; return; }
        $n = str_replace($viejo, $nuevo, $n);
    }
    if (!$escribir) { echo basename($ruta) . ": todos los textos encontrados, se actualizaría\n"; return; }
    echo basename($ruta) . ': ' . (file_put_contents($ruta, $n, LOCK_EX) ? 'actualizado' : 'ERROR al escribir') . "\n";
}
$c = file_get_contents("$raiz/cookies.html");
if (strpos($c, 'Google Analytics') === false) cambiar("$raiz/cookies.html", [
  'Última actualización: 3 de noviembre de 2026' => 'Última actualización: 13 de noviembre de 2026',
  '<h2>Esta web no usa cookies</h2>' => '<h2>Qué cookies usa esta web</h2>',
  '<p>Zodiacopedia no instala cookies propias ni de terceros: no hay publicidad, ni analítica de terceros, ni botones de redes sociales que rastreen tu visita. Las estadísticas propias de la web son contadores anónimos que no usan cookies ni guardan nada en tu navegador. Las tipografías se sirven desde el propio servidor de la web, sin conectar con Google ni con otros proveedores.</p>
<p>Por eso no se muestra ningún aviso de consentimiento de cookies.</p>' =>
  '<p>Zodiacopedia usa lo necesario para funcionar y, solo si lo aceptas, cookies de estadísticas de Google Analytics. No hay publicidad ni botones de redes sociales que rastreen tu visita. Las tipografías se sirven desde el propio servidor de la web, sin conectar con Google ni con otros proveedores.</p>
<h2>Tu elección: aceptar, rechazar o configurar</h2>
<p>La primera vez que entras te mostramos un aviso para que elijas. Rechazar es igual de fácil que aceptar, y la web funciona igual en los dos casos. Hay tres tipos:</p>
<ul>
<li><b>Necesarias</b> (siempre activas): recuerdan tu elección sobre las cookies. No son cookies propiamente dichas: tu elección se guarda en el almacenamiento local de tu navegador (clave <code>aviso-cookies</code>) durante 12 meses; pasado ese tiempo te volveremos a preguntar.</li>
<li><b>Estadísticas</b> (solo si las aceptas): Google Analytics, de Google Ireland Ltd. Instala las cookies <code>_ga</code> y <code>_ga_G9V5XT19RM</code>, que duran 2 años y sirven para contar visitas y saber qué páginas se ven y desde dónde llegan, de forma agregada. Google puede tratar estos datos fuera de la UE con las garantías del Marco de Privacidad de Datos UE-EE. UU. Más información: <a href="https://policies.google.com/privacy">policies.google.com/privacy</a>.</li>
<li><b>Publicidad</b>: no se usan.</li>
</ul>
<p>Puedes cambiar tu elección cuando quieras con el enlace <b>«Configurar cookies»</b> del pie de la página. Si rechazas las estadísticas o retiras tu permiso, Google Analytics no se carga y borramos sus cookies.</p>
<p>Además, la web tiene sus propios contadores de visitas anónimos, que no usan cookies ni guardan nada en tu navegador.</p>',
  '<p>Si en el futuro se incorporan servicios que usen cookies, como un sistema de pago o estadísticas de visitas, esta política se actualizará y se pedirá tu consentimiento cuando la ley lo exija.</p>' =>
  '<p>Si en el futuro se incorporan otros servicios que usen cookies, esta política se actualizará y se pedirá tu consentimiento cuando la ley lo exija.</p>',
]); else echo "cookies.html: ya hablaba de Google Analytics\n";

$p = file_get_contents("$raiz/privacidad.html");
if (strpos($p, 'Google Analytics') === false) cambiar("$raiz/privacidad.html", [
  'Última actualización: 3 de noviembre de 2026' => 'Última actualización: 13 de noviembre de 2026',
  'No hay registro de usuarios ni publicidad, y las estadísticas de visitas son anónimas y sin cookies.' =>
  'No hay registro de usuarios ni publicidad. Las estadísticas propias de visitas son anónimas y sin cookies, y solo si lo aceptas en el aviso de cookies usamos también Google Analytics.',
  '<li><b>Registros del servidor:</b>' =>
  '<li><b>Google Analytics (solo si lo aceptas):</b> si aceptas las estadísticas en el aviso de cookies, Google Analytics (Google Ireland Ltd.) recibe tu dirección IP y datos técnicos del navegador para contar las visitas de forma agregada. Puedes retirar tu permiso en cualquier momento en «Configurar cookies», al pie de la página. Google puede tratar estos datos fuera de la UE con las garantías del Marco de Privacidad de Datos UE-EE. UU. Detalles en la <a href="cookies.html">política de cookies</a>.</li>
<li><b>Registros del servidor:</b>',
  'tu correo se conserva mientras sigas suscrito.</p>' =>
  'tu correo se conserva mientras sigas suscrito. Google Analytics también se basa en tu consentimiento (artículo 6.1.a del RGPD), que das y retiras en el aviso de cookies.</p>',
]); else echo "privacidad.html: ya hablaba de Google Analytics\n";
echo "\nHecho.\n";
