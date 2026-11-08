<?php
// Comprobación de solo lectura: pide portada y una página interior de cada pedia
// como visitante normal y como WhatsApp, y mira el código HTTP y la og:image.
header('Content-Type: text/plain; charset=utf-8');
set_time_limit(120);
$webs = [
  'ludicopedia.com' => '/juegos/sudoku.html', 'zodiacopedia.com' => '/cookies.html',
  'mythicapedia.com' => '/dioses-36.html', 'culinapedia.com' => '/cocinas.html',
  'newtonpedia.com' => '/descubrimientos.html', 'tenispedia.com' => '/tenistas-26.html',
  'cinematopedia.com' => '/derechos.html', 'medicapedia.org' => '/',
  'filopedia.com' => '/obras.html', 'pinacopedia.com' => '/origenes.html',
  'classicapedia.com' => '/anecdotas-siglo-xx.html',
];
function pide($url, $ua) {
  $c = curl_init($url);
  curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20, CURLOPT_USERAGENT => $ua, CURLOPT_HTTPHEADER => ['Cache-Control: no-cache']]);
  $h = curl_exec($c); $code = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  $img = preg_match('/<meta[^>]+property=["\']og:image["\'][^>]*content=["\']([^"\']+)/i', (string)$h, $m) ? $m[1] : '-';
  return [$code, $img];
}
foreach ($webs as $w => $int) {
  foreach (['/', $int] as $p) {
    if ($p === '/' && $int === '/' && isset($hecho[$w])) continue; $hecho[$w] = 1;
    [$cn, ] = pide("https://$w$p", 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36');
    [$cw, $img] = pide("https://$w$p", 'WhatsApp/2.24.1 A');
    $ci = $img !== '-' ? pide($img, 'WhatsApp/2.24.1 A')[0] : '-';
    echo "$w$p  normal:$cn  whatsapp:$cw  imagen:$ci  $img\n";
  }
}
