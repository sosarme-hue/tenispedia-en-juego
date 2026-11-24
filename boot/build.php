<?php
if (!defined('ABSPATH')) exit;
/* Montaje de cadaques.si en el servidor: idiomas, categorías, páginas en 3 idiomas, fotos, fichas (OpenStreetMap),
   calas y agenda. Se ejecuta al activar el plugin cuando cambia CQS_BUILD_VER. Cada paso se puede repetir sin duplicar.
   Resultado en out/build-log.json. */

/* Se lanza por WP-Cron (contexto de administración: Polylang crea idiomas ahí). Cada visita lo programa si falta. */
add_action('init', function () {
    if (get_option('cqs_build') === CQS_BUILD_VER || wp_doing_cron()) return;
    if (!wp_next_scheduled('cqs_build_event')) wp_schedule_single_event(time() - 1, 'cqs_build_event');
}, 99);
add_action('cqs_build_event', function () {
    ignore_user_abort(true);
    $r = cqs_build_tick();
    // Si queda algo, vuelve a lanzarse solo (hasta 12 veces), llamando a wp-cron.php desde el propio servidor
    $n = (int)get_option('cqs_build_chain', 0);
    if ($r === 'parcial' && $n < 12) {
        update_option('cqs_build_chain', $n + 1, false);
        wp_schedule_single_event(time() - 1, 'cqs_build_event');
        delete_transient('doing_cron');
        wp_remote_post(site_url('wp-cron.php?doing_wp_cron='.sprintf('%.22F', microtime(true))), ['timeout' => 0.01, 'blocking' => false, 'sslverify' => false]);
    }
});

/* También lo puede lanzar boot/run.php (cron de Hostinger, WordPress completo y sin límite de tiempo). Retoma donde lo dejó. */
function cqs_build_tick() {
    if (get_option('cqs_build') === CQS_BUILD_VER) return 'hecho';
    $lock = (int)get_option('cqs_build_lock'); if ($lock && time() - $lock < 240) return 'en marcha';
    update_option('cqs_build_lock', time(), false);
    cqs_build_run();
    delete_option('cqs_build_lock');
    return get_option('cqs_build') === CQS_BUILD_VER ? 'terminado' : 'parcial';
}

function cqs_req($data) { $r = new WP_REST_Request('POST'); $r->set_header('content-type', 'application/json'); $r->set_body(wp_json_encode($data)); return $r; }
function cqs_json($f) { return json_decode((string)file_get_contents(SSI_DIR.'data/'.$f), true); }

function cqs_build_run() {
    @set_time_limit(0); @ini_set('memory_limit', '512M');
    $done = (array)get_option('cqs_build_done', []); if (($done['_v'] ?? '') !== CQS_BUILD_VER) { $done = ['_v' => CQS_BUILD_VER]; update_option('cqs_build_chain', 0, false); }
    $log = json_decode((string)@file_get_contents(SSI_DIR.'out/build-log.json'), true); if (!is_array($log) || ($log['ver'] ?? '') !== CQS_BUILD_VER || count($done) < 2) $log = [];
    $log['started'] = gmdate('c'); $log['ver'] = CQS_BUILD_VER;
    if (!get_current_user_id()) wp_set_current_user(1);
    $steps = ['languages', 'cats', 'owner', 'images', 'photos', 'forms', 'pages', 'directorist', 'events', 'fichas', 'beaches', 'listing_photos', 'verify', 'public', 'menu'];
    $ok = true; $T0 = microtime(true);
    foreach ($steps as $s) {
        if (!empty($done[$s])) continue;
        if (microtime(true) - $T0 > 90) { $ok = false; break; } // tandas cortas: el resto en la siguiente llamada
        $t = microtime(true);
        try { $log[$s] = call_user_func('cqs_step_'.$s); $done[$s] = 1; }
        catch (Throwable $e) { $log[$s] = ['error' => $e->getMessage().' @ '.basename($e->getFile()).':'.$e->getLine()]; $ok = false; }
        $log['t_'.$s] = round(microtime(true) - $t, 1);
        update_option('cqs_build_done', $done, false);
        cqs_out('build-log.json', $log);
    }
    if (!$ok) { cqs_out('build-log.json', $log); return; }
    update_option('cqs_build', CQS_BUILD_VER);
    flush_rewrite_rules(false);
    do_action('litespeed_purge_all');
    $log['ended'] = gmdate('c');
    cqs_out('build-log.json', $log);
}

/* 1) Idiomas (Polylang) y lugares */
function cqs_step_languages() {
    if (!function_exists('eiv_setup_run')) throw new Exception('sin núcleo');
    if (!function_exists('PLL')) throw new Exception('sin Polylang');
    $r = eiv_setup_run(cqs_req(['languages' => true, 'locations' => ['Cadaqués'], 'event_cats' => ['Cadaqués'], 'guest_listings' => true]));
    $have = function_exists('pll_languages_list') ? (array)pll_languages_list(['fields' => 'slug']) : [];
    if (!in_array('fr', $have, true) && function_exists('PLL') && isset(PLL()->model)) {
        $res = PLL()->model->add_language(['name' => 'Français', 'slug' => 'fr', 'locale' => 'fr_FR', 'rtl' => 0, 'term_group' => 3, 'flag' => 'fr']);
        if (method_exists(PLL()->model, 'clean_languages_cache')) PLL()->model->clean_languages_cache();
        flush_rewrite_rules(false);
    }
    if (taxonomy_exists('tribe_events_cat') && !term_exists('fiestas', 'tribe_events_cat')) wp_insert_term('Fiestas', 'tribe_events_cat', ['slug' => 'fiestas']);
    return $r instanceof WP_REST_Response ? $r->get_data() : $r;
}

/* 2) Categorías del directorio, las mismas que en el resto de la red */
function cqs_step_cats() {
    $tax = 'at_biz_dir-category'; if (!taxonomy_exists($tax)) throw new Exception('no existe la taxonomía');
    $n = 0; $u = 0;
    foreach (cqs_json('cats.json') as $c) {
        $parent = 0;
        if ($c['parent']) { $p = get_term_by('slug', $c['parent'], $tax); $parent = $p ? (int)$p->term_id : 0; }
        $t = get_term_by('slug', $c['slug'], $tax);
        if ($t) { if ($t->name !== $c['name'] || (int)$t->parent !== $parent) { wp_update_term($t->term_id, $tax, ['name' => $c['name'], 'parent' => $parent]); $u++; } }
        else { $r = wp_insert_term($c['name'], $tax, ['slug' => $c['slug'], 'parent' => $parent]); if (!is_wp_error($r)) $n++; }
    }
    return "$n creadas, $u actualizadas";
}

/* 3) Titular de la web: el mismo que el de la red (dato público del aviso legal de eivissa.si; no se guarda en el repositorio) */
function cqs_step_owner() {
    $o = get_option('ssi_owner'); if (is_array($o) && !empty($o['nif'])) return 'ya estaba';
    $r = wp_remote_get('https://eivissa.si/wp-json/wp/v2/pages/102?_fields=content', ['timeout' => 20]);
    $c = wp_strip_all_tags(html_entity_decode((string)(json_decode(wp_remote_retrieve_body($r), true)['content']['rendered'] ?? ''), ENT_QUOTES));
    if (!preg_match('/Titular:\s*(.+?)\s*·\s*NIF:\s*(\S+)\s*·\s*Domicilio:\s*(.+?)\s*·/u', $c, $m)) return 'no encontrado';
    $o = ['nombre' => trim($m[1]), 'nif' => trim($m[2]), 'direccion' => trim($m[3]), 'email' => 'info@cadaques.si'];
    $o += ['name' => $o['nombre'], 'address' => $o['direccion']];
    update_option('ssi_owner', $o);
    return 'guardado';
}

/* 4) Fotos de Unsplash: se descargan a la biblioteca de medios */
function cqs_step_images() {
    require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/image.php';
    $have = (array)get_option('cqs_imgs', []); $out = [];
    foreach (cqs_json('images.json') as $k => $im) {
        if (!empty($have[$k]) && get_post($have[$k])) { $out[$k] = 'ya estaba'; continue; }
        $raw = $im['raw'];
        if (!$raw) { // la foto de la página de Unsplash (og:image)
            $h = wp_remote_retrieve_body(wp_remote_get('https://unsplash.com/photos/'.$im['id'], ['timeout' => 20, 'user-agent' => 'Mozilla/5.0 (compatible; CadaquesSi/1.0)']));
            if (preg_match('#https://images\.unsplash\.com/(photo-[A-Za-z0-9_-]+)#', $h, $m)) $raw = $m[1];
        }
        $src = $raw ? 'https://images.unsplash.com/'.$raw.'?w=1600&q=78&fm=jpg&fit=max' : 'https://unsplash.com/photos/'.$im['id'].'/download?force=true&w=1600';
        $tmp = download_url($src, 60);
        if (is_wp_error($tmp)) { $out[$k] = 'error: '.$tmp->get_error_message(); continue; }
        $file = ['name' => 'cadaques-'.$k.'.jpg', 'tmp_name' => $tmp];
        $id = media_handle_sideload($file, 0, $im['alt']['es']);
        if (is_wp_error($id)) { @unlink($tmp); $out[$k] = 'error: '.$id->get_error_message(); continue; }
        update_post_meta($id, '_wp_attachment_image_alt', $im['alt']['es']);
        update_post_meta($id, '_cqs_credit', $im['by'].' · Unsplash');
        $have[$k] = $id; update_option('cqs_imgs', $have);
        $out[$k] = $id;
    }
    return $out;
}

/* Registro de fotos y créditos: cqs_imgs[clave] = id de adjunto; cqs_credits[clave] = alt por idioma, autor, licencia, fuente */
function cqs_credit_set($k, $id, $alt, $by, $lic, $src) {
    $c = (array)get_option('cqs_credits', []); $c[$k] = ['id' => (int)$id, 'alt' => $alt, 'by' => $by, 'lic' => $lic, 'src' => $src];
    update_option('cqs_credits', $c, false);
    $i = (array)get_option('cqs_imgs', []); $i[$k] = (int)$id; update_option('cqs_imgs', $i);
}
function cqs_fill($html, $l) {
    $imgs = (array)get_option('cqs_imgs', []); $cr = (array)get_option('cqs_credits', []);
    $html = preg_replace_callback('/\{\{img:([a-z0-9_]+)\}\}/', function ($m) use ($imgs) {
        $id = $imgs[$m[1]] ?? 0; $u = $id ? wp_get_attachment_image_url($id, 'large') : '';
        return $u ?: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    }, $html);
    // Tarjetas cuya foto no se encontró: sin foto
    $html = str_replace(' cq-img"', '"', preg_replace('/ cq-img([^"]*)" style="--img:url\(data:image[^)]*\)"/', '$1"', $html));
    $html = preg_replace_callback('/\{\{cf7:([a-z]+):([a-z]+)\}\}/', function ($m) {
        $f = (array)get_option('cqs_cf7', []); return (string)($f[$m[1]][$m[2]] ?? $f[$m[1]]['es'] ?? 0);
    }, $html);
    if (strpos($html, '{{hist}}') !== false) {
        $H = ['es' => ['Cadaqués en fotos antiguas', 'Imágenes de dominio público o con licencia libre, de Wikimedia Commons.'], 'ca' => ['Cadaqués en fotos antigues', 'Imatges de domini públic o amb llicència lliure, de Wikimedia Commons.'],
              'en' => ['Cadaqués in old photographs', 'Public-domain or freely licensed images from Wikimedia Commons.'], 'fr' => ['Cadaqués en photos anciennes', 'Images du domaine public ou sous licence libre, issues de Wikimedia Commons.']][$l];
        $g = '';
        foreach ($cr as $k => $c) if (strpos($k, 'hist_') === 0 && $c['id']) {
            $g .= '<figure class="cq-fig"><img src="'.esc_url(wp_get_attachment_image_url($c['id'], 'medium_large')).'" alt="'.esc_attr($c['alt'][$l] ?? '').'" loading="lazy">'
                .'<figcaption>'.esc_html($c['alt'][$l] ?? '').' · <a href="'.esc_url($c['src']).'" target="_blank" rel="noopener">'.esc_html($c['by']).' · '.esc_html($c['lic']).'</a></figcaption></figure>';
        }
        $html = str_replace('{{hist}}', $g ? '<h2 class="wp-block-heading ssi-h2">'.$H[0].'</h2><p class="ssi-lead-mute">'.$H[1].'</p><div class="cq-gallery">'.$g.'</div>' : '', $html);
    }
    if (strpos($html, '{{credits}}') !== false) {
        $c = '<div class="cq-gallery cq-credits">';
        foreach ($cr as $k => $x) {
            if (!$x['id'] || !get_post($x['id'])) continue;
            $c .= '<figure class="cq-fig"><img src="'.esc_url(wp_get_attachment_image_url($x['id'], 'medium_large')).'" alt="'.esc_attr($x['alt'][$l] ?? '').'" loading="lazy">'
                .'<figcaption>'.esc_html($x['alt'][$l] ?? '').'<br><a href="'.esc_url($x['src']).'" target="_blank" rel="noopener">'.esc_html($x['by']).'</a> · '.esc_html($x['lic']).'</figcaption></figure>';
        }
        $html = str_replace('{{credits}}', $c.'</div>', $html);
    }
    return $html;
}

/* 4b) Más fotos: Wikimedia Commons (artículos de Viquipèdia o búsqueda, solo licencias libres) y Unsplash */
function cqs_wm_get($url) {
    $r = wp_remote_get($url, ['timeout' => 25, 'user-agent' => 'CadaquesSi/1.0 (https://cadaques.si; info@cadaques.si) WordPress']);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) return null;
    usleep(400000);
    return json_decode(wp_remote_retrieve_body($r), true);
}
function cqs_wm_info($titles) { // imageinfo de varios archivos File:...
    $q = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1600&titles='.rawurlencode(implode('|', $titles));
    $j = cqs_wm_get($q); $out = [];
    foreach ((array)($j['query']['pages'] ?? []) as $p) if (!empty($p['imageinfo'][0])) $out[$p['title']] = $p['imageinfo'][0];
    return $out;
}
function cqs_wm_ok($ii, $hist = false) {
    if (($ii['mime'] ?? '') !== 'image/jpeg' || ($ii['width'] ?? 0) < ($hist ? 600 : 1000)) return false;
    $m = $ii['extmetadata'] ?? []; $lic = (string)($m['LicenseShortName']['value'] ?? '');
    if (!preg_match('/^(CC BY|CC-BY|CC0|Public domain|PD)/i', $lic) || preg_match('/NC|ND/', $lic)) return false;
    if ($hist) { $d = strip_tags((string)($m['DateTimeOriginal']['value'] ?? '')); if (!preg_match('/\b(18[5-9]\d|19[0-5]\d)\b/', $d)) return false; }
    return true;
}
function cqs_wm_candidates($try) {
    if (strpos($try, 'wiki:') === 0) {
        [, $lang, $title] = explode(':', $try, 3);
        $j = cqs_wm_get("https://$lang.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=".rawurlencode($title));
        foreach ((array)($j['query']['pages'] ?? []) as $p) if (!empty($p['pageimage'])) return ['File:'.$p['pageimage']];
        return [];
    }
    $q = substr($try, 7);
    $j = cqs_wm_get('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=20&srsearch='.rawurlencode($q.' filetype:bitmap'));
    return array_map(fn($x) => $x['title'], (array)($j['query']['search'] ?? []));
}
function cqs_wm_sideload($key, $title, $ii, $alt) {
    $m = $ii['extmetadata'] ?? [];
    $by = trim(wp_strip_all_tags(html_entity_decode((string)($m['Artist']['value'] ?? ''), ENT_QUOTES))) ?: 'Wikimedia Commons';
    $by = mb_substr(preg_replace('/\s+/', ' ', $by), 0, 80);
    $lic = trim((string)($m['LicenseShortName']['value'] ?? ''));
    $tmp = download_url($ii['thumburl'] ?? $ii['url'], 60); if (is_wp_error($tmp)) return null;
    $id = media_handle_sideload(['name' => 'cadaques-'.str_replace('_', '-', $key).'.jpg', 'tmp_name' => $tmp], 0, $alt['es']);
    if (is_wp_error($id)) { @unlink($tmp); return null; }
    update_post_meta($id, '_wp_attachment_image_alt', $alt['es']); update_post_meta($id, '_cqs_credit', $by.' · '.$lic);
    cqs_credit_set($key, $id, $alt, $by.' (Wikimedia Commons)', $lic, $ii['descriptionurl'] ?? 'https://commons.wikimedia.org/wiki/'.rawurlencode($title));
    return ['title' => $title, 'by' => $by, 'lic' => $lic, 'id' => $id];
}
function cqs_step_photos() {
    require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/image.php';
    $P = cqs_json('photos.json'); $cr = (array)get_option('cqs_credits', []); $rep = []; $used = [];
    foreach ($cr as $c) if (!empty($c['src'])) $used[$c['src']] = 1;
    // Fotos de Unsplash de la primera tanda: también al registro de créditos
    foreach (cqs_json('images.json') as $k => $im) { $id = ((array)get_option('cqs_imgs', []))[$k] ?? 0; if ($id && empty($cr[$k])) cqs_credit_set($k, $id, $im['alt'], $im['by'].' (Unsplash)', 'Unsplash', 'https://unsplash.com/photos/'.$im['id']); }
    foreach ($P['unsplash'] as $k => $u) {
        if (!empty($cr[$k]['id']) && get_post($cr[$k]['id'])) { $rep[$k] = 'ya estaba'; continue; }
        $tmp = download_url('https://images.unsplash.com/'.$u['raw'].'?w=1600&q=78&fm=jpg&fit=max', 60);
        if (is_wp_error($tmp)) { $rep[$k] = 'error descarga'; continue; }
        $id = media_handle_sideload(['name' => 'cadaques-'.str_replace('_', '-', $k).'.jpg', 'tmp_name' => $tmp], 0, $u['alt']['es']);
        if (is_wp_error($id)) { @unlink($tmp); $rep[$k] = 'error'; continue; }
        update_post_meta($id, '_wp_attachment_image_alt', $u['alt']['es']);
        cqs_credit_set($k, $id, $u['alt'], $u['by'].' (Unsplash)', 'Unsplash', 'https://unsplash.com/photos/'.$u['id']); $rep[$k] = $id;
    }
    foreach ($P['commons'] as $k => $c) {
        if (!empty($cr[$k]['id']) && get_post($cr[$k]['id'])) { $rep[$k] = 'ya estaba'; continue; }
        $done = null;
        foreach ($c['try'] as $try) {
            $cands = array_slice(cqs_wm_candidates($try), 0, 12); if (!$cands) continue;
            $info = cqs_wm_info($cands);
            foreach ($cands as $t) { $ii = $info[$t] ?? null; if (!$ii || !cqs_wm_ok($ii) || isset($used[$ii['descriptionurl'] ?? ''])) continue;
                $done = cqs_wm_sideload($k, $t, $ii, $c['alt']); if ($done) { $done['via'] = $try; $used[$ii['descriptionurl'] ?? ''] = 1; break 2; } }
        }
        $rep[$k] = $done ?: 'no encontrada';
    }
    // Fotos antiguas para Historia: solo si el archivo es de Cadaqués (quita las de otros pueblos de tandas anteriores)
    $isCq = fn($t) => (bool)preg_match('/cadaqu/i', remove_accents(rawurldecode((string)$t)));
    $cr = (array)get_option('cqs_credits', []); $imgs = (array)get_option('cqs_imgs', []);
    foreach ($cr as $k => $c) if (strpos($k, 'hist_') === 0 && !$isCq($c['src'] ?? '')) { if (!empty($c['id'])) wp_delete_attachment($c['id'], true); unset($cr[$k], $imgs[$k]); $rep[$k] = 'quitada (no es de Cadaqués)'; }
    update_option('cqs_credits', $cr, false); update_option('cqs_imgs', $imgs);
    foreach ($cr as $c) if (!empty($c['src'])) $used[$c['src']] = 1;
    $n = count(array_filter(array_keys($cr), fn($k) => strpos($k, 'hist_') === 0));
    $free = function () use (&$cr) { $i = 1; while (isset($cr['hist_'.$i])) $i++; return 'hist_'.$i; };
    foreach ($P['hist']['try'] as $try) {
        if ($n >= $P['hist']['n']) break;
        $cands = array_slice(cqs_wm_candidates($try), 0, 20); if (!$cands) continue;
        $info = cqs_wm_info($cands);
        foreach ($cands as $t) { if ($n >= $P['hist']['n']) break; $ii = $info[$t] ?? null; if (!$ii || !$isCq($t) || !cqs_wm_ok($ii, true) || isset($used[$ii['descriptionurl'] ?? ''])) continue;
            $d = strip_tags((string)($ii['extmetadata']['DateTimeOriginal']['value'] ?? '')); preg_match('/\b(1[89]\d\d)\b/', $d, $y);
            $alt = $P['hist']['alt']; if (!empty($y[1])) foreach ($alt as $L => $a) $alt[$L] = $a.' ('.$y[1].')';
            $hk = $free(); $r = cqs_wm_sideload($hk, $t, $ii, $alt); if ($r) { $cr = (array)get_option('cqs_credits', []); $used[$ii['descriptionurl'] ?? ''] = 1; $n++; $rep[$hk] = $r; } }
    }
    cqs_out('photos-report.json', $rep);
    return ['fotos' => count(array_filter($rep, 'is_array')) + count(array_filter($rep, 'is_int')), 'sin_foto' => array_keys(array_filter($rep, fn($x) => $x === 'no encontrada')), 'antiguas' => $n];
}

/* 4c) Formularios de «Tu opinión» (Contact Form 7), uno por idioma, como en castelldefels.si */
function cqs_step_forms() {
    if (!class_exists('WPCF7_ContactForm')) throw new Exception('sin Contact Form 7');
    $to = get_option('cqs_forms_to') ?: 'info@cadaques.si';
    $L = [
     'es' => ['pn' => 'Nombre y apellidos *', 'pb' => 'Nombre del negocio *', 'pt' => 'Teléfono', 'ps' => 'Sector', 'popts' => '"Restauración" "Alojamiento" "Comercio" "Servicios profesionales" "Salud y bienestar" "Ocio y cultura" "Náutica y excursiones" "Otro"', 'pw' => 'Web actual (si tienes)', 'pi' => '¿Qué te interesa?', 'piopts' => '"Web nueva" "Renovar mi web" "Ficha destacada en Cadaqués Sí" "Promoción en redes sociales" "Mantenimiento"', 'pm' => 'Cuéntanos un poco más', 'psend' => 'Pedir propuesta', 'name' => 'Tu nombre (opcional)', 'email' => 'Tu correo *', 'about' => '¿Sobre qué?', 'opts' => '"Idea o sugerencia" "Corrección de un dato" "Un negocio o entidad" "Otro"', 'msg' => 'Mensaje *', 'ok' => 'He leído la <a href="/politica-de-privacidad/" target="_blank">política de privacidad</a>.', 'send' => 'Enviar',
              'biz' => 'Nombre del establecimiento *', 'link' => 'Enlace a la ficha (opcional)', 'what' => '¿Qué ha cambiado?', 'wopts' => '"Horario" "Teléfono, web o correo" "Dirección" "Ha cerrado" "Quiero verificar la ficha a mi nombre" "Quiero que se borre la ficha (baja)" "Otro"', 'right' => 'Dato correcto *', 'rel' => 'Tu relación con el sitio', 'ropts' => '"Soy cliente o vecino" "Soy el propietario o trabajo allí"',
              'ev' => 'Nombre del evento *', 'date' => 'Fecha y hora *', 'dph' => 'Ej.: sábado 25 de enero, 18 h', 'place' => 'Lugar *', 'org' => 'Organiza', 'desc' => 'Descripción y enlace', 'evsend' => 'Enviar el evento', 't' => ['idea' => 'Propón una idea', 'ficha' => 'Corrige una ficha', 'evento' => 'Envía tu evento', 'propuesta' => 'Pide tu propuesta']],
     'ca' => ['pn' => 'Nom i cognoms *', 'pb' => 'Nom del negoci *', 'pt' => 'Telèfon', 'ps' => 'Sector', 'popts' => '"Restauració" "Allotjament" "Comerç" "Serveis professionals" "Salut i benestar" "Lleure i cultura" "Nàutica i excursions" "Altres"', 'pw' => 'Web actual (si en tens)', 'pi' => 'Què t’interessa?', 'piopts' => '"Web nova" "Renovar la meva web" "Fitxa destacada a Cadaqués Sí" "Promoció a les xarxes socials" "Manteniment"', 'pm' => 'Explica’ns una mica més', 'psend' => 'Demana la proposta', 'name' => 'El teu nom (opcional)', 'email' => 'El teu correu *', 'about' => 'Sobre què?', 'opts' => '"Idea o suggeriment" "Correcció d’una dada" "Un negoci o entitat" "Altres"', 'msg' => 'Missatge *', 'ok' => 'He llegit la <a href="/ca/politica-de-privacitat/" target="_blank">política de privacitat</a>.', 'send' => 'Envia',
              'biz' => 'Nom de l’establiment *', 'link' => 'Enllaç a la fitxa (opcional)', 'what' => 'Què ha canviat?', 'wopts' => '"Horari" "Telèfon, web o correu" "Adreça" "Ha tancat" "Vull verificar la fitxa al meu nom" "Vull que s’esborri la fitxa (baixa)" "Altres"', 'right' => 'Dada correcta *', 'rel' => 'La teva relació amb el lloc', 'ropts' => '"Soc client o veí" "Soc el propietari o hi treballo"',
              'ev' => 'Nom de l’esdeveniment *', 'date' => 'Data i hora *', 'dph' => 'Ex.: dissabte 25 de gener, 18 h', 'place' => 'Lloc *', 'org' => 'Organitza', 'desc' => 'Descripció i enllaç', 'evsend' => 'Envia l’esdeveniment', 't' => ['idea' => 'Proposa una idea', 'ficha' => 'Corregeix una fitxa', 'evento' => 'Envia el teu esdeveniment', 'propuesta' => 'Demana la teva proposta']],
     'en' => ['pn' => 'Full name *', 'pb' => 'Business name *', 'pt' => 'Phone', 'ps' => 'Sector', 'popts' => '"Food and drink" "Accommodation" "Shop" "Professional services" "Health and wellbeing" "Leisure and culture" "Boats and tours" "Other"', 'pw' => 'Current website (if any)', 'pi' => 'What are you interested in?', 'piopts' => '"New website" "Redesign my website" "Featured listing on Cadaqués Sí" "Social media promotion" "Maintenance"', 'pm' => 'Tell us a bit more', 'psend' => 'Ask for a proposal', 'name' => 'Your name (optional)', 'email' => 'Your email *', 'about' => 'What about?', 'opts' => '"Idea or suggestion" "Correcting a detail" "A business or organisation" "Other"', 'msg' => 'Message *', 'ok' => 'I have read the <a href="/en/privacy-policy/" target="_blank">privacy policy</a>.', 'send' => 'Send',
              'biz' => 'Business name *', 'link' => 'Link to the listing (optional)', 'what' => 'What has changed?', 'wopts' => '"Opening hours" "Phone, website or email" "Address" "It has closed" "I want to verify the listing in my name" "I want the listing removed" "Other"', 'right' => 'Correct details *', 'rel' => 'Your connection to the place', 'ropts' => '"I’m a customer or local" "I’m the owner or work there"',
              'ev' => 'Event name *', 'date' => 'Date and time *', 'dph' => 'E.g. Saturday 25 January, 6 pm', 'place' => 'Venue *', 'org' => 'Organiser', 'desc' => 'Description and link', 'evsend' => 'Send the event', 't' => ['idea' => 'Suggest an idea', 'ficha' => 'Fix a listing', 'evento' => 'Send your event', 'propuesta' => 'Ask for a proposal']],
     'fr' => ['pn' => 'Nom et prénom *', 'pb' => 'Nom du commerce *', 'pt' => 'Téléphone', 'ps' => 'Secteur', 'popts' => '"Restauration" "Hébergement" "Commerce" "Services professionnels" "Santé et bien-être" "Loisirs et culture" "Nautisme et excursions" "Autre"', 'pw' => 'Site actuel (le cas échéant)', 'pi' => 'Qu’est-ce qui vous intéresse ?', 'piopts' => '"Nouveau site" "Refaire mon site" "Fiche mise en avant sur Cadaqués Sí" "Promotion sur les réseaux sociaux" "Maintenance"', 'pm' => 'Dites-nous en un peu plus', 'psend' => 'Demander un devis', 'name' => 'Votre nom (facultatif)', 'email' => 'Votre e-mail *', 'about' => 'À quel sujet ?', 'opts' => '"Idée ou suggestion" "Correction d’une information" "Un commerce ou une association" "Autre"', 'msg' => 'Message *', 'ok' => 'J’ai lu la <a href="/fr/politique-de-confidentialite/" target="_blank">politique de confidentialité</a>.', 'send' => 'Envoyer',
              'biz' => 'Nom de l’établissement *', 'link' => 'Lien vers la fiche (facultatif)', 'what' => 'Qu’est-ce qui a changé ?', 'wopts' => '"Horaires" "Téléphone, site ou e-mail" "Adresse" "Il a fermé" "Je veux vérifier la fiche à mon nom" "Je veux que la fiche soit supprimée" "Autre"', 'right' => 'Information correcte *', 'rel' => 'Votre lien avec l’établissement', 'ropts' => '"Je suis client ou habitant" "Je suis le propriétaire ou j’y travaille"',
              'ev' => 'Nom de l’événement *', 'date' => 'Date et heure *', 'dph' => 'Ex. : samedi 25 janvier, 18 h', 'place' => 'Lieu *', 'org' => 'Organisateur', 'desc' => 'Description et lien', 'evsend' => 'Envoyer l’événement', 't' => ['idea' => 'Proposez une idée', 'ficha' => 'Corrigez une fiche', 'evento' => 'Envoyez votre événement', 'propuesta' => 'Demandez votre devis']],
    ];
    $ids = (array)get_option('cqs_cf7', []);
    foreach ($L as $l => $x) {
        $acc = '[acceptance acepto] '.$x['ok'].' [/acceptance]';
        $F = [
         'idea' => "<label>{$x['name']} [text your-name]</label>\n<label>{$x['email']} [email* your-email]</label>\n<label>{$x['about']} [select tema {$x['opts']}]</label>\n<label>{$x['msg']} [textarea* your-message maxlength:2000]</label>\n$acc\n[submit \"{$x['send']}\"]",
         'ficha' => "<label>{$x['biz']} [text* fix-business]</label>\n<label>{$x['link']} [url fix-link placeholder \"https://cadaques.si/…\"]</label>\n<label>{$x['what']} [select fix-what {$x['wopts']}]</label>\n<label>{$x['right']} [textarea* fix-body maxlength:2000]</label>\n<label>{$x['rel']} [radio fix-relation default:1 {$x['ropts']}]</label>\n<label>{$x['name']} [text your-name]</label>\n<label>{$x['email']} [email* your-email]</label>\n$acc\n[submit \"{$x['send']}\"]",
         'propuesta' => "<label>{$x['pn']} [text* your-name]</label>\n<label>{$x['pb']} [text* negocio]</label>\n<label>{$x['email']} [email* your-email]</label>\n<label>{$x['pt']} [tel telefono]</label>\n<label>{$x['ps']} [select sector include_blank {$x['popts']}]</label>\n<label>{$x['pw']} [url web-actual]</label>\n<fieldset><legend>{$x['pi']}</legend>[checkbox interes use_label_element {$x['piopts']}]</fieldset>\n<label>{$x['pm']} [textarea mensaje maxlength:2000]</label>\n$acc\n[submit \"{$x['psend']}\"]",
         'evento' => "<label>{$x['ev']} [text* evento]</label>\n<label>{$x['date']} [text* fecha placeholder \"{$x['dph']}\"]</label>\n<label>{$x['place']} [text* lugar]</label>\n<label>{$x['org']} [text organiza]</label>\n<label>{$x['desc']} [textarea descripcion maxlength:2000]</label>\n<label>{$x['email']} [email* your-email]</label>\n$acc\n[submit \"{$x['evsend']}\"]",
        ];
        foreach ($F as $k => $form) {
            $cf = !empty($ids[$k][$l]) ? WPCF7_ContactForm::get_instance($ids[$k][$l]) : null;
            if (!$cf) $cf = WPCF7_ContactForm::get_template(['locale' => ['es' => 'es_ES', 'ca' => 'ca', 'en' => 'en_GB', 'fr' => 'fr_FR'][$l]]);
            $cf->set_title('Cadaqués Sí · '.$x['t'][$k].' ('.$l.')');
            $body = "[_site_title] · {$x['t'][$k]} ($l)\n\n[_raw_*]\n\n--\n[_url]";
            $cf->set_properties(['form' => $form, 'mail' => ['active' => true, 'subject' => '[_site_title] · '.$x['t'][$k], 'sender' => '[_site_title] <wordpress@cadaques.si>',
                'recipient' => $to, 'body' => $body, 'additional_headers' => 'Reply-To: [your-email]', 'attachments' => '', 'use_html' => false, 'exclude_blank' => true],
                'additional_settings' => "acceptance_as_validation: on"]);
            $id = $cf->save(); $ids[$k][$l] = (int)$id;
        }
    }
    update_option('cqs_cf7', $ids);
    return $ids;
}

/* 10) Fotos en las fichas: calas y lugares con foto propia */
function cqs_step_listing_photos() {
    $cr = (array)get_option('cqs_credits', []); $out = [];
    $map = ['cqs:platja:platja-gran' => 'cm_platjagran', 'cqs:platja:es-poal' => 'cm_poal', 'cqs:platja:es-llane' => 'cm_llane', 'cqs:platja:sa-conca' => 'cm_conca',
            'cqs:platja:portlligat' => 'cm_portlligat', 'cqs:platja:cala-nans' => 'cm_calanans', 'cqs:platja:cala-guillola' => 'cm_guillola', 'cqs:platja:cala-culip' => 'cm_culip'];
    $byname = ['/casa.?museu.*dal[ií]|dal[ií].*house|portlligat.*museu/i' => 'cm_dalihouse', '/museu de cadaqu/i' => 'cm_museu', '/santa maria/i' => 'cm_church', '/far.*cap de creus|cap de creus.*far/i' => 'cm_capfar', '/cala nans/i' => 'cm_calanans'];
    foreach (get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => -1, 'lang' => '', 'suppress_filters' => true]) as $p) {
        $src = (string)get_post_meta($p->ID, '_ssi_source', true); $k = $map[$src] ?? null;
        if (!$k && preg_match('/\b(not|no)\b/i', $p->post_title)) { // p. ej. "This is not Dalí's House": no es el museo, se le quita la foto si se le puso
            $dh = (int)($cr['cm_dalihouse']['id'] ?? 0);
            if ($dh && (int)get_post_meta($p->ID, '_listing_prv_img', true) === $dh) { delete_post_meta($p->ID, '_listing_prv_img'); delete_post_meta($p->ID, '_listing_img'); delete_post_thumbnail($p->ID); }
            continue;
        }
        if (!$k) foreach ($byname as $re => $kk) if (preg_match($re, $p->post_title)) { $k = $kk; break; }
        if (!$k || empty($cr[$k]['id'])) continue;
        $id = (int)$cr[$k]['id'];
        update_post_meta($p->ID, '_listing_prv_img', $id); update_post_meta($p->ID, '_listing_img', [$id]); set_post_thumbnail($p->ID, $id);
        $out[$p->post_title] = $k;
    }
    return $out;
}

/* 5) Páginas en castellano, catalán e inglés, enlazadas como traducciones */
function cqs_step_pages() {
    if (!function_exists('pll_set_post_language')) throw new Exception('sin Polylang');
    $data = cqs_json('pages.json'); $ids = []; $groups = []; $n = 0;
    foreach ($data as $key => $by) {
        $g = [];
        foreach ($by as $l => $p) {
            $ex = get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '',
                'meta_query' => [['key' => '_cqs_key', 'value' => $key.':'.$l]], 'suppress_filters' => true]);
            $post = ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_content' => cqs_fill($p['content'], $l), 'comment_status' => 'closed'];
            if ($ex) $post['ID'] = (int)$ex[0];
            kses_remove_filters();
            $id = $ex ? wp_update_post(wp_slash($post), true) : wp_insert_post(wp_slash($post), true);
            kses_init_filters();
            if (is_wp_error($id)) { $ids[$key.':'.$l] = $id->get_error_message(); continue; }
            update_post_meta($id, '_cqs_key', $key.':'.$l);
            pll_set_post_language($id, $l);
            $g[$l] = $id; $n++;
        }
        $groups[] = $g; if (!empty($g['es'])) $ids[$key] = $g['es'];
    }
    // Las páginas creadas antes por WordPress (Página de ejemplo, etc.) se pasan a borrador
    foreach (get_posts(['post_type' => 'page', 'post_status' => 'publish', 'numberposts' => -1, 'lang' => '', 'suppress_filters' => true]) as $p)
        if (!get_post_meta($p->ID, '_cqs_key', true) && in_array($p->post_name, ['sample-page', 'pagina-ejemplo', 'privacy-policy', 'politica-privacidad'], true)) wp_update_post(['ID' => $p->ID, 'post_status' => 'draft']);
    // Claves que usa el núcleo con otro nombre en esta guía
    $page_ids = array_filter($ids, 'is_int');
    $page_ids += ['barrios' => $page_ids['visit'] ?? 0, 'eat' => $page_ids['eat'] ?? 0];
    $r = eiv_setup_run(cqs_req(['groups' => $groups, 'page_ids' => $page_ids, 'front' => $page_ids['home'] ?? 0]));
    update_option('blogname', 'Cadaqués Sí'); update_option('blogdescription', 'La guía de Cadaqués');
    update_option('permalink_structure', '/%postname%/');
    return ['paginas' => $n, 'setup' => $r instanceof WP_REST_Response ? $r->get_data() : $r];
}

/* 6) Directorist: la página «Añade tu negocio» es la del formulario */
function cqs_step_directorist() {
    $ids = (array)get_option('ssi_page_ids'); $o = get_option('atbdp_option');
    if (!is_array($o) || empty($ids['add'])) throw new Exception('sin opciones');
    $o['add_listing_page'] = (int)$ids['add']; $o['guest_listings'] = 1;
    update_option('atbdp_option', $o);
    return 'ok';
}

/* 7) Agenda: fiestas y fechas fijas (orientativas, a confirmar con el Ayuntamiento) */
function cqs_step_events() {
    if (!function_exists('tribe_create_event')) throw new Exception('sin The Events Calendar');
    $note = ['es' => 'Fechas orientativas: confirma el programa con el Ayuntamiento de Cadaqués.', 'ca' => 'Dates orientatives: confirma el programa amb l’Ajuntament de Cadaqués.', 'en' => 'Dates are approximate: check the programme with Cadaqués Town Hall.'];
    $ev = [
      ['k' => 'fm-hivern-2026', 's' => '2026-12-18 00:00', 'e' => '2026-12-20 23:59',
       't' => ['Festa Major d’Hivern de Cadaqués', 'Festa Major d’Hivern de Cadaqués', 'Cadaqués Winter Festa Major'],
       'c' => ['La fiesta mayor de invierno, en honor a Santa Esperança: misa, sardanas, conciertos y baile en el pueblo.', 'La festa major d’hivern, en honor de Santa Esperança: missa, sardanes, concerts i ball al poble.', 'The winter festival in honour of Santa Esperança: mass, sardanas, concerts and dancing in the village.']],
      ['k' => 'primer-sol-2027', 's' => '2027-01-01 07:00', 'e' => '2027-01-01 09:30',
       't' => ['Primer sol del año en el Cap de Creus', 'Primer sol de l’any al Cap de Creus', 'First sunrise of the year at Cap de Creus'],
       'c' => ['Cada 1 de enero mucha gente sube al faro del Cap de Creus para ver salir el primer sol de la península. Ve con tiempo y abrígate.', 'Cada 1 de gener molta gent puja al far del Cap de Creus per veure sortir el primer sol de la península. Ves-hi amb temps i abriga’t.', 'Every 1 January many people head to Cap de Creus lighthouse to watch the first sunrise on the peninsula. Go early and wrap up warm.']],
      ['k' => 'reis-2027', 's' => '2027-01-05 18:00', 'e' => '2027-01-05 20:30',
       't' => ['Cabalgata de Reyes', 'Cavalcada de Reis', 'Three Kings Parade'],
       'c' => ['Los Reyes Magos llegan a Cadaqués la tarde del 5 de enero.', 'Els Reis d’Orient arriben a Cadaqués la tarda del 5 de gener.', 'The Three Kings arrive in Cadaqués on the evening of 5 January.']],
    ];
    $out = [];
    foreach ($ev as $e) {
        $ex = get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $e['k'], 'suppress_filters' => true, 'lang' => '']);
        if ($ex) { $out[$e['k']] = 'ya estaba'; continue; }
        [$sd, $st] = explode(' ', $e['s']); [$ed, $et] = explode(' ', $e['e']);
        $args = ['post_title' => $e['t'][0], 'post_content' => '<p>'.$e['c'][0].'</p><p><em>'.$note['es'].'</em></p>', 'post_status' => 'publish',
            'EventStartDate' => $sd, 'EventEndDate' => $ed, 'EventStartHour' => substr($st, 0, 2), 'EventStartMinute' => substr($st, 3, 2), 'EventEndHour' => substr($et, 0, 2), 'EventEndMinute' => substr($et, 3, 2),
            'EventAllDay' => $st === '00:00' ? 'yes' : '', 'EventTimezone' => 'Europe/Madrid', 'Venue' => ['Venue' => 'Cadaqués', 'City' => 'Cadaqués', 'Country' => 'Spain', 'Province' => 'Girona', 'Zip' => '17488']];
        $id = tribe_create_event($args);
        if (!$id || is_wp_error($id)) { $out[$e['k']] = 'error'; continue; }
        update_post_meta($id, '_cqs_key', $e['k']);
        foreach (['ca' => 1, 'en' => 2] as $L => $i) { update_post_meta($id, '_ssi_title_'.$L, $e['t'][$i]); update_post_meta($id, '_ssi_content_'.$L, '<p>'.$e['c'][$i].'</p><p><em>'.$note[$L].'</em></p>'); }
        wp_set_object_terms($id, ['fiestas', 'cadaques'], 'tribe_events_cat');
        $out[$e['k']] = $id;
    }
    return $out;
}

/* 8) Fichas a partir de OpenStreetMap (datos abiertos ODbL): negocios, servicios y equipamientos con nombre */
function cqs_osm_cats($t) {
    $a = $t['amenity'] ?? ''; $s = $t['shop'] ?? ''; $to = $t['tourism'] ?? ''; $o = $t['office'] ?? ''; $hc = $t['healthcare'] ?? ''; $le = $t['leisure'] ?? ''; $cu = $t['cuisine'] ?? '';
    $A = ['restaurant' => ['comer-y-beber', preg_match('/pizza|italian/', $cu) ? 'pizzerias-e-italianos' : (preg_match('/tapas/', $cu) ? 'tapas-y-vermut' : (preg_match('/seafood|fish|rice|paella|catalan|spanish|regional|mediterranean/', $cu) ? 'arroces-y-marinera' : 'restaurantes'))],
          'fast_food' => ['comer-y-beber', 'restaurantes'], 'cafe' => ['comer-y-beber', 'cafes-y-desayunos'], 'bar' => ['comer-y-beber', 'bares-y-cocteleria'], 'pub' => ['comer-y-beber', 'bares-y-cocteleria'],
          'biergarten' => ['comer-y-beber', 'bares-y-cocteleria'], 'ice_cream' => ['comer-y-beber', 'heladerias'], 'nightclub' => ['comer-y-beber', 'copas-y-noche'],
          'pharmacy' => ['salud', 'farmacias'], 'doctors' => ['salud', 'centros-de-salud'], 'clinic' => ['salud', 'centros-de-salud'], 'dentist' => ['salud', 'dentistas'], 'veterinary' => ['salud', 'veterinarios'],
          'bank' => ['servicios', 'bancos'], 'parking' => ['servicios', 'aparcamientos'], 'car_rental' => ['servicios', 'alquiler-de-coches-motos-y-bicis'], 'bicycle_rental' => ['servicios', 'alquiler-de-coches-motos-y-bicis'],
          'boat_rental' => ['deporte-y-nautica', 'nautica-y-barcos'], 'townhall' => ['servicios', 'administracion-publica'], 'police' => ['servicios', 'administracion-publica'], 'post_office' => ['servicios', 'administracion-publica'],
          'library' => ['ocio-y-cultura', 'centros-culturales'], 'community_centre' => ['ocio-y-cultura', 'centros-culturales'], 'arts_centre' => ['ocio-y-cultura', 'centros-culturales'], 'theatre' => ['ocio-y-cultura', 'cines-y-teatros'], 'cinema' => ['ocio-y-cultura', 'cines-y-teatros'],
          'place_of_worship' => ['ocio-y-cultura', 'patrimonio-y-monumentos'], 'school' => ['educacion', 'escuelas-de-primaria'], 'kindergarten' => ['educacion', 'escuelas-infantiles'], 'fuel' => ['servicios', 'talleres'], 'taxi' => ['servicios', 'alquiler-de-coches-motos-y-bicis']];
    $T = ['hotel' => ['dormir', 'hoteles'], 'guest_house' => ['dormir', 'hostales-y-pensiones'], 'hostel' => ['dormir', 'hostales-y-pensiones'], 'apartment' => ['dormir', 'apartamentos-turisticos'], 'camp_site' => ['dormir', 'otros-alojamientos'], 'chalet' => ['dormir', 'casas-rurales'],
          'museum' => ['ocio-y-cultura', 'museos'], 'gallery' => ['comprar', 'galerias-de-arte'], 'attraction' => ['ocio-y-cultura', 'patrimonio-y-monumentos'], 'artwork' => ['ocio-y-cultura', 'patrimonio-y-monumentos'], 'information' => ['servicios', 'administracion-publica']];
    $S = ['supermarket' => 'alimentacion', 'convenience' => 'alimentacion', 'greengrocer' => 'alimentacion', 'bakery' => 'panaderias-y-pastelerias', 'pastry' => 'panaderias-y-pastelerias', 'confectionery' => 'panaderias-y-pastelerias',
          'butcher' => 'carnicerias-y-charcuterias', 'seafood' => 'pescaderias', 'clothes' => 'moda-y-complementos', 'boutique' => 'moda-y-complementos', 'fashion_accessories' => 'moda-y-complementos', 'bag' => 'moda-y-complementos', 'shoes' => 'zapaterias',
          'jewelry' => 'joyerias', 'books' => 'librerias-y-papelerias', 'stationery' => 'librerias-y-papelerias', 'newsagent' => 'estancos-y-quioscos', 'tobacco' => 'estancos-y-quioscos', 'gift' => 'regalos-y-artesania', 'craft' => 'regalos-y-artesania', 'art' => 'galerias-de-arte',
          'wine' => 'vinotecas-y-gourmet', 'deli' => 'vinotecas-y-gourmet', 'alcohol' => 'vinotecas-y-gourmet', 'cosmetics' => 'perfumeria-y-cosmetica', 'perfumery' => 'perfumeria-y-cosmetica', 'chemist' => 'perfumeria-y-cosmetica', 'florist' => 'floristerias',
          'interior_decoration' => 'hogar', 'houseware' => 'hogar', 'furniture' => 'hogar', 'hardware' => 'hogar', 'doityourself' => 'hogar', 'sports' => 'deportes-y-bicicletas', 'bicycle' => 'deportes-y-bicicletas', 'toys' => 'jugueterias', 'pet' => 'mascotas', 'optician' => null,
          'hairdresser' => null, 'beauty' => null, 'laundry' => null, 'dry_cleaning' => null, 'mobile_phone' => null, 'computer' => null, 'photo' => null, 'travel_agency' => null, 'estate_agent' => null, 'car_repair' => null];
    $SS = ['optician' => ['salud', 'opticas'], 'hairdresser' => ['servicios', 'peluquerias'], 'beauty' => ['servicios', 'estetica-y-bienestar'], 'laundry' => ['servicios', 'lavanderias-y-tintorerias'], 'dry_cleaning' => ['servicios', 'lavanderias-y-tintorerias'],
           'mobile_phone' => ['servicios', 'informatica-y-moviles'], 'computer' => ['servicios', 'informatica-y-moviles'], 'photo' => ['servicios', 'fotografia'], 'travel_agency' => ['servicios', 'agencias-de-viajes'], 'estate_agent' => ['servicios', 'inmobiliarias'], 'car_repair' => ['servicios', 'talleres']];
    $O = ['estate_agent' => ['servicios', 'inmobiliarias'], 'lawyer' => ['servicios', 'abogados'], 'accountant' => ['servicios', 'asesorias-y-gestorias'], 'tax_advisor' => ['servicios', 'asesorias-y-gestorias'], 'notary' => ['servicios', 'notarias'],
          'architect' => ['servicios', 'arquitectura'], 'insurance' => ['servicios', 'seguros'], 'travel_agent' => ['servicios', 'agencias-de-viajes'], 'government' => ['servicios', 'administracion-publica'], 'property_management' => ['servicios', 'administradores-de-fincas']];
    if ($a && isset($A[$a])) return $A[$a];
    if ($to && isset($T[$to])) return $T[$to];
    if ($s) { if (array_key_exists($s, $S)) return $S[$s] ? ['comprar', $S[$s]] : $SS[$s]; return ['comprar', 'regalos-y-artesania']; }
    if ($o && isset($O[$o])) return $O[$o];
    if ($hc === 'physiotherapist') return ['salud', 'fisioterapia'];
    if ($le === 'marina') return ['deporte-y-nautica', 'nautica-y-barcos'];
    if ($le === 'sports_centre' || $le === 'fitness_centre') return ['deporte-y-nautica', 'gimnasios-yoga-pilates'];
    if ($le === 'pitch' || $le === 'stadium') return ['deporte-y-nautica', 'instalaciones-deportivas'];
    if (isset($t['craft'])) return ['servicios', 'reformas-y-construccion'];
    if (($t['historic'] ?? '') !== '') return ['ocio-y-cultura', 'patrimonio-y-monumentos'];
    return null;
}
function cqs_overpass($q) {
    foreach (['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'] as $ep) {
        $r = wp_remote_post($ep, ['timeout' => 70, 'body' => ['data' => $q], 'user-agent' => 'CadaquesSi/1.0 (+https://cadaques.si)']);
        if (!is_wp_error($r) && wp_remote_retrieve_response_code($r) === 200) { $j = json_decode(wp_remote_retrieve_body($r), true); if (isset($j['elements'])) return $j['elements']; }
    }
    return null;
}
/* Nombre normalizado para detectar duplicados (sin acentos, sin palabras genéricas) */
function cqs_norm_name($s) {
    $s = remove_accents(mb_strtolower(html_entity_decode($s, ENT_QUOTES)));
    $s = preg_replace("/[^a-z0-9 ]+/", ' ', str_replace(["'", '’'], ' ', $s));
    $s = preg_replace('/\b(restaurant|restaurante|bar|hotel|hostal|cafe|cafeteria|apartaments|apartamentos|apartments|botiga|tienda|shop|galeria|gallery|el|la|les|los|las|es|sa|ses|s|l|d|de|del|i|y|and|the|cadaques)\b/', ' ', $s);
    return trim(preg_replace('/\s+/', ' ', $s));
}
function cqs_dist($a, $b, $c, $d) { $r = 6371000; $x = deg2rad($d - $b) * cos(deg2rad(($a + $c) / 2)); $y = deg2rad($c - $a); return sqrt($x * $x + $y * $y) * $r; }
/* ¿Consta como cerrado en OpenStreetMap? */
function cqs_osm_closed($t) {
    foreach ($t as $k => $v) if (preg_match('/^(disused|was|abandoned|demolished|removed|destroyed|razed):/', $k)) return 'marcado como cerrado ('.$k.')';
    if (preg_match('/^(off|closed)$/i', trim($t['opening_hours'] ?? ''))) return 'horario: cerrado';
    if (($t['closed'] ?? '') === 'yes' || ($t['disused'] ?? '') === 'yes' || ($t['abandoned'] ?? '') === 'yes') return 'marcado como cerrado';
    if (!empty($t['end_date']) && strtotime($t['end_date']) && strtotime($t['end_date']) < time()) return 'fecha de cierre '.$t['end_date'];
    if (preg_match('/\b(cerrado|tancat|closed|ferm[ée])\b/i', $t['name'] ?? '')) return 'nombre indica cierre';
    return '';
}
function cqs_step_fichas() {
    if (!function_exists('eiv_fichas_run')) throw new Exception('sin núcleo');
    $bb = '42.255,3.245,42.335,3.335'; // Cadaqués, Portlligat y el Cap de Creus
    $q = "[out:json][timeout:60];(nwr[name][amenity]($bb);nwr[name][shop]($bb);nwr[name][tourism~\"hotel|guest_house|hostel|apartment|camp_site|museum|gallery|chalet|motel\"]($bb);nwr[name][office]($bb);nwr[name][healthcare]($bb);nwr[name][leisure~\"marina|sports_centre|fitness_centre|sailing_club\"]($bb);nwr[name][craft]($bb);nwr[name][club]($bb);nwr[name][sport~\"diving|scuba_diving|sailing|kayak\"]($bb););out center tags meta;";
    $els = cqs_overpass($q); if ($els === null) throw new Exception('Overpass no responde');
    cqs_out('osm-raw.json', $els);
    $f = []; $skip = 0; $closed = [];
    foreach ($els as $e) {
        $t = $e['tags'] ?? []; $name = trim($t['name'] ?? ''); if ($name === '') continue;
        if (in_array($t['amenity'] ?? '', ['bench', 'waste_basket', 'toilets', 'drinking_water', 'recycling', 'parking_space', 'vending_machine', 'telephone', 'shelter', 'fountain', 'atm', 'bicycle_parking', 'motorcycle_parking', 'charging_station', 'bus_station', 'parking_entrance', 'grave_yard'], true)) { $skip++; continue; }
        if ($why = cqs_osm_closed($t)) { $closed[] = $name.' · '.$why; continue; }
        $cats = cqs_osm_cats($t); if (!$cats) { $skip++; continue; }
        $lat = $e['lat'] ?? ($e['center']['lat'] ?? ''); $lng = $e['lon'] ?? ($e['center']['lon'] ?? '');
        $street = trim(($t['addr:street'] ?? '').(isset($t['addr:housenumber']) ? ', '.$t['addr:housenumber'] : ''));
        $addr = ($street ? $street.', ' : '').($t['addr:postcode'] ?? '17488').' '.($t['addr:city'] ?? 'Cadaqués');
        $web = $t['website'] ?? ($t['contact:website'] ?? ($t['url'] ?? ''));
        if ($web && !preg_match('#^https?://#i', $web)) $web = 'https://'.$web;
        $chk = $t['check_date'] ?? ($t['survey:date'] ?? '');
        $f[] = ['key' => 'osm:'.$e['type'].'/'.$e['id'], 'title' => $name, 'title_ca' => $t['name:ca'] ?? $name, 'title_en' => $t['name:en'] ?? $name,
            'content' => '', 'cats' => $cats, 'location' => 'Cadaqués', 'address' => $addr,
            'phone' => $t['phone'] ?? ($t['contact:phone'] ?? ''), 'website' => $web, 'email' => $t['email'] ?? ($t['contact:email'] ?? ''),
            'hours' => $t['opening_hours'] ?? '', 'lat' => $lat, 'lng' => $lng,
            '_n' => cqs_norm_name($name), '_tags' => count($t), '_edit' => substr((string)($e['timestamp'] ?? ''), 0, 10), '_check' => $chk];
    }
    // Negocios y profesionales de Google (Business Profile, recogidos con OpenSEO): data/google.json
    $gn = 0;
    foreach ((array)cqs_json('google.json') as $g) {
        $gn++;
        $f[] = ['key' => 'g:'.$g['cid'], 'title' => $g['title'], 'title_ca' => $g['title'], 'title_en' => $g['title'], 'content' => '', 'cats' => $g['cats'], 'location' => 'Cadaqués',
            'address' => $g['address'], 'phone' => $g['phone'], 'website' => $g['website'], 'email' => '', 'hours' => '', 'lat' => $g['lat'], 'lng' => $g['lng'],
            '_n' => cqs_norm_name($g['title']), '_tags' => -1, '_edit' => '', '_check' => '', '_g' => $g['cid'], '_gv' => (int)$g['votes'], '_gc' => $g['gcat'] ?? ''];
    }
    // Duplicados: mismo nombre normalizado (o uno contenido en el otro) a menos de 200 m, o misma web o mismo teléfono a menos de 200 m.
    // Se queda la ficha con más datos y se le pasan los que le falten.
    usort($f, fn($a, $b) => $b['_tags'] <=> $a['_tags']);
    $keep = []; $dups = [];
    foreach ($f as $x) {
        $hit = null;
        foreach ($keep as $i => $k) {
            if ($x['lat'] === '' || $k['lat'] === '') continue;
            $d = cqs_dist($x['lat'], $x['lng'], $k['lat'], $k['lng']); if ($d > 200) continue;
            if (($x['cats'][0] ?? '') !== ($k['cats'][0] ?? '') && !($x['_n'] !== '' && $x['_n'] === $k['_n'] && $d < 80)) continue; // solo dentro del mismo tipo de negocio (salvo mismo nombre en el mismo sitio)
            if (preg_match('/^(aparcament|parking|aparcamiento|pagament|farmacia|bus|parada)/', $x['_n']) && $d > 40) continue; // nombres genéricos: solo si están en el mismo punto
            $sameSub = ($x['cats'][1] ?? '') === ($k['cats'][1] ?? '') || ($x['cats'][0] === 'comer-y-beber' && $k['cats'][0] === 'comer-y-beber');
            $sameName = $x['_n'] !== '' && $k['_n'] !== '' && ($x['_n'] === $k['_n'] || ($sameSub && mb_strlen($x['_n']) > 4 && mb_strlen($k['_n']) > 4 && (strpos(' '.$x['_n'].' ', ' '.$k['_n'].' ') !== false || strpos(' '.$k['_n'].' ', ' '.$x['_n'].' ') !== false)));
            // misma web o teléfono pero nombres distintos (p. ej. dos locales del mismo dueño): solo es la misma ficha si comparten alguna palabra o es la razón social (S.L.)
            $tok = fn($n) => array_filter(explode(' ', $n), fn($w) => mb_strlen($w) >= 4);
            $nameLink = (bool)array_intersect($tok($x['_n']), $tok($k['_n'])) || preg_match('/\bs\.? ?[lac]\.?\s*$/i', trim($x['title'])) || $x['_n'] === '' || $k['_n'] === '';
            $host = fn($u) => preg_replace('/^www\./', '', (string)parse_url($u, PHP_URL_HOST));
            $sameWeb = $x['website'] && $k['website'] && $host($x['website']) === $host($k['website']) && !preg_match('/facebook|instagram|booking|tripadvisor/', $host($x['website']));
            $digits = fn($p) => substr(preg_replace('/\D/', '', $p), -9);
            $samePhone = $x['phone'] && $k['phone'] && $digits($x['phone']) === $digits($k['phone']);
            if ($sameName || (($sameWeb || $samePhone) && $nameLink)) { $hit = $i; break; }
        }
        if ($hit === null) { $keep[] = $x; continue; }
        foreach (['phone', 'website', 'email', 'hours'] as $m) if (empty($keep[$hit][$m]) && !empty($x[$m])) $keep[$hit][$m] = $x[$m];
        if (!empty($x['_g']) && empty($keep[$hit]['_g'])) { $keep[$hit]['_g'] = $x['_g']; $keep[$hit]['_gv'] = $x['_gv']; $keep[$hit]['_gc'] = $x['_gc'] ?? ''; if (!preg_match('/\d/', explode(',', $keep[$hit]['address'])[0]) && preg_match('/\d/', $x['address'])) $keep[$hit]['address'] = $x['address']; }
        if ($x['_edit'] > $keep[$hit]['_edit']) $keep[$hit]['_edit'] = $x['_edit'];
        $dups[] = $x['title'].' = '.$keep[$hit]['title'];
    }
    // Sin dirección (solo código postal y pueblo): fuera de la guía, decisión de Alex 24-11-2026. Van a la papelera (recuperables).
    $noaddr = [];
    $keep = array_values(array_filter($keep, function ($x) use (&$noaddr) {
        $first = trim(explode(',', (string)$x['address'])[0]);
        if ($first === '' || preg_match('/^\d{5}\b|^(Cadaqu|Girona|Spain|España)/iu', $first)) { $noaddr[] = $x['title']; return false; }
        return true; }));
    // Fichas OSM publicadas antes que ya no están (duplicadas o cerradas): a la papelera (se pueden recuperar)
    $live = array_flip(array_column($keep, 'key')); $trashed = [];
    foreach (get_posts(['post_type' => 'at_biz_dir', 'post_status' => ['publish', 'draft', 'pending'], 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true, 'meta_query' => [['key' => '_ssi_source', 'compare' => 'REGEXP', 'value' => '^(osm|g):']]]) as $id) {
        $src = (string)get_post_meta($id, '_ssi_source', true);
        if (preg_match('/^(osm|g):/', $src) && !isset($live[$src])) { $trashed[] = get_the_title($id); wp_trash_post($id); }
    }
    // Las que se pasaron a borrador en una revisión anterior se quedan en borrador
    $drafts = []; foreach (get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'draft', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_verif_estado', 'value' => ['dudosa', 'sin web'], 'compare' => 'IN']]]) as $id) $drafts[(string)get_post_meta($id, '_ssi_source', true)] = $id;
    $send = array_map(fn($x) => array_diff_key($x, array_flip(['_n', '_tags', '_edit', '_check', '_g', '_gv', '_gc'])), $keep);
    $res = [];
    foreach (array_chunk($send, 40) as $ch) { $r = eiv_fichas_run(cqs_req(['fichas' => $ch])); $res = array_merge($res, (array)($r['fichas'] ?? [])); }
    foreach ($keep as $x) { $id = $drafts[$x['key']] ?? 0;
        foreach ($res as $y) if (($y['key'] ?? '') === $x['key'] && !empty($y['id'])) { $id = $id ?: 0; update_post_meta($y['id'], '_cqs_osm_edit', $x['_edit']); update_post_meta($y['id'], '_cqs_osm_check', $x['_check']);
            if ($x['website'] !== '' && (string)get_post_meta($y['id'], '_website', true) === '') update_post_meta($y['id'], '_website', $x['website']); // recupera webs quitadas por error
            if (!empty($x['_g'])) { update_post_meta($y['id'], '_cqs_google', $x['_g']); update_post_meta($y['id'], '_cqs_google_votes', $x['_gv']); } else delete_post_meta($y['id'], '_cqs_google'); }
        if ($id) wp_update_post(['ID' => $id, 'post_status' => 'draft']); }
    // Descripción corta en los cuatro idiomas (tipo de negocio + pueblo). El nombre del negocio no se traduce nunca.
    // Solo se escribe si la ficha no tiene texto propio (o el que tiene es el automático anterior).
    $D = (array)cqs_json('desc.json'); $inL = ['es' => 'en Cadaqués', 'ca' => 'a Cadaqués', 'en' => 'in Cadaqués', 'fr' => 'à Cadaqués']; $ndesc = 0; global $wpdb;
    foreach ($keep as $x) foreach ($res as $y) if (($y['key'] ?? '') === $x['key'] && !empty($y['id'])) {
        $ph = $D['g'][$x['_gc'] ?? ''] ?? ($D['sub'][$x['cats'][1] ?? ''] ?? null); if (!$ph) break;
        $txt = []; foreach (['es', 'ca', 'en', 'fr'] as $i => $l) $txt[$l] = '<p>'.$ph[$i].' '.$inL[$l].'.</p>';
        $cur = (string)get_post_field('post_content', $y['id']); $auto = (string)get_post_meta($y['id'], '_cqs_desc_auto', true);
        if (trim($cur) !== '' && $cur !== $auto) break;
        if ($cur !== $txt['es']) $wpdb->update($wpdb->posts, ['post_content' => $txt['es']], ['ID' => $y['id']]);
        update_post_meta($y['id'], '_cqs_desc_auto', $txt['es']);
        foreach (['ca', 'en', 'fr'] as $l) { $old = (string)get_post_meta($y['id'], "_ssi_content_$l", true); if ($old === '' || $old === (string)get_post_meta($y['id'], "_cqs_desc_auto_$l", true)) { update_post_meta($y['id'], "_ssi_content_$l", $txt[$l]); update_post_meta($y['id'], "_cqs_desc_auto_$l", $txt[$l]); } }
        clean_post_cache($y['id']); $ndesc++; break;
    }
    $err = array_values(array_filter($res, fn($x) => isset($x['error'])));
    $byc = []; foreach ($keep as $x) { $byc[$x['cats'][1]] = ($byc[$x['cats'][1]] ?? 0) + 1; } arsort($byc);
    delete_option('cqs_verify_pos');
    $gk = count(array_filter($keep, fn($x) => strpos($x['key'], 'g:') === 0)); $gm = count(array_filter($keep, fn($x) => strpos($x['key'], 'osm:') === 0 && !empty($x['_g'])));
    $rep = ['osm' => count($els), 'google' => $gn, 'google_nuevas' => $gk, 'osm_confirmadas_en_google' => $gm, 'fichas' => count($keep), 'descripciones_4_idiomas' => $ndesc, 'duplicados' => $dups, 'cerrados_en_osm' => $closed, 'a_la_papelera' => $trashed, 'sin_direccion' => $noaddr, 'descartados' => $skip, 'errores' => array_slice($err, 0, 10), 'por_categoria' => $byc];
    cqs_out('fichas-report.json', $rep);
    return array_merge($rep, ['duplicados' => count($dups), 'cerrados_en_osm' => count($closed), 'a_la_papelera' => count($trashed), 'sin_direccion' => count($noaddr)]);
}

/* 11) Verificación de cada ficha: ¿responde su web?, ¿cuándo se comprobó en OpenStreetMap?
   - verificada: la web responde, o alguien la comprobó en OSM (check_date o edición) en los últimos 2 años
   - sin web: no tiene web y el último dato de OSM tiene más de 2 años (se publica, con aviso para revisar)
   - dudosa: la web no existe o está caída Y el último dato de OSM tiene más de 3 años -> pasa a borrador (no se borra)
   La web caída se quita de la ficha para no enlazar a una página rota. Se reparte en tandas (20 webs a la vez). */
function cqs_step_verify() {
    $ids = get_posts(['post_type' => 'at_biz_dir', 'post_status' => ['publish', 'draft'], 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true, 'orderby' => 'ID', 'order' => 'ASC', 'meta_query' => [['key' => '_ssi_source', 'compare' => 'REGEXP', 'value' => '^(osm|g):']]]);
    $pos = (int)get_option('cqs_verify_pos', 0); $t0 = time(); $rep = (array)(json_decode((string)@file_get_contents(SSI_DIR.'out/verify-report.json'), true) ?: []);
    if (!$pos) $rep = ['verificada' => [], 'sin web' => [], 'dudosa' => [], 'web caida quitada' => []];
    $now = time(); $yrs = function ($d) use ($now) { $t = $d ? strtotime(substr($d, 0, 10)) : 0; return $t ? ($now - $t) / 31557600 : 99; };
    while ($pos < count($ids) && time() - $t0 < 90) {
        $batch = array_slice($ids, $pos, 20); $reqs = [];
        foreach ($batch as $id) { $w = (string)get_post_meta($id, '_website', true); if ($w && !preg_match('/facebook\.com|instagram\.com/', $w)) $reqs[$id] = ['url' => $w, 'type' => 'GET', 'headers' => ['User-Agent' => 'Mozilla/5.0 (compatible; CadaquesSi/1.0; +https://cadaques.si)'], 'options' => ['timeout' => 10, 'connect_timeout' => 6, 'follow_redirects' => true, 'redirects' => 5, 'verify' => false, 'max_bytes' => 60000]]; }
        $resp = [];
        if ($reqs) { try { $cls = class_exists('\WpOrg\Requests\Requests') ? '\WpOrg\Requests\Requests' : 'Requests'; $resp = $cls::request_multiple($reqs, ['timeout' => 10]); } catch (Throwable $e) { $resp = []; } }
        foreach ($batch as $id) {
            $title = get_the_title($id); $w = (string)get_post_meta($id, '_website', true);
            $age = min($yrs((string)get_post_meta($id, '_cqs_osm_check', true)), $yrs((string)get_post_meta($id, '_cqs_osm_edit', true)));
            $web = 'sin web';
            if (isset($reqs[$id])) {
                $r = $resp[$id] ?? null; $code = (is_object($r) && !($r instanceof Throwable) && isset($r->status_code)) ? (int)$r->status_code : 0;
                $body = is_object($r) && isset($r->body) ? mb_strtolower(substr((string)$r->body, 0, 60000)) : '';
                $parked = preg_match('/domain (is )?for sale|dominio (está )?en venta|this domain (has expired|is parked)|parkingcrew|sedoparking|hugedomains|buy this domain/', $body);
                $gone = preg_match('/(cerrado|cerramos) definitivamente|tancat definitivament|permanently closed|d[ée]finitivement ferm[ée]/', $body);
                // Sin respuesta (tiempo agotado, fallo de conexión): no se da por caída salvo que el dominio ya no exista
                $host = (string)parse_url($w, PHP_URL_HOST);
                if ($code === 0) $web = ($host && gethostbyname($host) === $host && !checkdnsrr($host, 'A') && !checkdnsrr($host, 'AAAA')) ? 'caida' : 'sin respuesta';
                elseif ($code >= 200 && $code < 400) $web = $parked ? 'caida' : ($gone ? 'cerrado' : 'ok');
                elseif (in_array($code, [404, 410], true) || ($code >= 500 && $code !== 503)) $web = 'caida';
                else $web = 'protegida';
            } elseif ($w) $web = 'redes';
            $goo = (string)get_post_meta($id, '_cqs_google', true) !== '';
            if ($web === 'cerrado') $estado = 'dudosa';
            elseif ($goo) $estado = 'verificada';
            elseif ($web === 'ok' || $web === 'protegida' || $web === 'redes' || $age <= 2) $estado = 'verificada';
            elseif ($web === 'caida' && $age > 3) $estado = 'dudosa';
            else $estado = 'sin web';
            if ($web === 'caida') { delete_post_meta($id, '_website'); $rep['web caida quitada'][] = $title.' · '.$w; }
            update_post_meta($id, '_cqs_verif_estado', $estado);
            update_post_meta($id, '_cqs_verif', ['fecha' => gmdate('Y-m-d'), 'web' => $web, 'osm_anos' => round($age, 1), 'google' => $goo]);
            if ($estado === 'dudosa' || $estado === 'sin web') wp_update_post(['ID' => $id, 'post_status' => 'draft']); // sin confirmar (ni web, ni Google, ni dato reciente): a borrador, decisión de Alex 24-11-2026
            elseif (get_post_status($id) === 'draft') wp_update_post(['ID' => $id, 'post_status' => 'publish']);
            $rep[$estado][] = $title.' · web '.$web.($goo ? ' · en Google' : '').' · OSM hace '.($age >= 99 ? '?' : round($age, 1)).' años';
        }
        $pos += count($batch); update_option('cqs_verify_pos', $pos, false);
    }
    $rep['_progreso'] = $pos.' de '.count($ids);
    cqs_out('verify-report.json', $rep);
    if ($pos < count($ids)) throw new Exception('sigue en la próxima tanda ('.$pos.' de '.count($ids).')');
    delete_option('cqs_verify_pos');
    return ['revisadas' => count($ids), 'verificadas' => count($rep['verificada']), 'sin_web' => count($rep['sin web']), 'dudosas_a_borrador' => count($rep['dudosa']), 'webs_caidas_quitadas' => count($rep['web caida quitada'])];
}

/* 9) Calas: fichas propias con texto en 3 idiomas (coordenadas de OpenStreetMap cuando existen) */
function cqs_step_beaches() {
    if (!function_exists('eiv_fichas_run')) throw new Exception('sin núcleo');
    $B = [
     ['platja-gran', 'Platja Gran', 42.2879, 3.2780, ['La playa del pueblo, de guijarros, frente al paseo marítimo.', 'La platja del poble, de còdols, davant del passeig marítim.', 'The village beach, pebbly, on the seafront.']],
     ['es-poal', 'Platja des Poal', 42.2893, 3.2797, ['Pequeña playa junto a la Platja Gran, entre casas de pescadores.', 'Petita platja al costat de la Platja Gran, entre cases de pescadors.', 'Small beach next to Platja Gran, among fishermen’s houses.']],
     ['es-llane', 'Es Llané Gran', 42.2843, 3.2779, ['Cala al sur del pueblo, de aguas claras, a pocos minutos a pie.', 'Cala al sud del poble, d’aigües clares, a pocs minuts a peu.', 'Clear-water cove south of the village, a few minutes’ walk.']],
     ['sa-conca', 'Sa Conca', 42.2947, 3.2822, ['Cala abrigada camino de Portlligat, buena para nadar.', 'Cala arrecerada camí de Portlligat, bona per nedar.', 'Sheltered cove on the way to Portlligat, good for swimming.']],
     ['portlligat', 'Platja de Portlligat', 42.2928, 3.2878, ['La bahía de Dalí, con barcas de pesca y la casa-museo al fondo.', 'La badia de Dalí, amb barques de pesca i la casa-museu al fons.', 'Dalí’s bay, with fishing boats and the house-museum behind.']],
     ['cala-nans', 'Cala Nans', 42.2727, 3.2856, ['Junto al faro de Cala Nans, por el camino de ronda (unos 45 min).', 'Al costat del far de Cala Nans, pel camí de ronda (uns 45 min).', 'By Cala Nans lighthouse, along the coastal path (about 45 min).']],
     ['cala-guillola', 'Cala Guillola', 42.3060, 3.2934, ['En el Parque Natural del Cap de Creus, fondo de arena y agua transparente.', 'Al Parc Natural del Cap de Creus, fons de sorra i aigua transparent.', 'In Cap de Creus Natural Park, sandy bottom and clear water.']],
     ['cala-culip', 'Cala Culip', 42.3226, 3.3034, ['Cala del Cap de Creus, ideal para esnórquel.', 'Cala del Cap de Creus, ideal per fer snorkel.', 'A Cap de Creus cove, ideal for snorkelling.']],
    ];
    $osm = cqs_overpass('[out:json][timeout:60];nwr[natural=beach][name](42.255,3.245,42.335,3.335);out center tags;') ?: [];
    $norm = fn($s) => trim(preg_replace('/[^a-z ]+/', ' ', remove_accents(mb_strtolower($s))));
    $f = []; $found = [];
    foreach ($B as [$k, $name, $lat, $lng, $c]) {
        foreach ($osm as $e) { $n = $norm($e['tags']['name'] ?? ''); $w = $norm(preg_replace('/^(Platja|Cala)( de| des)? /u', '', $name));
            if ($w && strpos($n, $w) !== false) { $lat = $e['lat'] ?? $e['center']['lat']; $lng = $e['lon'] ?? $e['center']['lon']; $found[] = $k; break; } }
        $f[] = ['key' => 'cqs:platja:'.$k, 'title' => $name, 'title_ca' => $name, 'title_en' => $name, 'content' => '<p>'.$c[0].'</p>', 'content_ca' => '<p>'.$c[1].'</p>', 'content_en' => '<p>'.$c[2].'</p>',
            'cats' => ['ocio-y-cultura', 'playas-y-calas'], 'location' => 'Cadaqués', 'address' => $name.', 17488 Cadaqués', 'lat' => $lat, 'lng' => $lng];
    }
    $r = eiv_fichas_run(cqs_req(['fichas' => $f]));
    $pub = (array)get_option('ssi_public_listings', []);
    foreach ($r['fichas'] ?? [] as $x) if (!empty($x['id'])) $pub[] = get_post_field('post_name', $x['id']);
    update_option('ssi_public_listings', array_values(array_unique($pub)));
    return ['calas' => count($f), 'coordenadas_osm' => $found];
}

/* 12) Web abierta a buscadores: visto bueno de Alex el 24-11-2026 ("publicar lo que hay") */
function cqs_step_public() {
    update_option('blog_public', 1);
    $p = get_post(1); if ($p && $p->post_status === 'publish' && preg_match('/hello world|hola mundo|hola món/i', $p->post_title)) wp_trash_post(1);
    return ['blog_public' => (int)get_option('blog_public'), 'post_1' => get_post_status(1)];
}

/* 13) Menú principal: Rutas, Deportes y Cómo llegar y moverse a la vista en cada idioma (petición de Alex 24-11-2026).
   Si la página no está en el menú, se añade junto a su hermana (Deportes tras Rutas; Cómo llegar tras Información práctica). */
function cqs_step_menu() {
    $pid = function ($key, $l) { $x = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => $key.':'.$l]]]); return $x ? (int)$x[0] : 0; };
    $o = get_option('polylang'); $theme = get_stylesheet();
    $menus = (array)($o['nav_menus'][$theme]['primary'] ?? []);
    if (!$menus) { $tm = (array)get_theme_mod('nav_menu_locations', []); if (!empty($tm['primary'])) $menus = ['es' => $tm['primary']]; }
    $rep = ['theme' => $theme, 'menus' => $menus];
    $want = [['routes', 'visit'], ['sports', 'routes'], ['transport', 'live']];
    $lbl = ['routes' => ['es' => 'Rutas y excursiones', 'ca' => 'Rutes i excursions', 'en' => 'Walks and day trips', 'fr' => 'Randonnées'],
            'sports' => ['es' => 'Deportes', 'ca' => 'Esports', 'en' => 'Sports', 'fr' => 'Sports'],
            'transport' => ['es' => 'Transporte', 'ca' => 'Transport', 'en' => 'Getting around', 'fr' => 'Transports']];
    foreach ($menus as $l => $mid) {
        $items = (array)wp_get_nav_menu_items($mid);
        $byObj = []; foreach ($items as $it) if ($it->object === 'page') $byObj[(int)$it->object_id] = $it;
        $added = [];
        foreach ($want as [$k, $after]) {
            $p = $pid($k, $l); if (!$p || isset($byObj[$p])) continue;
            $sib = $byObj[$pid($after, $l)] ?? null;
            $r = wp_update_nav_menu_item($mid, 0, ['menu-item-object' => 'page', 'menu-item-object-id' => $p, 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish', 'menu-item-title' => $lbl[$k][$l] ?? '',
                'menu-item-parent-id' => $sib ? (int)$sib->menu_item_parent : 0, 'menu-item-position' => $sib ? (int)$sib->menu_order + 1 : count($items) + 1]);
            if (!is_wp_error($r)) { $added[] = $k; $byObj[$p] = (object)['menu_item_parent' => $sib ? (int)$sib->menu_item_parent : 0, 'menu_order' => $sib ? (int)$sib->menu_order + 1 : 0]; }
        }
        $rep['items'][$l] = array_map(fn($it) => ($it->menu_item_parent ? '  - ' : '').$it->title, (array)wp_get_nav_menu_items($mid));
        $rep['added'][$l] = $added;
    }
    cqs_out('menu-report.json', $rep);
    return ['menus' => count($menus), 'added' => $rep['added'] ?? []];
}
