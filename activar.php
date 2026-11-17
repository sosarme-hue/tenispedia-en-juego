<?php
// Activa la nueva clave de administrador de Zodiacopedia (17-11-2026).
// Solo funciona con la clave correcta en la URL: /_clave/activar.php?clave=LA_CLAVE
// Aquí solo está la huella (sha256) de la clave, nunca la clave.
const HUELLA = 'f62df7a377cf556f3dafb6d05ebb7c140cdf3d366cb71f4530b7c865de0fce0c';
header('Content-Type: text/html; charset=utf-8'); header('X-Robots-Tag: noindex'); header('Cache-Control: no-store');
$k = (string)($_GET['clave'] ?? '');
if ($k === '' || !hash_equals(HUELLA, hash('sha256', $k))) { http_response_code(403); exit('Clave no válida.'); }
$f = __DIR__ . '/../privado/admin.php';
$nuevo = "<?php\n// Huella (sha256) de la clave de administrador. La clave en sí no está guardada en ningún archivo de la web.\nreturn ['clave_admin_sha256' => '" . HUELLA . "'];\n";
if (is_file($f) && strpos((string)file_get_contents($f), HUELLA) !== false) exit('<p style="font:18px sans-serif">La clave ya estaba activada. <a href="/api/estadisticas.php?admin=' . htmlspecialchars($k) . '">Abrir estadísticas</a></p>');
@copy($f, __DIR__ . '/admin.php.antes');
if (file_put_contents($f, $nuevo, LOCK_EX) === false) { http_response_code(500); exit('No se ha podido guardar la clave.'); }
echo '<p style="font:18px sans-serif">Clave activada. <a href="/api/estadisticas.php?admin=' . htmlspecialchars($k) . '">Abrir estadísticas</a></p>';
