<?php
/* Sitges Sí — baja RGPD de «La Caseta de te» (solicitud del titular, 8/11/2026).
 * Solo actúa sobre fichas del directorio cuyo nombre sea «La Caseta de te». Se puede ejecutar varias veces: si ya no está, no hace nada.
 * 1) Borra del todo la ficha (todas sus versiones e idiomas, metadatos, categorías y fotos propias).
 * 2) Apunta el nombre en la lista de bajas (opción ssi_bajas) e instala wp-content/mu-plugins/ssi-bajas.php,
 *    que impide que ninguna importación o formulario la vuelva a publicar.
 * 3) Vacía el índice del buscador y la caché. */
header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');
define('SSI_BAJA_RUN', true);
require dirname(__DIR__).'/wp-load.php';

$norm = function ($s) { $s = remove_accents(mb_strtolower(wp_strip_all_tags((string)$s))); return preg_replace('/[^a-z0-9]+/', '', $s); };
$baja = ['nombre'=>'La Caseta de te', 'n'=>['lacasetadete','casetadete','lacasetadeteSitges'], 'slug'=>'la-caseta-de-te', 'tel'=>'938940517',
         'fecha'=>'2026-11-08', 'motivo'=>'Supresión solicitada por el titular (RGPD)'];
$baja['n'] = array_values(array_unique(array_map($norm, $baja['n'])));

/* 1. Fichas */
global $wpdb;
$ids = $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_type='at_biz_dir' AND (post_name LIKE %s OR post_title LIKE %s)",
        $wpdb->esc_like('la-caseta-de-te').'%', '%'.$wpdb->esc_like('Caseta de t').'%'));
$borradas = 0;
foreach ($ids as $id) {
    $p = get_post($id); if (!$p || !in_array($norm($p->post_title), $baja['n'], true)) { echo "No se toca la ficha $id («".($p ? $p->post_title : '?')."»)\n"; continue; }
    $fotos = array_map('intval', get_children(['post_parent'=>$id, 'post_type'=>'attachment', 'fields'=>'ids', 'post_status'=>'any']));
    foreach (['_thumbnail_id', '_listing_prv_img', '_listing_img'] as $k) foreach ((array)get_post_meta($id, $k, true) as $a) if ((int)$a) $fotos[] = (int)$a;
    foreach (array_unique($fotos) as $a) {
        $usada = (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE post_id<>%d AND meta_key IN ('_thumbnail_id','_listing_prv_img') AND meta_value=%s", $id, (string)$a));
        if ($usada) { echo "Foto $a: la usa otra página, se deja\n"; continue; }
        echo 'Foto '.$a.': '.(wp_delete_attachment($a, true) ? 'borrada' : 'no se pudo borrar')."\n";
    }
    $titulo = $p->post_title;
    $ok = wp_delete_post($id, true);
    echo "Ficha $id «{$titulo}»: ".($ok ? 'borrada del todo' : 'ERROR al borrar')."\n";
    if ($ok) $borradas++;
}
if (!$ids) echo "No queda ninguna ficha de «La Caseta de te»\n";
/* Opiniones o comentarios que quedaran colgando */
$huerf = $wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE post_id NOT IN (SELECT ID FROM {$wpdb->posts})");
echo "Metadatos sueltos limpiados: ".(int)$huerf."\n";

/* 2. Lista de bajas + guardia permanente */
$lista = (array)get_option('ssi_bajas', []);
$ya = false; foreach ($lista as $b) if (($b['slug'] ?? '') === $baja['slug']) $ya = true;
if (!$ya) { $lista[] = $baja; update_option('ssi_bajas', $lista, true); echo "Añadida a la lista de bajas\n"; } else echo "Ya estaba en la lista de bajas\n";

$mu = WP_CONTENT_DIR.'/mu-plugins/ssi-bajas.php';
$codigo = <<<'MU'
<?php
/* Sitges Sí — bajas del directorio (RGPD).
 * Los negocios de la opción «ssi_bajas» han pedido no aparecer en sitges.si.
 * Si una importación, un trabajo o un formulario crea una ficha con ese nombre, teléfono o slug, se borra al momento.
 * Para dar de baja otro negocio, añádelo a la opción ssi_bajas (nombre, n = nombres normalizados, slug, tel). */
if (!defined('ABSPATH')) exit;
function ssi_bajas_norm($s) { $s = remove_accents(mb_strtolower(wp_strip_all_tags((string)$s))); return preg_replace('/[^a-z0-9]+/', '', $s); }
function ssi_bajas_es($id) {
    $p = get_post($id); if (!$p || $p->post_type !== 'at_biz_dir') return false;
    $n = ssi_bajas_norm($p->post_title); $tel = preg_replace('/\D+/', '', (string)get_post_meta($id, '_phone', true));
    foreach ((array)get_option('ssi_bajas', []) as $b) {
        if (in_array($n, (array)($b['n'] ?? []), true)) return true;
        if (!empty($b['slug']) && preg_match('/^'.preg_quote($b['slug'], '/').'(-\d+)?$/', $p->post_name)) return true;
        if (!empty($b['tel']) && $tel !== '' && substr($tel, -9) === $b['tel']) return true;
    }
    return false;
}
function ssi_bajas_check($id) {
    static $dentro = false; if ($dentro || wp_is_post_revision($id)) return;
    if (!ssi_bajas_es($id)) return;
    $dentro = true; wp_delete_post($id, true); $dentro = false;
}
add_action('wp_insert_post', function ($id) { ssi_bajas_check($id); }, 99);
add_action('updated_post_meta', function ($mid, $id, $key) { if ($key === '_phone') ssi_bajas_check($id); }, 99, 3);
add_action('added_post_meta', function ($mid, $id, $key) { if ($key === '_phone') ssi_bajas_check($id); }, 99, 3);
MU;
if (!is_dir(dirname($mu))) wp_mkdir_p(dirname($mu));
if (!is_file($mu) || file_get_contents($mu) !== $codigo) echo 'Guardia mu-plugins/ssi-bajas.php: '.(file_put_contents($mu, $codigo, LOCK_EX) ? 'instalada' : 'ERROR al escribir')."\n";
else echo "Guardia mu-plugins/ssi-bajas.php: ya instalada\n";

/* 3. Buscador y cachés */
foreach (['es','ca','en'] as $l) delete_transient('ssi_s2_idx_'.$l);
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '\_transient\_%atbdp%' OR option_name LIKE '\_transient\_timeout\_%atbdp%' OR option_name LIKE '\_transient\_%directorist%' OR option_name LIKE '\_transient\_timeout\_%directorist%'");
wp_cache_flush();
do_action('litespeed_purge_all');
if (!headers_sent()) header('X-LiteSpeed-Purge: *');
echo "Índice del buscador y caché vaciados\n";

/* Comprobación */
$quedan = (int)$wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='at_biz_dir' AND (post_name LIKE 'la-caseta-de-te%' OR post_title LIKE '%Caseta de t%')");
echo "Fichas de «La Caseta de te» que quedan: $quedan\n";
echo "Fichas borradas en esta ejecución: $borradas\n";
