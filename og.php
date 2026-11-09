<?php
// Foto y textos al compartir (Open Graph / Twitter) para catdogpedia.com y celebraciones.org.
// Solo lo llaman WhatsApp, Facebook, X, Telegram y otros lectores de enlaces
// (regla «og-imagen» del .htaccess de la raíz). A las personas se les sirve la página de siempre.
// Lee la página estática, ajusta las etiquetas y la devuelve. No escribe nada.

$raiz = realpath(__DIR__ . '/..');
$host = strtolower(preg_replace('/^www\./i', '', $_SERVER['HTTP_HOST'] ?? ''));
$host = preg_replace('/[^a-z0-9.\-]/', '', $host);
$ruta = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

$webs = [
    'catdogpedia.com' => [
        'nombre' => 'CatDogPedia',
        'idiomas' => ['es' => 'es_ES', 'en' => 'en_GB'], 'defecto' => 'es',
        'img' => ['es' => 'catdogpedia-es.jpg', 'en' => 'catdogpedia-en.jpg'],
        // Las fichas ya tienen su foto propia: la tarjeta solo sustituye a la foto genérica de portada.
        'forzar' => '#^/(en/)?$#',
    ],
    'celebraciones.org' => [
        'nombre' => 'celebraciones.org',
        'idiomas' => ['es' => 'es_ES', 'ca' => 'ca_ES', 'en' => 'en_GB'], 'defecto' => 'es',
        'img' => ['es' => 'celebraciones-es.jpg', 'ca' => 'celebraciones-ca.jpg', 'en' => 'celebraciones-en.jpg'],
        'forzar' => '#.#',
        'portada' => '/es/',   // la raíz solo redirige; a los lectores se les da la portada en castellano
    ],
];
$w = $webs[$host] ?? null;

if ($w && isset($w['portada']) && $ruta === '/') $ruta = $w['portada'];
$archivo = $raiz . $ruta;
if (is_dir($archivo)) $archivo = rtrim($archivo, '/') . '/index.html';
$real = realpath($archivo);
if ($real === false || strpos($real, $raiz . DIRECTORY_SEPARATOR) !== 0 || !preg_match('/\.html?$/i', $real)) {
    http_response_code(404);
    $real = $raiz . '/index.html';
    if (!is_file($real)) exit;
}
$html = file_get_contents($real);
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noarchive', false);

$pos = stripos($html, '</head>');
if (!$w || $pos === false) { echo $html; exit; }
$cab = substr($html, 0, $pos);
$resto = substr($html, $pos);

$seg = explode('/', trim($ruta, '/'))[0] ?? '';
$l = isset($w['idiomas'][$seg]) ? $seg : $w['defecto'];
$base = 'https://' . $host;
$imagen = $base . '/_og/' . $w['img'][$l];

function tiene($cab, $prop) {
    return preg_match('/<meta[^>]+(?:property|name)\s*=\s*["\']' . preg_quote($prop, '/') . '["\']/i', $cab);
}
function attr($s) { return htmlspecialchars(html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'), ENT_QUOTES, 'UTF-8'); }

// En las páginas indicadas se quita la imagen que hubiera para poner la tarjeta de la web.
if (preg_match($w['forzar'], $ruta)) {
    $cab = preg_replace('/<meta[^>]+(?:property|name)\s*=\s*["\'](?:og:image(?::[a-z_]+)?|twitter:image(?::alt)?)["\'][^>]*>\s*/i', '', $cab);
}

$url = $base . $ruta;
if (preg_match('/<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)/i', $cab, $m)) $url = $m[1];
$titulo = preg_match('/<title[^>]*>(.*?)<\/title>/is', $cab, $m) ? trim($m[1]) : $w['nombre'];
$desc = preg_match('/<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']*)/i', $cab, $m) ? $m[1] : '';

$poner = [];
if (!tiene($cab, 'og:type'))        $poner[] = '<meta property="og:type" content="website">';
if (!tiene($cab, 'og:site_name'))   $poner[] = '<meta property="og:site_name" content="' . attr($w['nombre']) . '">';
if (!tiene($cab, 'og:locale'))      $poner[] = '<meta property="og:locale" content="' . $w['idiomas'][$l] . '">';
if (!tiene($cab, 'og:title'))       $poner[] = '<meta property="og:title" content="' . attr($titulo) . '">';
if (!tiene($cab, 'og:description') && $desc !== '') $poner[] = '<meta property="og:description" content="' . attr($desc) . '">';
if (!tiene($cab, 'og:url'))         $poner[] = '<meta property="og:url" content="' . attr($url) . '">';
$puesta = false;
if (!tiene($cab, 'og:image')) {
    $puesta = true;
    $poner[] = '<meta property="og:image" content="' . $imagen . '">';
    $poner[] = '<meta property="og:image:secure_url" content="' . $imagen . '">';
    $poner[] = '<meta property="og:image:type" content="image/jpeg">';
    $poner[] = '<meta property="og:image:width" content="1200">';
    $poner[] = '<meta property="og:image:height" content="630">';
    $poner[] = '<meta property="og:image:alt" content="' . attr($w['nombre']) . '">';
}
if (!tiene($cab, 'twitter:card'))   $poner[] = '<meta name="twitter:card" content="summary_large_image">';
if ($puesta && !tiene($cab, 'twitter:image')) $poner[] = '<meta name="twitter:image" content="' . $imagen . '">';
echo rtrim($cab) . "\n" . implode("\n", $poner) . "\n" . $resto;
