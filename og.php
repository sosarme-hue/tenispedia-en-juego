<?php
// Foto al compartir (og:image) para las pedias.
// Solo lo llaman WhatsApp, Facebook, X, Telegram y otros lectores de enlaces
// (regla en el .htaccess de la raíz). A las personas se les sirve el HTML de siempre.
// Lee la página estática, añade las etiquetas que le falten y la devuelve. No escribe nada.

$raiz = realpath(__DIR__ . '/..');
$host = strtolower(preg_replace('/^www\./i', '', $_SERVER['HTTP_HOST'] ?? ''));
$host = preg_replace('/[^a-z0-9.\-]/', '', $host);

// Imagen por defecto de cada web (las que ya tenían una propia la conservan).
$propias = [
    'ludicopedia.com'   => '/og-ludicopedia.png',
    'zodiacopedia.com'  => '/fotos/vialactea.jpg',
    'classicapedia.com' => '/assets/og-classicapedia.png',
];
$imagen = $propias[$host] ?? (is_file(__DIR__ . "/$host.jpg") ? "/_og/$host.jpg" : null);
$tam = isset($propias[$host]) ? null : [1200, 630];

// Página pedida -> archivo
$ruta = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
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
if ($pos === false || !$imagen) { echo $html; exit; }
$cab = substr($html, 0, $pos);

function tiene($cab, $prop) {
    return preg_match('/<meta[^>]+(?:property|name)\s*=\s*["\']' . preg_quote($prop, '/') . '["\']/i', $cab);
}
function attr($s) { return htmlspecialchars(html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'), ENT_QUOTES, 'UTF-8'); }

$base = 'https://' . $host;
$url = $base . (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('/<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)/i', $cab, $m)) $url = $m[1];
$titulo = preg_match('/<title[^>]*>(.*?)<\/title>/is', $cab, $m) ? trim($m[1]) : '';
$desc = preg_match('/<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']*)/i', $cab, $m) ? $m[1] : '';
$sitio = ucfirst(explode('.', $host)[0]);

$poner = [];
if (!tiene($cab, 'og:type'))        $poner[] = '<meta property="og:type" content="website">';
if (!tiene($cab, 'og:site_name'))   $poner[] = '<meta property="og:site_name" content="' . attr($sitio) . '">';
if (!tiene($cab, 'og:title') && $titulo !== '') $poner[] = '<meta property="og:title" content="' . attr($titulo) . '">';
if (!tiene($cab, 'og:description') && $desc !== '') $poner[] = '<meta property="og:description" content="' . attr($desc) . '">';
if (!tiene($cab, 'og:url'))         $poner[] = '<meta property="og:url" content="' . attr($url) . '">';
if (!tiene($cab, 'og:image')) {
    $poner[] = '<meta property="og:image" content="' . $base . $imagen . '">';
    if ($tam) {
        $poner[] = '<meta property="og:image:width" content="' . $tam[0] . '">';
        $poner[] = '<meta property="og:image:height" content="' . $tam[1] . '">';
    }
    $poner[] = '<meta property="og:image:alt" content="' . attr($sitio) . '">';
}
if (!tiene($cab, 'twitter:card'))   $poner[] = '<meta name="twitter:card" content="summary_large_image">';

echo $poner ? substr($html, 0, $pos) . implode("\n", $poner) . "\n" . substr($html, $pos) : $html;
