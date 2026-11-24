<?php
if (!defined('ABSPATH')) exit;
/* Montaje de cadaques.si en el servidor: idiomas, categorías, páginas en 3 idiomas, fotos, fichas (OpenStreetMap),
   calas y agenda. Se ejecuta al activar el plugin cuando cambia CQS_BUILD_VER. Cada paso se puede repetir sin duplicar.
   Resultado en out/build-log.json. */

/* Se lanza al final de una visita a la web, una vez enviada la página (no hace esperar a nadie). */
add_action('shutdown', function () {
    if (get_option('cqs_build') === CQS_BUILD_VER || wp_doing_cron() || (defined('WP_CLI') && WP_CLI) || (defined('REST_REQUEST') && REST_REQUEST)) return;
    if (!did_action('wp_loaded')) return;
    ignore_user_abort(true);
    if (function_exists('litespeed_finish_request')) litespeed_finish_request(); elseif (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
    cqs_build_tick();
}, 999);

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
    $done = (array)get_option('cqs_build_done', []); if (($done['_v'] ?? '') !== CQS_BUILD_VER) $done = ['_v' => CQS_BUILD_VER];
    $log = json_decode((string)@file_get_contents(SSI_DIR.'out/build-log.json'), true); if (!is_array($log) || ($log['ver'] ?? '') !== CQS_BUILD_VER || count($done) < 2) $log = [];
    $log['started'] = gmdate('c'); $log['ver'] = CQS_BUILD_VER;
    if (!get_current_user_id()) wp_set_current_user(1);
    $steps = ['languages', 'cats', 'owner', 'images', 'pages', 'directorist', 'events', 'fichas', 'beaches'];
    $ok = true;
    foreach ($steps as $s) {
        if (!empty($done[$s])) continue;
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

function cqs_fill($html, $l) {
    $imgs = (array)get_option('cqs_imgs', []); $meta = cqs_json('images.json');
    $html = preg_replace_callback('/\{\{img:([a-z]+)\}\}/', function ($m) use ($imgs) {
        $id = $imgs[$m[1]] ?? 0; $u = $id ? wp_get_attachment_image_url($id, 'large') : '';
        return $u ?: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    }, $html);
    if (strpos($html, '{{credits}}') !== false) {
        $by = ['es' => 'Foto de %s en Unsplash', 'ca' => 'Foto de %s a Unsplash', 'en' => 'Photo by %s on Unsplash'][$l];
        $c = '<div class="ssi-grid ssi-grid--3 cq-credits">';
        foreach ($meta as $k => $im) {
            $id = $imgs[$k] ?? 0; if (!$id) continue;
            $c .= '<figure class="ssi-card"><img src="'.esc_url(wp_get_attachment_image_url($id, 'medium_large')).'" alt="'.esc_attr($im['alt'][$l]).'" loading="lazy" style="width:100%;height:auto;border-radius:10px">'
                .'<figcaption>'.esc_html($im['alt'][$l]).'<br><a href="https://unsplash.com/photos/'.esc_attr($im['id']).'" target="_blank" rel="noopener">'.esc_html(sprintf($by, $im['by'])).'</a></figcaption></figure>';
        }
        $html = str_replace('{{credits}}', $c.'</div>', $html);
    }
    return $html;
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
        $r = wp_remote_post($ep, ['timeout' => 120, 'body' => ['data' => $q], 'user-agent' => 'CadaquesSi/1.0 (+https://cadaques.si)']);
        if (!is_wp_error($r) && wp_remote_retrieve_response_code($r) === 200) { $j = json_decode(wp_remote_retrieve_body($r), true); if (isset($j['elements'])) return $j['elements']; }
    }
    return null;
}
function cqs_step_fichas() {
    if (!function_exists('eiv_fichas_run')) throw new Exception('sin núcleo');
    $bb = '42.255,3.245,42.335,3.335'; // Cadaqués, Portlligat y el Cap de Creus
    $q = "[out:json][timeout:90];(nwr[name][amenity]($bb);nwr[name][shop]($bb);nwr[name][tourism~\"hotel|guest_house|hostel|apartment|camp_site|museum|gallery|chalet\"]($bb);nwr[name][office]($bb);nwr[name][healthcare]($bb);nwr[name][leisure~\"marina|sports_centre|fitness_centre\"]($bb);nwr[name][craft]($bb););out center tags;";
    $els = cqs_overpass($q); if ($els === null) throw new Exception('Overpass no responde');
    cqs_out('osm-raw.json', $els);
    $f = []; $skip = 0;
    foreach ($els as $e) {
        $t = $e['tags'] ?? []; $name = trim($t['name'] ?? ''); if ($name === '') continue;
        if (in_array($t['amenity'] ?? '', ['bench', 'waste_basket', 'toilets', 'drinking_water', 'recycling', 'parking_space', 'vending_machine', 'telephone', 'shelter', 'fountain', 'atm', 'bicycle_parking', 'motorcycle_parking', 'charging_station', 'bus_station'], true)) { $skip++; continue; }
        $cats = cqs_osm_cats($t); if (!$cats) { $skip++; continue; }
        $lat = $e['lat'] ?? ($e['center']['lat'] ?? ''); $lng = $e['lon'] ?? ($e['center']['lon'] ?? '');
        $street = trim(($t['addr:street'] ?? '').(isset($t['addr:housenumber']) ? ', '.$t['addr:housenumber'] : ''));
        $addr = ($street ? $street.', ' : '').($t['addr:postcode'] ?? '17488').' '.($t['addr:city'] ?? 'Cadaqués');
        $web = $t['website'] ?? ($t['contact:website'] ?? ($t['url'] ?? ''));
        $f[] = ['key' => 'osm:'.$e['type'].'/'.$e['id'], 'title' => $name, 'title_ca' => $t['name:ca'] ?? $name, 'title_en' => $t['name:en'] ?? $name,
            'content' => '', 'cats' => $cats, 'location' => 'Cadaqués', 'address' => $addr,
            'phone' => $t['phone'] ?? ($t['contact:phone'] ?? ''), 'website' => $web, 'email' => $t['email'] ?? ($t['contact:email'] ?? ''),
            'hours' => $t['opening_hours'] ?? '', 'lat' => $lat, 'lng' => $lng];
    }
    $res = [];
    foreach (array_chunk($f, 40) as $ch) { $r = eiv_fichas_run(cqs_req(['fichas' => $ch])); $res = array_merge($res, (array)($r['fichas'] ?? [])); }
    $err = array_values(array_filter($res, fn($x) => isset($x['error'])));
    $byc = []; foreach ($f as $x) { $byc[$x['cats'][1]] = ($byc[$x['cats'][1]] ?? 0) + 1; } arsort($byc);
    return ['osm' => count($els), 'fichas' => count($f), 'descartados' => $skip, 'errores' => array_slice($err, 0, 10), 'por_categoria' => $byc];
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
