<?php
// Solo lectura: pide cada página como visitante normal y como WhatsApp y muestra el código HTTP, og:title y og:image.
header('Content-Type: text/plain; charset=utf-8');
set_time_limit(120);
$paginas = ['https://catdogpedia.com/', 'https://catdogpedia.com/en/', 'https://catdogpedia.com/perros/beagle.html',
  'https://celebraciones.org/', 'https://celebraciones.org/ca/', 'https://celebraciones.org/en/',
  'https://saberparainvertir.com/', 'https://enfermeria.si/',
  'https://worldwinepedia.com/', 'https://worldwinepedia.com/es/', 'https://leypedia.com/', 'https://leypedia.com/ca/'];
function pide($url, $ua) {
  $c = curl_init($url);
  curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 20,
    CURLOPT_USERAGENT => $ua, CURLOPT_HTTPHEADER => ['Cache-Control: no-cache']]);
  $h = (string)curl_exec($c); $code = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  $m = function($p) use ($h) { return preg_match('/<meta[^>]+property=["\']' . $p . '["\'][^>]*content=["\']([^"\']*)/i', $h, $x) ? $x[1] : '-'; };
  return [$code, $m('og:title'), $m('og:image')];
}
foreach ($paginas as $u) {
  [$cn] = pide($u, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36');
  [$cw, $t, $i] = pide($u, 'WhatsApp/2.24.1 A');
  echo "$u\n  visitante $cn · WhatsApp $cw\n  título: $t\n  imagen: $i\n\n";
}
