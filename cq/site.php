<?php
if (!defined('ABSPATH')) exit;
/* Ajustes propios de cadaques.si sobre el núcleo de la red */

// Estilos de las páginas (en eivissa.si van dentro de cada página; aquí, en un archivo)
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('cqs-pages', SSI_URL.'cq/pages.css', [], SSI_VER.'-'.@filemtime(SSI_DIR.'cq/pages.css'));
}, 30);

// Funciones de la farmacia de guardia de Baleares y de los ferris: no existen en Cadaqués.
// Se definen vacías por si alguna parte del núcleo las llama.
foreach (['sc_guardia_town', 'sc_guardia_fetch', 'sc_guardia_txt', 'sc_guardia_ficha', 'eiv_get', 'eiv_feeds_run', 'eiv_import_event', 'eiv_dt', 'eiv_parse_ics',
          'eiv_parse_tribe', 'eiv_parse_jsonld', 'eiv_parse_liferay', 'eiv_parse_fmtapi', 'eiv_ferry_update', 'eiv_ferry_agg'] as $fn)
    if (!function_exists($fn)) eval('function '.$fn.'(...$a) { return null; }');
add_shortcode('sc_guardia', '__return_empty_string');
add_shortcode('eiv_ferry', '__return_empty_string');

/* Francés: idioma real de la página (el núcleo trabaja con es, ca y en; en las páginas en francés usa el inglés como base) */
function cqs_cur_lang() {
    $l = function_exists('pll_current_language') ? pll_current_language('slug') : '';
    return in_array($l, ['es', 'ca', 'en', 'fr'], true) ? $l : 'es';
}
function cqs_fr_t($key) {
    if (cqs_cur_lang() !== 'fr') return null;
    static $t = [
        'tagline' => 'Le guide de Cadaqués', 'cta' => 'Ajoutez votre commerce', 'menu' => 'Menu', 'lang' => 'Langue', 'nav' => 'Principal',
        'f_about' => 'Site indépendant et citoyen. Ce n’est pas un site officiel : l’information municipale se trouve sur cadaques.cat, le site de l’Ajuntament de Cadaqués.',
        'f_data' => 'Données de l’annuaire :', 'f_guide' => 'Le guide', 'f_part' => 'Participer', 'f_legal' => 'Mentions légales',
        'visit' => 'Visiter', 'directory' => 'Annuaire', 'agenda' => 'Agenda', 'night' => 'La nuit', 'shopsv' => 'Commerces et services',
        'history' => 'Histoire et curiosités', 'opinion' => 'Votre avis', 'live' => 'Infos pratiques', 'services' => 'Services pour les professionnels',
        'idea' => 'Proposez une idée', 'rules' => 'Règles de la communauté', 'legal' => 'Mentions légales', 'privacy' => 'Confidentialité', 'cookies' => 'Cookies',
        'q_label' => 'Rechercher dans le guide', 'q_ph' => 'Hôtels, restaurants, pharmacies…', 'q_cat' => 'Catégorie', 'q_btn' => 'Rechercher',
        'c_all' => 'Tout le guide', 'c_dormir' => 'Dormir', 'c_comer' => 'Manger et boire', 'c_comprar' => 'Shopping', 'c_salud' => 'Santé', 'c_agenda' => 'Agenda',
        'ev_empty_t' => 'Aucun événement publié pour les prochains jours', 'ev_empty_d' => 'Vous organisez quelque chose à Cadaqués ? Envoyez-nous votre événement : nous le publierons après vérification.',
        'ev_send' => 'Envoyez votre événement', 'ev_kind' => 'Événement', 'ls_empty_t' => 'Nous ajoutons les premières fiches',
        'ls_empty_d' => 'Commerces, restaurants, hébergements et services de Cadaqués, vérifiés un par un. Si vous avez un commerce, vous pouvez l’ajouter gratuitement.', 'ls_kind' => 'Fiche',
    ];
    return $t[$key] ?? null;
}

/* Diagnóstico (out/diag.json, cerrado al público): portada, idiomas y páginas */
add_action('wp_loaded', function () {
    if (get_transient('cqs_diag')) return; set_transient('cqs_diag', 1, 20);
    $f = (int)get_option('page_on_front');
    $d = ['t' => gmdate('c'), 'sapi' => PHP_SAPI, 'show_on_front' => get_option('show_on_front'), 'page_on_front' => $f,
        'front' => $f ? [get_post_status($f), get_post_field('post_name', $f), function_exists('pll_get_post_language') ? pll_get_post_language($f) : '?',
                        function_exists('pll_get_post_translations') ? pll_get_post_translations($f) : '?'] : null,
        'langs' => function_exists('pll_languages_list') ? pll_languages_list(['fields' => 'slug']) : '?', 'permalink' => get_option('permalink_structure'),
        'pll' => array_intersect_key((array)get_option('polylang'), array_flip(['default_lang', 'hide_default', 'force_lang', 'rewrite', 'redirect_lang'])),
        'hello' => get_post_status(1), 'blog_public' => get_option('blog_public'), 'pages' => (int)wp_count_posts('page')->publish];
    cqs_out('diag.json', $d);
});

/* Índice del buscador: se rehace cuando cambian las fichas o sus descripciones (versión del montaje) */
add_action('wp_loaded', function () {
    if (get_option('cqs_s2_flushed') === CQS_BUILD_VER.'-'.get_option('cqs_build')) return;
    if (get_option('cqs_build') !== CQS_BUILD_VER) return; // espera a que termine el montaje
    foreach (['es', 'ca', 'en'] as $l) delete_transient('ssi_s2_idx_'.$l);
    update_option('cqs_s2_flushed', CQS_BUILD_VER.'-'.get_option('cqs_build'), false);
});

/* Menú principal por idioma: se monta una vez sin repetir todo el montaje (boot/build.php, cqs_step_menu) */
add_action('wp_loaded', function () {
    if (get_option('cqs_menu_v') === '3' || !function_exists('cqs_step_menu') || get_transient('cqs_menu_lock')) return;
    set_transient('cqs_menu_lock', 1, 120);
    if (!get_current_user_id()) wp_set_current_user(1);
    try { $r = cqs_step_menu(); update_option('cqs_menu_v', '3', false); } catch (Throwable $e) { $r = ['error' => $e->getMessage()]; }
    cqs_out('menu-run.json', $r);
    wp_set_current_user(0);
    do_action('litespeed_purge_all');
}, 20);

/* Mapa de una ruta a pie: [cqs_ruta id="calanans" lang="es"]. Trazado de cqs_step_routes_geo; Leaflet se carga al ver el mapa. */
add_shortcode('cqs_ruta', function ($a) {
    $a = shortcode_atts(['id' => '', 'lang' => 'es'], $a);
    $g = (array)get_option('cqs_routes_geo', []); $id = sanitize_key($a['id']);
    if (empty($g[$id])) { $R = cqs_json('routes.json'); if (empty($R[$id])) return ''; $g[$id] = ['c' => $R[$id], 'd' => 0, 'osm' => 0]; }
    $L = ['es' => ['Distancia aprox. (ida)', 'Mapa de la ruta', 'Inicio', 'Final', 'Ver en OpenStreetMap', 'Trazado orientativo por los puntos de paso'],
          'ca' => ['Distància aprox. (anada)', 'Mapa de la ruta', 'Inici', 'Final', 'Veure a OpenStreetMap', 'Traçat orientatiu pels punts de pas'],
          'en' => ['Approx. distance (one way)', 'Route map', 'Start', 'Finish', 'View on OpenStreetMap', 'Indicative line through the waypoints'],
          'fr' => ['Distance env. (aller)', 'Carte de l’itinéraire', 'Départ', 'Arrivée', 'Voir sur OpenStreetMap', 'Tracé indicatif par les points de passage']];
    $t = $L[$a['lang']] ?? $L['es']; $r = $g[$id]; $c = $r['c']; $s = $c[0];
    $km = $r['d'] ? number_format($r['d'] / 1000, 1, $a['lang'] === 'en' ? '.' : ',', '') . ' km' : '';
    $osm = 'https://www.openstreetmap.org/?mlat='.$s[0].'&amp;mlon='.$s[1].'#map=15/'.$s[0].'/'.$s[1].'&amp;layers=H';
    return '<div class="cq-route" data-c="'.esc_attr(wp_json_encode($c)).'" data-s="'.esc_attr($t[2]).'" data-e="'.esc_attr($t[3]).'" data-osm="'.(int)$r['osm'].'">'
        .'<div class="cq-route__map" role="img" aria-label="'.esc_attr($t[1]).'"></div>'
        .'<p class="cq-route__meta">'.($km ? '<strong>'.esc_html($t[0]).': '.$km.'</strong> · ' : '').(!$r['osm'] ? esc_html($t[5]).' · ' : '')
        .'<a href="'.$osm.'" target="_blank" rel="noopener">'.esc_html($t[4]).' ↗</a></p></div>';
});
add_action('wp_footer', function () {
    global $post; if (!$post || strpos((string)$post->post_content, '[cqs_ruta') === false) return; ?>
<script>
(function(){
  var B='/wp-content/plugins/cadaques-si/assets/leaflet/',q=[],loading=false;
  function load(cb){ if(window.SSI_L) return cb(); q.push(cb); if(loading) return; loading=true;
    var c=document.createElement('link');c.rel='stylesheet';c.href=B+'leaflet.css?ver=1.9.4';document.head.appendChild(c);
    var s=document.createElement('script');s.src=B+'leaflet.js?ver=1.9.4';s.onload=function(){window.SSI_L=window.L.noConflict?window.L.noConflict():window.L;q.forEach(function(f){f();});};document.head.appendChild(s); }
  function draw(box){ var L=window.SSI_L,c=JSON.parse(box.getAttribute('data-c')||'[]'); if(!c.length) return;
    var m=L.map(box.querySelector('.cq-route__map'),{scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
    L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',{maxZoom:18,opacity:.55,attribution:'<a href="https://hiking.waymarkedtrails.org">Waymarked Trails</a>'}).addTo(m);
    var line=L.polyline(c,{color:'#c0392b',weight:5,opacity:.9,dashArray:box.getAttribute('data-osm')==='1'?null:'8 8'}).addTo(m);
    L.circleMarker(c[0],{radius:8,weight:3,color:'#fff',fillColor:'#1e8449',fillOpacity:1}).addTo(m).bindTooltip(box.getAttribute('data-s'));
    L.circleMarker(c[c.length-1],{radius:8,weight:3,color:'#fff',fillColor:'#c0392b',fillOpacity:1}).addTo(m).bindTooltip(box.getAttribute('data-e'));
    m.fitBounds(line.getBounds(),{padding:[24,24]}); }
  var boxes=[].slice.call(document.querySelectorAll('.cq-route'));
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);load(function(){draw(e.target);});}});},{rootMargin:'300px'}):null;
  boxes.forEach(function(b){ if(io) io.observe(b); else load(function(){draw(b);}); });
})();
</script>
<?php }, 50);

/* Comprobación de los mapas de rutas (out/routes-check.json): una vez por montaje */
add_action('wp_loaded', function () {
    if (get_option('cqs_build') !== CQS_BUILD_VER || get_option('cqs_routes_check') === CQS_BUILD_VER) return;
    update_option('cqs_routes_check', CQS_BUILD_VER, false);
    $out = []; $g = (array)get_option('cqs_routes_geo', []);
    foreach (['es', 'fr'] as $l) $out['sc_'.$l] = substr(strip_tags(do_shortcode('[cqs_ruta id="calanans" lang="'.$l.'"]')), 0, 200);
    $p = get_posts(['post_type' => 'page', 'numberposts' => 1, 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => 'routes:es']]]);
    $out['routes_page'] = $p ? [get_permalink($p[0]), substr_count($p[0]->post_content, '[cqs_ruta')] : null;
    $out['geo'] = array_map(fn($r) => [count($r['c']), $r['d'], $r['osm']], $g);
    cqs_out('routes-check.json', $out);
}, 30);

/* «Cómo llegar» de las fichas: abre la ruta en Google Maps desde donde estés (en el móvil, en la app de mapas),
   en vez del formulario vacío de OpenStreetMap del núcleo. Vale para las tarjetas creadas por JavaScript. */
add_action('wp_footer', function () { ?>
<script>
(function(){
  function fix(a){
    var h=a.getAttribute('href')||'',m;
    if((m=h.match(/openstreetmap\.org\/directions\?to=([-\d.]+)(?:%2C|,)([-\d.]+)/i))) a.href='https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+m[1]+','+m[2];
    else if((m=h.match(/openstreetmap\.org\/search\?query=([^&#]+)/i))) a.href='https://www.google.com/maps/search/?api=1&query='+m[1];
    else return;
    a.target='_blank'; a.rel='noopener';
  }
  function all(){ [].forEach.call(document.querySelectorAll('a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search"]'),fix); }
  document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('a'); if(a) fix(a); },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',all); else all();
  if(window.MutationObserver) new MutationObserver(all).observe(document.body,{childList:true,subtree:true});
})();
</script>
<?php }, 60);

/* Títulos largos de fichas (más de 60 caracteres con « – Cadaqués Sí»): sin el nombre de la web */
add_filter('document_title_parts', function ($p) {
    if (!empty($p['title']) && is_singular('at_biz_dir') && mb_strlen(wp_strip_all_tags($p['title'])) > 44) unset($p['site']);
    return $p;
}, 120);

/* Índice A–Z de todas las fichas (página Directorio): cada ficha queda a dos clics de la portada */
add_shortcode('cqs_indice', function () {
    $l = cqs_cur_lang(); $k = 'cqs_idx_'.$l.'_'.CQS_BUILD_VER;
    if (($h = get_transient($k)) !== false) return $h;
    $ids = get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'orderby' => 'title', 'order' => 'ASC', 'lang' => '', 'suppress_filters' => true]);
    $T = ['es' => 'Todas las fichas de la A a la Z', 'ca' => 'Totes les fitxes de la A a la Z', 'en' => 'All listings from A to Z', 'fr' => 'Toutes les fiches de A à Z'][$l];
    $by = [];
    foreach ($ids as $id) {
        $t = trim(wp_strip_all_tags(get_the_title($id))); if ($t === '') continue;
        $c = strtoupper(remove_accents(mb_substr($t, 0, 1))); if (!preg_match('/[A-Z]/', $c)) $c = '#';
        $by[$c][] = '<a href="'.esc_url(get_permalink($id)).'">'.esc_html($t).'</a>';
    }
    ksort($by);
    $h = '<section class="cq-az"><h2 class="wp-block-heading ssi-h2">'.esc_html($T).' <small>('.count($ids).')</small></h2><nav class="cq-az__letters">';
    foreach (array_keys($by) as $c) $h .= '<a href="#az-'.($c === '#' ? '0' : $c).'">'.$c.'</a>';
    $h .= '</nav>';
    foreach ($by as $c => $links) $h .= '<h3 id="az-'.($c === '#' ? '0' : $c).'">'.$c.'</h3><p class="cq-az__list">'.implode(' · ', $links).'</p>';
    $h .= '</section>';
    set_transient($k, $h, 12 * HOUR_IN_SECONDS);
    return $h;
});

/* Listados pesados (mapa con todas las fichas, Comercios): se guardan 6 h para visitantes sin sesión */
add_filter('pre_do_shortcode_tag', function ($out, $tag, $attr) {
    if ($out !== false || $tag !== 'cdf_listado' || is_user_logged_in() || !empty($_GET)) return $out;
    $k = 'cqs_ls_'.md5(cqs_cur_lang().wp_json_encode($attr).CQS_BUILD_VER.get_option('cqs_build'));
    $c = get_transient($k); return $c !== false ? $c : $out;
}, 10, 3);
add_filter('do_shortcode_tag', function ($out, $tag, $attr) {
    if ($tag !== 'cdf_listado' || is_user_logged_in() || !empty($_GET) || strlen($out) < 200) return $out;
    set_transient('cqs_ls_'.md5(cqs_cur_lang().wp_json_encode($attr).CQS_BUILD_VER.get_option('cqs_build')), $out, 6 * HOUR_IN_SECONDS);
    return $out;
}, 10, 3);

/* Fotos de Cadaqués en Wikimedia Commons: lista de candidatas (out/gallery-cands.json) para elegir las mejores. Solo lee, no descarga. */
add_action('wp_loaded', function () {
    if (get_option('cqs_gal_scan') === '1' || get_transient('cqs_gal_lock') || !function_exists('cqs_wm_get')) return;
    set_transient('cqs_gal_lock', 1, 600); @set_time_limit(300);
    $api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json';
    $qs = ['deepcat:Cadaqués', 'deepcat:Portlligat', 'deepcat:"Cap de Creus"', 'Cadaqués', 'Portlligat', 'Cadaqués incategory:Quality_images', 'Cadaqués incategory:Featured_pictures_on_Wikimedia_Commons'];
    $titles = [];
    foreach ($qs as $q) for ($off = 0; $off < ($q === 'deepcat:Cadaqués' ? 600 : 200); $off += 50) {
        $j = cqs_wm_get($api.'&list=search&srnamespace=6&srlimit=50&sroffset='.$off.'&srsearch='.rawurlencode($q.' filetype:bitmap'));
        $r = (array)($j['query']['search'] ?? []); foreach ($r as $x) $titles[$x['title']] = $q;
        if (count($r) < 50) break;
    }
    $out = []; $all = array_keys($titles);
    for ($i = 0; $i < count($all); $i += 50) {
        $j = cqs_wm_get($api.'&prop=imageinfo|categories&iiprop=url|mime|size|extmetadata&iiurlwidth=480&cllimit=max&clcategories='.rawurlencode('Category:Quality images|Category:Featured pictures on Wikimedia Commons|Category:Valued images').'&titles='.rawurlencode(implode('|', array_slice($all, $i, 50))));
        foreach ((array)($j['query']['pages'] ?? []) as $p) {
            $ii = $p['imageinfo'][0] ?? null; if (!$ii || ($ii['mime'] ?? '') !== 'image/jpeg' || ($ii['width'] ?? 0) < 1600) continue;
            $m = $ii['extmetadata'] ?? []; $lic = (string)($m['LicenseShortName']['value'] ?? '');
            if (!preg_match('/^(CC BY|CC-BY|CC0|Public domain|PD)/i', $lic) || preg_match('/NC|ND/', $lic)) continue;
            $out[] = ['t' => $p['title'], 'th' => $ii['thumburl'] ?? '', 'w' => $ii['width'], 'h' => $ii['height'], 'lic' => $lic,
                'by' => mb_substr(trim(wp_strip_all_tags(html_entity_decode((string)($m['Artist']['value'] ?? ''), ENT_QUOTES))), 0, 60),
                'd' => mb_substr(strip_tags((string)($m['DateTimeOriginal']['value'] ?? '')), 0, 10),
                'desc' => mb_substr(trim(wp_strip_all_tags(html_entity_decode((string)($m['ImageDescription']['value'] ?? ''), ENT_QUOTES))), 0, 140),
                'q' => array_map(fn($c) => $c['title'], (array)($p['categories'] ?? [])), 'via' => $titles[$p['title']]];
        }
    }
    cqs_out('gallery-cands.json', ['n_titles' => count($all), 'n_ok' => count($out), 'c' => $out]);
    update_option('cqs_gal_scan', '1', false);
}, 40);
