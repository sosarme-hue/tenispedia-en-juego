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
    if (function_exists('ssi_xl_request') && ($x = ssi_xl_request())) return !empty($x['fr']) ? 'fr' : $x['lang']; // fichas y eventos: el idioma va en la URL
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
    if (get_option('cqs_menu_v') === '4' || !function_exists('cqs_step_menu') || get_transient('cqs_menu_lock')) return;
    set_transient('cqs_menu_lock', 1, 120);
    if (!get_current_user_id()) wp_set_current_user(1);
    try { $r = cqs_step_menu(); update_option('cqs_menu_v', '4', false); } catch (Throwable $e) { $r = ['error' => $e->getMessage()]; }
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

/* Sin «Cómo llegar» (petición de Alex, 24/11/2026): el botón llevaba a un mapa equivocado.
   Se quitan los enlaces de ruta/búsqueda de OpenStreetMap en fichas y tarjetas (también las creadas por JavaScript).
   El mapa de la ficha y el botón «Google Maps ↗» se quedan. */
add_action('wp_head', function () {
    echo '<style>a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search"]{display:none!important}'
        // Sin enlaces a Facebook e Instagram de momento (petición de Alex, 24/11/2026: apuntaban a otras guías)
        .'.ssi-social--fb,.ssi-social--ig,a[href*="facebook.com/profile.php?id=61595591297270"],a[href*="instagram.com/cadaques.si"]{display:none!important}</style>'."\n";
}, 1);
add_action('wp_footer', function () { ?>
<script>
(function(){
  var Q='a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search"],.ssi-social--fb,.ssi-social--ig,a[href*="facebook.com/profile.php?id=61595591297270"],a[href*="instagram.com/cadaques.si"]';
  // También los botones «Cómo llegar» que van a cualquier mapa externo (farmacia de guardia, «Útil ahora», playas, rutas); «Google Maps ↗» se queda
  var TX=/^\s*(c[óo]mo llegar|com arribar|directions|get directions|itin[ée]raire|comment y aller|s'y rendre)/i, MAP=/openstreetmap\.org|google\.[a-z.]+\/maps|maps\.google|maps\.apple|^geo:/i;
  function all(){ [].forEach.call(document.querySelectorAll(Q),function(a){a.parentNode&&a.parentNode.removeChild(a);});
    [].forEach.call(document.querySelectorAll('a[href]'),function(a){ if(TX.test(a.textContent||'')&&MAP.test(a.getAttribute('href')||'')&&a.parentNode) a.parentNode.removeChild(a); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',all); else all();
  var tq=0; if(window.MutationObserver) new MutationObserver(function(){ if(!tq) tq=setTimeout(function(){tq=0;all();},120); }).observe(document.body,{childList:true,subtree:true});
})();
</script>
<?php }, 60);

/* Títulos largos de fichas (más de 60 caracteres con « – Cadaqués Sí»): sin el nombre de la web */
add_filter('document_title_parts', function ($p) {
    if (is_front_page() || (function_exists('ssi_is_home_page') && ssi_is_home_page())) return $p;
    // Cada idioma con su propio título (la auditoría veía títulos repetidos entre ES/CA/EN/FR: fichas, Agenda, Mapa…)
    $l = cqs_cur_lang(); // ssi_lang() da 'en' en las páginas en francés
    $site = ['es' => 'Cadaqués Sí', 'ca' => 'Guia Cadaqués Sí', 'en' => 'Cadaqués Sí guide', 'fr' => 'Guide Cadaqués Sí'][$l];
    if (!empty($p['title'])) {
        if ($l === 'es' && is_singular('at_biz_dir') && mb_strlen(wp_strip_all_tags($p['title'])) > 44) unset($p['site']);
        else $p['site'] = $site;
    }
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

/* Fotos ampliables (v22): al pulsar una foto se abre en grande, con flechas para pasar a las demás de la página.
   También las fotos de las tarjetas: la foto se amplía y el título de la tarjeta sigue llevando a su sección (petición de Alex). */
add_action('wp_footer', function () {
    if (is_admin()) return;
    $L = cqs_cur_lang();
    $t = ['es' => ['Ampliar foto', 'Cerrar', 'Anterior', 'Siguiente'], 'ca' => ['Amplia la foto', 'Tanca', 'Anterior', 'Següent'],
          'en' => ['Enlarge photo', 'Close', 'Previous', 'Next'], 'fr' => ['Agrandir la photo', 'Fermer', 'Précédente', 'Suivante']][$L];
    ?>
<style>
.cq-zoomable{cursor:zoom-in}
.cq-lb{position:fixed;inset:0;z-index:99999;background:rgba(6,18,34,.94);display:none;align-items:center;justify-content:center;flex-direction:column;padding:56px 12px 16px}
.cq-lb.is-open{display:flex}
.cq-lb img{max-width:100%;max-height:calc(100vh - 130px);object-fit:contain;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.5);background:#0b1d33}
.cq-lb__cap{color:#e8eef5;font:15px/1.45 Figtree,system-ui,sans-serif;max-width:900px;text-align:center;margin:12px 8px 0;min-height:1em}
.cq-lb button{position:absolute;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;width:48px;height:48px;font-size:26px;line-height:48px;cursor:pointer;padding:0}
.cq-lb button:hover,.cq-lb button:focus-visible{background:rgba(255,255,255,.28);outline:2px solid #fff}
.cq-lb__x{top:10px;right:12px}.cq-lb__p{left:10px;top:50%;margin-top:-24px}.cq-lb__n{right:10px;top:50%;margin-top:-24px}
.cq-lb.is-single .cq-lb__p,.cq-lb.is-single .cq-lb__n{display:none}
body.cq-lb-on{overflow:hidden}
</style>
<script>
(function(){
  var T=<?php echo wp_json_encode($t); ?>, list=[], cur=0, lb, im, cap, last;
  function big(img){
    var s=img.getAttribute('srcset'), best=img.currentSrc||img.src, bw=0;
    if(s){s.split(',').forEach(function(p){var a=p.trim().split(/\s+/),w=parseInt(a[1]||'0',10);if(w>bw){bw=w;best=a[0];}});}
    var z=img.getAttribute('data-full'); if(z) best=z;
    // Miniaturas de Wikimedia Commons: pedir una versión grande
    best=best.replace(/(upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/)(\d+)px-([^\/]+)$/,function(m,a,w,f){return parseInt(w,10)<1600?a+'1600px-'+f:m;});
    return best;
  }
  function caption(img){
    var f=img.closest('figure'), c=f&&f.querySelector('figcaption');
    return (c&&c.textContent.trim())||img.getAttribute('alt')||'';
  }
  function ok(img){
    if(img.closest('button,.cq-lb,header,footer,.leaflet-container,.ssi-map,.ssi-logo')) return false;
    var src=img.currentSrc||img.src||''; if(!src||/^data:|\.svg(\?|$)/i.test(src)) return false;
    var r=img.getBoundingClientRect(); return (img.naturalWidth||r.width)>=160 && r.width>=100;
  }
  function build(){
    lb=document.createElement('div'); lb.className='cq-lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label',T[0]);
    lb.innerHTML='<button type="button" class="cq-lb__x" aria-label="'+T[1]+'">×</button><button type="button" class="cq-lb__p" aria-label="'+T[2]+'">‹</button><img alt=""><p class="cq-lb__cap"></p><button type="button" class="cq-lb__n" aria-label="'+T[3]+'">›</button>';
    document.body.appendChild(lb); im=lb.querySelector('img'); cap=lb.querySelector('.cq-lb__cap');
    lb.querySelector('.cq-lb__x').onclick=close; lb.querySelector('.cq-lb__p').onclick=function(){go(-1)}; lb.querySelector('.cq-lb__n').onclick=function(){go(1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close();});
    var sx=null; lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){if(sx===null)return;var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)go(d<0?1:-1);sx=null;});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('is-open'))return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1);});
  }
  function show(i){cur=(i+list.length)%list.length;var g=list[cur];im.src=big(g);im.alt=g.getAttribute('alt')||'';cap.textContent=caption(g);
    im.onerror=function(){if(im.src!==(g.currentSrc||g.src))im.src=g.currentSrc||g.src;};}
  function go(d){if(list.length>1)show(cur+d);}
  function open(img){if(!lb)build();list=[].filter.call(document.querySelectorAll('img.cq-zoomable'),function(x){return x.offsetParent!==null;});
    last=img;lb.classList.toggle('is-single',list.length<2);show(Math.max(0,list.indexOf(img)));lb.classList.add('is-open');document.body.classList.add('cq-lb-on');lb.querySelector('.cq-lb__x').focus();}
  function close(){lb.classList.remove('is-open');document.body.classList.remove('cq-lb-on');im.removeAttribute('src');if(last)last.focus();}
  function mark(img){if(img.classList.contains('cq-zoomable')||!ok(img))return;img.classList.add('cq-zoomable');img.setAttribute('tabindex','0');img.setAttribute('role','button');
    img.setAttribute('aria-label',T[0]+(img.alt?': '+img.alt:''));}
  function scan(){[].forEach.call(document.querySelectorAll('main img, #main img, .entry-content img, .site-main img, #primary img'),function(img){if(img.complete)mark(img);else img.addEventListener('load',function(){mark(img)},{once:true});});}
  document.addEventListener('click',function(e){if(e.button||e.ctrlKey||e.metaKey||e.shiftKey)return;var img=e.target.closest&&e.target.closest('img.cq-zoomable');
    if(!img&&document.elementsFromPoint&&e.clientX){var st=document.elementsFromPoint(e.clientX,e.clientY);for(var i=0;i<st.length;i++){if(st[i].matches&&st[i].matches('img.cq-zoomable')){img=st[i];break;}}}
    if(img){e.preventDefault();e.stopPropagation();open(img);}},true);
  document.addEventListener('keydown',function(e){var img=e.target;if((e.key==='Enter'||e.key===' ')&&img.classList&&img.classList.contains('cq-zoomable')){e.preventDefault();open(img);}});
  if(document.readyState!=='loading')scan();else document.addEventListener('DOMContentLoaded',scan);
  window.addEventListener('load',scan);setTimeout(scan,2500);
})();
</script>
<?php
}, 60);

/* «Verificar la ficha» y «Propón una corrección» (24/11/2026): el núcleo enlazaba a #fitxa / #listing, que no existen,
   y sin decir de qué ficha se trataba. Ahora llevan al formulario «Corrige una ficha» de «Tu opinión» en el idioma de la ficha,
   con el nombre y el enlace ya puestos y, al verificar, «Quiero verificar la ficha a mi nombre» y «Soy el propietario» marcados (como en sitges.si). */
function cqs_voice_url($l) {
    $x = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => 'voice:'.$l]]]);
    return $x ? get_permalink($x[0]) : '';
}
add_action('wp_footer', function () {
    if (!is_singular('at_biz_dir')) return;
    $l = cqs_cur_lang(); // ssi_lang() da 'en' en las páginas en francés
    $voice = cqs_voice_url($l) ?: cqs_voice_url('es'); if (!$voice) return;
    $id = get_queried_object_id();
    $link = function_exists('ssi_xl_permalink') ? ssi_xl_permalink($id, $l) : get_permalink($id);
    $base = add_query_arg(['fix-business' => rawurlencode(html_entity_decode(get_the_title($id), ENT_QUOTES)), 'fix-link' => rawurlencode($link)], $voice);
    $all = array_filter(array_map('cqs_voice_url', ['es', 'ca', 'en', 'fr']));
    ?>
<script>
(function(){
  var B=<?php echo wp_json_encode($base); ?>, V=<?php echo wp_json_encode(array_values(array_map(fn($u) => untrailingslashit(wp_parse_url($u, PHP_URL_PATH)), $all))); ?>;
  [].forEach.call(document.querySelectorAll('a[href*="#ficha"],a[href*="#fitxa"],a[href*="#listing"]'),function(a){
    var u; try{u=new URL(a.href,location.href);}catch(e){return;}
    if(u.host!==location.host||(V.indexOf(u.pathname.replace(/\/+$/,''))<0&&!a.closest('.ssi-listing__aside'))) return;
    var claim=a.closest('.ssi-claim')&&!a.closest('.ssi-claim__more');
    a.href=B+(claim?'&verificar=1':'')+'#ficha';
  });
  /* «¿Es tu negocio y prefieres no aparecer? Solicita la baja →» debajo de «Propón una corrección», como en sitges.si */
  if(!document.querySelector('.ssi-baja')){
    var fx=document.querySelector('.ssi-listing__aside p.ssi-more a[href*="#ficha"]');
    if(fx){var pp=document.createElement('p');pp.className='ssi-more ssi-baja';pp.style.marginTop='-.6rem';
      var ba=document.createElement('a');ba.href=B+'&baja=1#ficha';ba.rel='nofollow';ba.style.color='#5b6b75';ba.textContent=<?php echo wp_json_encode(['es' => '¿Es tu negocio y prefieres no aparecer? Solicita la baja →', 'ca' => 'És el teu negoci i prefereixes no sortir-hi? Sol·licita la baixa →', 'en' => 'Is this your business and you’d rather not be listed? Request removal →', 'fr' => 'C’est votre établissement et vous préférez ne pas apparaître ? Demandez le retrait →'][$l]); ?>;
      pp.appendChild(ba);fx.parentNode.parentNode.insertBefore(pp,fx.parentNode.nextSibling);}
  }
})();
</script>
<?php
}, 70);
/* En «Tu opinión»: rellena el formulario de la ficha con lo que llega en el enlace */
add_action('wp_footer', function () {
    if (!is_page()) return;
    $c = (string)get_post_field('post_content', get_queried_object_id());
    if (strpos($c, 'id="ficha"') === false) return; ?>
<script>
(function(){
  var q=new URLSearchParams(location.search); if(!q.get('fix-business')&&!q.get('verificar')&&!q.get('baja')) return;
  function go(){
    var f=(document.querySelector('[name="fix-business"]')||{}).form; if(!f) return;
    var b=f.querySelector('[name="fix-business"]'),k=f.querySelector('[name="fix-link"]'),w=f.querySelector('[name="fix-what"]');
    if(b&&q.get('fix-business')) b.value=q.get('fix-business');
    if(k&&q.get('fix-link')) k.value=q.get('fix-link');
    if(w&&(q.get('verificar')||q.get('baja'))){ var i=q.get('baja')?5:4; if(w.options[i]) w.selectedIndex=i; }
    if(q.get('verificar')||q.get('baja')){ var r=f.querySelectorAll('[name="fix-relation"]'); if(r[1]) r[1].checked=true; }
    var t=f.querySelector('[name="fix-body"]'); var s=document.getElementById('ficha')||f; s.scrollIntoView({block:'start'}); if(t) t.focus({preventScroll:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else go();
})();
</script>
<?php
}, 70);

/* Estado de la agenda automática (out/agenda-status.json), como mucho una vez cada 30 min: fuentes, última importación, próximo cron y eventos futuros */
add_action('wp_loaded', function () {
    if (get_transient('cqs_ag_stat') || !function_exists('cqs_out')) return;
    set_transient('cqs_ag_stat', 1, 1800);
    $log = (array)get_option('eiv_feeds_log', []);
    $fut = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true,
        'meta_query' => [['key' => '_EventEndDate', 'value' => current_time('mysql'), 'compare' => '>=', 'type' => 'DATETIME']]]);
    $auto = 0; foreach ($fut as $id) if (get_post_meta($id, '_eiv_feed', true)) $auto++;
    cqs_out('agenda-status.json', ['now' => wp_date('c'), 'feeds' => get_option('eiv_feeds', []), 'last_run' => !empty($log['ts']) ? wp_date('c', $log['ts']) : null, 'log' => $log['log'] ?? null,
        'next_cron' => ($n = wp_next_scheduled('eiv_feeds_cron')) ? wp_date('c', $n) : null, 'disable_wp_cron' => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON,
        'future_events' => count($fut), 'future_auto' => $auto]);
}, 50);

/* Sondeo de fuentes para la agenda (una vez por versión de la lista): qué páginas de agenda de Cadaqués responden y en qué formato */
add_action('wp_loaded', function () {
    $v = 'p3'; if (get_option('cqs_ag_probe') === $v || get_transient('cqs_ag_probe_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_ag_probe_lock', 1, 600); @set_time_limit(240);
    $U = [
        'gencat_q' => 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json?$limit=40&$q=Cadaqu%C3%A9s',
        'gencat_1' => 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json?$limit=1',
        'vc_home' => 'https://www.visitcadaques.org/', 'vc_agenda' => 'https://www.visitcadaques.org/agenda/', 'vc_ca' => 'https://www.visitcadaques.org/ca/agenda/',
        'vc_tribe' => 'https://www.visitcadaques.org/wp-json/tribe/events/v1/events?per_page=50', 'vc_ical' => 'https://www.visitcadaques.org/?ical=1',
        'aj_home' => 'https://www.cadaques.cat/', 'aj_agenda' => 'https://www.cadaques.cat/agenda', 'aj_tribe' => 'https://www.cadaques.cat/wp-json/tribe/events/v1/events?per_page=50',
        'fest' => 'https://www.festivalcadaques.cat/', 'fest2' => 'https://festivalcadaques.cat/',
        'cb' => 'https://www.costabrava.org/es/que-hacer/agenda?municipio=cadaques',
        'agendacat' => 'https://agenda.cultura.gencat.cat/content/agenda/ca/cerca.html?searchType=agenda&municipi=Cadaqu%C3%A9s',
    ];
    $o = ['eiv_feeds_run' => function_exists('eiv_feeds_run'), 'eiv_parse_jsonld' => function_exists('eiv_parse_jsonld'), 'tribe_create_event' => function_exists('tribe_create_event')];
    foreach ($U as $k => $u) {
        $r = wp_remote_get($u, ['timeout' => 20, 'redirection' => 5, 'user-agent' => 'Mozilla/5.0 (compatible; CadaquesSi/1.0; +https://cadaques.si)', 'headers' => ['Accept-Language' => 'es,ca;q=0.8']]);
        if (is_wp_error($r)) { $o[$k] = ['err' => $r->get_error_message()]; continue; }
        $b = wp_remote_retrieve_body($r);
        $o[$k] = ['code' => wp_remote_retrieve_response_code($r), 'type' => wp_remote_retrieve_header($r, 'content-type'), 'len' => strlen($b),
            'ldjson_events' => preg_match_all('/"@type"\s*:\s*"(?:\w*Event)"/', $b), 'vevent' => substr_count($b, 'BEGIN:VEVENT'),
            'ical_links' => array_slice(array_unique(preg_match_all('#href="([^"]*(?:ical|\.ics|feed|rss)[^"]*)"#i', $b, $m) ? $m[1] : []), 0, 8),
            'agenda_links' => array_slice(array_unique(preg_match_all('#href="([^"]*(?:agenda|event|esdeveniment|activitat)[^"]*)"#i', $b, $m) ? $m[1] : []), 0, 15),
            'head' => mb_strcut(preg_replace('/\s+/', ' ', $b), 0, 1500)];
    }
    cqs_out('agenda-probe.json', $o); update_option('cqs_ag_probe', $v, false);
}, 55);

/* Agenda automática (24/11/2026): cada 3 días se importan los actos de Cadaqués de la Agenda Cultural de Catalunya
   (datos abiertos de la Generalitat, analisi.transparenciacatalunya.cat, conjunto rhpv-yr4f) como eventos de The Events Calendar,
   sin duplicar (usa el importador eiv_import_event del núcleo). Informe en out/agenda-auto.json. */
function cqs_gencat_events() {
    $base = 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json';
    $today = wp_date('Y-m-d').'T00:00:00.000';
    $tries = [
        'municipi' => $base.'?$limit=500&$where='.rawurlencode("data_fi >= '$today' AND upper(comarca_i_municipi) like '%CADAQUES%'"),
        'text' => $base.'?$limit=500&$q='.rawurlencode('Cadaqués').'&$where='.rawurlencode("data_fi >= '$today'"),
    ];
    $rows = []; $rep = [];
    foreach ($tries as $k => $u) {
        $r = wp_remote_get($u, ['timeout' => 40, 'user-agent' => 'CadaquesSi/1.0 (+https://cadaques.si)']);
        $code = is_wp_error($r) ? $r->get_error_message() : wp_remote_retrieve_response_code($r);
        $j = is_wp_error($r) ? null : json_decode(wp_remote_retrieve_body($r), true);
        $rep[$k] = ['code' => $code, 'n' => is_array($j) && !isset($j['error']) ? count($j) : ($j['message'] ?? null)];
        if (is_array($j) && !isset($j['error'])) foreach ($j as $x) if (!empty($x['codi'])) $rows[$x['codi']] = $x;
    }
    return [$rows, $rep];
}
function cqs_agenda_run() {
    if (!function_exists('eiv_import_event')) return ['error' => 'sin importador'];
    [$rows, $rep] = cqs_gencat_events(); $tz = wp_timezone(); $evs = []; $skip = 0; $keys = [];
    foreach ($rows as $x) {
        if (!$keys) $keys = array_keys($x);
        // Solo actos que se celebran en Cadaqués (no los que solo lo mencionan)
        $where = remove_accents(mb_strtolower(implode(' ', array_map(fn($k) => is_string($x[$k] ?? null) ? $x[$k] : '', ['comarca_i_municipi', 'adre_a', 'espai', 'localitat', 'municipi']))));
        if (strpos($where, 'cadaques') === false) { $skip++; continue; }
        $hh = preg_match('/\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*h/u', (string)($x['horari'] ?? ''), $h) ? sprintf('%02d:%02d', $h[1], $h[2] ?? 0) : '';
        $d0 = substr((string)$x['data_inici'], 0, 10); $d1 = substr((string)($x['data_fi'] ?? $x['data_inici']), 0, 10);
        try { $s = new DateTimeImmutable($d0.($hh ? ' '.$hh : ''), $tz); $e = $d1 && $d1 !== $d0 ? new DateTimeImmutable($d1, $tz) : null; } catch (Exception $ex) { continue; }
        $link = '';
        foreach (['enlla_os', 'url', 'linkbotoentrades'] as $k) { $v = $x[$k] ?? ''; if (is_array($v)) $v = $v['url'] ?? ''; if (preg_match('#https?://[^\s,]+#', (string)$v, $m)) { $link = $m[0]; break; } }
        $place = trim(implode(', ', array_filter([is_string($x['espai'] ?? null) ? $x['espai'] : '', is_string($x['adre_a'] ?? null) ? $x['adre_a'] : ''])));
        $desc = trim((string)($x['subt_tol'] ?? '')."\n\n".(string)($x['descripcio'] ?? ''));
        if (!empty($x['horari'])) $desc = trim((string)$x['horari'])."\n\n".$desc;
        // Estado visible (25/11/2026): lo publicado en la Agenda Cultural de Catalunya cuenta como confirmado, con enlace al organizador
        $desc = 'Estado: confirmado. Publicado en la Agenda Cultural de Catalunya'.($link ? ' · Más información: '.$link : '')."\n\n".$desc;
        $evs[] = ['uid' => 'gencat'.$x['codi'], 'title' => html_entity_decode((string)($x['denominaci'] ?? ''), ENT_QUOTES), 'start' => $s, 'end' => $e, 'allday' => !$hh || $e,
                  'place' => $place, 'desc' => $desc, 'url' => $link ?: 'https://agenda.cultura.gencat.cat/'];
    }
    $f = ['id' => 'gencat', 'url' => 'https://analisi.transparenciacatalunya.cat/', 'link' => 'https://agenda.cultura.gencat.cat/', 'lang' => 'es', 'cat' => 'Cadaqués'];
    $new = 0; $max = (new DateTimeImmutable('today', $tz))->modify('+180 days'); $list = [];
    foreach ($evs as $ev) { if (empty($ev['title']) || $ev['start'] > $max) continue; $list[] = $ev['start']->format('Y-m-d').' · '.$ev['title']; if (eiv_import_event('gencat', $ev, $f)) $new++; }
    $out = ['ts' => wp_date('c'), 'fuente' => $rep, 'filas' => count($rows), 'fuera_de_cadaques' => $skip, 'actos' => count($evs), 'nuevos' => $new, 'lista' => array_slice($list, 0, 40), 'campos' => $keys];
    $out['visitcadaques'] = function_exists('cqs_vc_run') ? cqs_vc_run() : null; if (!empty($out['visitcadaques']['nuevos'])) $new += $out['visitcadaques']['nuevos'];
    update_option('cqs_agenda_last', time(), false);
    if ($new && function_exists('cqs_purge_all')) cqs_purge_all(); elseif ($new) do_action('litespeed_purge_all');
    if (function_exists('cqs_out')) cqs_out('agenda-auto.json', $out);
    return $out;
}
add_filter('cron_schedules', function ($s) { $s['cqs_3days'] = ['interval' => 3 * DAY_IN_SECONDS, 'display' => 'Cada 3 días']; return $s; });
add_action('init', function () { if (!wp_next_scheduled('cqs_agenda_cron')) wp_schedule_event(time() + 600, 'cqs_3days', 'cqs_agenda_cron'); });
add_action('cqs_agenda_cron', 'cqs_agenda_run');
// Respaldo por si el cron de WordPress se retrasa: si han pasado más de 3 días (o nunca se ha hecho), se lanza con la siguiente visita
add_action('wp_loaded', function () {
    if (time() - (int)get_option('cqs_agenda_last', 0) < 3 * DAY_IN_SECONDS || get_transient('cqs_agenda_lock')) return;
    set_transient('cqs_agenda_lock', 1, 900); @set_time_limit(180);
    cqs_agenda_run();
}, 60);

/* Copia del HTML de algunas páginas (out/snap-*.html) para revisarlas desde fuera; una vez por versión */
add_action('wp_loaded', function () {
    $v = 's12'; if (get_option('cqs_build') !== CQS_BUILD_VER || get_option('cqs_snap') === $v || get_transient('cqs_snap_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_snap_lock', 1, 600);
    $P = ['home' => home_url('/'), 'visit' => function_exists('cqs_voice_url') ? '' : ''];
    $x = get_posts(['post_type' => 'page', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => 'visit:es']]]);
    if ($x) $P['visit'] = get_permalink($x[0]);
    $y = get_posts(['post_type' => 'page', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => 'dali:es']]]);
    if ($y) $P['dali'] = get_permalink($y[0]);
    foreach (['voice:es' => 'voice-es', 'voice:ca' => 'voice-ca', 'voice:en' => 'voice-en', 'voice:fr' => 'voice-fr'] as $kk => $nm) { $z = get_posts(['post_type' => 'page', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => $kk]]]); if ($z) $P[$nm] = get_permalink($z[0]); }
    $lz = get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'lang' => 'es', 'orderby' => 'title', 'order' => 'ASC']);
    if ($lz) $P['listing'] = get_permalink($lz[0]);
    if ($lz && function_exists('ssi_xl_permalink')) { $P['listing-fr'] = home_url('/fr/directory/'.get_post_field('post_name', $lz[0]).'/'); $P['listing-en'] = ssi_xl_permalink($lz[0], 'en'); }
    foreach (['add:fr' => 'add-fr', 'services:fr' => 'services-fr', 'directory:fr' => 'directory-fr'] as $kk => $nm) { $z = get_posts(['post_type' => 'page', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => $kk]]]); if ($z) $P[$nm] = get_permalink($z[0]); }
    foreach (array_filter($P) as $k => $u) {
        $r = wp_remote_get(add_query_arg('nocache', time(), $u), ['timeout' => 30, 'sslverify' => false]);
        if (!is_wp_error($r)) @file_put_contents(SSI_DIR.'out/snap-'.$k.'.html', wp_remote_retrieve_body($r));
    }
    update_option('cqs_snap', $v, false);
}, 65);

/* Mensajes de los formularios (enviado, error, campo obligatorio…) en el idioma de cada formulario (24/11/2026).
   Contact Form 7 los ponía en el idioma de la instalación. Se aplica una vez por versión de textos. */
function cqs_cf7_messages() {
    return [
     'es' => ['mail_sent_ok' => 'Gracias. Hemos recibido tu mensaje y lo revisaremos pronto.', 'mail_sent_ng' => 'No se ha podido enviar. Inténtalo de nuevo más tarde o escríbenos a info@cadaques.si.',
              'validation_error' => 'Revisa los campos marcados.', 'spam' => 'No se ha podido enviar el mensaje.', 'accept_terms' => 'Para enviar, acepta la política de privacidad.',
              'invalid_required' => 'Rellena este campo.', 'invalid_too_long' => 'El texto es demasiado largo.', 'invalid_too_short' => 'El texto es demasiado corto.',
              'invalid_email' => 'Escribe un correo válido.', 'invalid_url' => 'Escribe un enlace válido (https://…).', 'invalid_tel' => 'Escribe un teléfono válido.', 'invalid_date' => 'Escribe una fecha válida.'],
     'ca' => ['mail_sent_ok' => 'Gràcies. Hem rebut el teu missatge i el revisarem aviat.', 'mail_sent_ng' => 'No s’ha pogut enviar. Torna-ho a provar més tard o escriu-nos a info@cadaques.si.',
              'validation_error' => 'Revisa els camps marcats.', 'spam' => 'No s’ha pogut enviar el missatge.', 'accept_terms' => 'Per enviar, accepta la política de privacitat.',
              'invalid_required' => 'Omple aquest camp.', 'invalid_too_long' => 'El text és massa llarg.', 'invalid_too_short' => 'El text és massa curt.',
              'invalid_email' => 'Escriu un correu vàlid.', 'invalid_url' => 'Escriu un enllaç vàlid (https://…).', 'invalid_tel' => 'Escriu un telèfon vàlid.', 'invalid_date' => 'Escriu una data vàlida.'],
     'en' => ['mail_sent_ok' => 'Thank you. We have received your message and will review it soon.', 'mail_sent_ng' => 'Your message could not be sent. Please try again later or email info@cadaques.si.',
              'validation_error' => 'Please check the highlighted fields.', 'spam' => 'Your message could not be sent.', 'accept_terms' => 'To send, please accept the privacy policy.',
              'invalid_required' => 'Please fill in this field.', 'invalid_too_long' => 'This text is too long.', 'invalid_too_short' => 'This text is too short.',
              'invalid_email' => 'Please enter a valid email address.', 'invalid_url' => 'Please enter a valid link (https://…).', 'invalid_tel' => 'Please enter a valid phone number.', 'invalid_date' => 'Please enter a valid date.'],
     'fr' => ['mail_sent_ok' => 'Merci. Nous avons bien reçu votre message et l’examinerons rapidement.', 'mail_sent_ng' => 'L’envoi a échoué. Réessayez plus tard ou écrivez-nous à info@cadaques.si.',
              'validation_error' => 'Vérifiez les champs signalés.', 'spam' => 'Le message n’a pas pu être envoyé.', 'accept_terms' => 'Pour envoyer, acceptez la politique de confidentialité.',
              'invalid_required' => 'Veuillez remplir ce champ.', 'invalid_too_long' => 'Le texte est trop long.', 'invalid_too_short' => 'Le texte est trop court.',
              'invalid_email' => 'Saisissez une adresse e-mail valide.', 'invalid_url' => 'Saisissez un lien valide (https://…).', 'invalid_tel' => 'Saisissez un numéro de téléphone valide.', 'invalid_date' => 'Saisissez une date valide.'],
    ];
}
add_action('wp_loaded', function () {
    $v = 'm1'; if (get_option('cqs_cf7_msgs') === $v || !class_exists('WPCF7_ContactForm')) return;
    $M = cqs_cf7_messages(); $rep = [];
    foreach ((array)get_option('cqs_cf7', []) as $kind => $byL) foreach ((array)$byL as $l => $id) {
        $cf = WPCF7_ContactForm::get_instance((int)$id); if (!$cf || empty($M[$l])) continue;
        $cf->set_properties(['messages' => array_merge((array)$cf->prop('messages'), $M[$l])]); $cf->save(); $rep[$kind][$l] = (int)$id;
    }
    update_option('cqs_cf7_msgs', $v, false);
    if (function_exists('cqs_out')) cqs_out('cf7-messages.json', $rep);
}, 45);

/* Prueba real de los 16 formularios (24/11/2026, pedida por Alex): envía cada uno por la misma vía que un visitante
   (API de Contact Form 7) con datos marcados «PRUEBA» y anota el resultado en out/forms-test.json. Una sola vez por versión. */
add_action('wp_loaded', function () {
    $v = 't5'; if (get_option('cqs_formtest') === $v || get_transient('cqs_formtest_lock5') || !class_exists('WPCF7_ContactForm') || !function_exists('cqs_out')) return;
    set_transient('cqs_formtest_lock5', 1, 900); update_option('cqs_formtest', $v, false); @set_time_limit(300);
    $fail = []; add_action('wp_mail_failed', function ($e) use (&$fail) { $fail[] = $e->get_error_message(); });
    $rep = ['ts' => wp_date('c')];
    $rep['wp_mail_directo'] = false && wp_mail('info@cadaques.si', 'PRUEBA envío de la web (SMTP web@)', 'Correo de prueba enviado por cadaques.si a través de web@cadaques.si. Se puede borrar.');
    foreach ((array)get_option('cqs_cf7', []) as $kind => $byL) foreach ((array)$byL as $l => $id) {
        if ($l !== 'es') continue; // una prueba por tipo de formulario
        $cf = WPCF7_ContactForm::get_instance((int)$id); if (!$cf) { $rep[$kind][$l] = 'no existe'; continue; }
        $ts = time() - 30;
        $data = ['_wpcf7' => $id, '_wpcf7_version' => defined('WPCF7_VERSION') ? WPCF7_VERSION : '', '_wpcf7_locale' => '', '_wpcf7_unit_tag' => 'wpcf7-f'.$id.'-test-o1', '_wpcf7_container_post' => 0,
                 'ssi_hp' => '', 'ssi_ts' => $ts.'.'.substr(hash_hmac('sha256', (string)$ts, wp_salt('nonce')), 0, 16)];
        foreach ($cf->scan_form_tags() as $t) {
            if (!$t->name) continue; $b = $t->basetype;
            if ($b === 'email') $data[$t->name] = 'info@cadaques.si';
            elseif ($b === 'url') $data[$t->name] = home_url('/');
            elseif ($b === 'tel') $data[$t->name] = '972000000';
            elseif ($b === 'date') $data[$t->name] = wp_date('Y-m-d', time() + 30 * DAY_IN_SECONDS);
            elseif ($b === 'acceptance') $data[$t->name] = '1';
            elseif (in_array($b, ['select', 'radio', 'checkbox'], true)) { $vals = $t->values ?: $t->labels; $data[$t->name] = $b === 'checkbox' ? [$vals[0] ?? ''] : ($vals[0] ?? ''); }
            else $data[$t->name] = 'PRUEBA automática del formulario «'.$kind.'» ('.$l.'). Se puede borrar.';
        }
        $bd = wp_generate_password(24, false); $body = '';
        foreach ($data as $k => $val) foreach ((array)$val as $vv) $body .= "--$bd\r\nContent-Disposition: form-data; name=\"".(is_array($val) ? $k.'[]' : $k)."\"\r\n\r\n".$vv."\r\n";
        $body .= "--$bd--\r\n";
        $r = wp_remote_post(rest_url('contact-form-7/v1/contact-forms/'.$id.'/feedback'), ['timeout' => 40, 'sslverify' => false, 'headers' => ['Content-Type' => 'multipart/form-data; boundary='.$bd], 'body' => $body]);
        $j = is_wp_error($r) ? ['error' => $r->get_error_message()] : json_decode(wp_remote_retrieve_body($r), true);
        $p = $cf->prop('mail');
        $rep[$kind][$l] = ['status' => $j['status'] ?? ($j['error'] ?? wp_remote_retrieve_response_code($r)), 'msg' => $j['message'] ?? '', 'invalid' => array_map(fn($x) => ($x['field'] ?? '').': '.($x['message'] ?? ''), (array)($j['invalid_fields'] ?? [])),
            'to' => $p['recipient'] ?? '', 'active' => !empty($p['active'])];
        usleep(300000);
    }
    $rep['wp_mail_failed'] = $fail;
    cqs_out('forms-test.json', $rep);
}, 70);

/* Hojas de contacto de las fotos candidatas de Commons (out/sheets/sheet-NN.b64.txt, JPEG en base64): 40 miniaturas numeradas por hoja,
   para elegirlas a ojo. Se hacen por tandas en visitas sucesivas. Solo lectura de Commons. */
add_action('wp_loaded', function () {
    if (get_option('cqs_sheets_done') === '1' || get_transient('cqs_sheets_lock') || !function_exists('imagecreatefromstring')) return;
    $f = SSI_DIR.'out/gallery-cands.json'; if (!file_exists($f)) return;
    set_transient('cqs_sheets_lock', 1, 240); @set_time_limit(200);
    $c = (array)(json_decode((string)file_get_contents($f), true)['c'] ?? []);
    $per = 40; $cols = 8; $cw = 240; $ch = 170; $n = (int)get_option('cqs_sheets_n', 0); $t0 = time();
    if (!is_dir(SSI_DIR.'out/sheets')) wp_mkdir_p(SSI_DIR.'out/sheets');
    while ($n * $per < count($c) && time() - $t0 < 150) {
        $im = imagecreatetruecolor($cols * $cw, (int)ceil($per / $cols) * $ch); $bg = imagecolorallocate($im, 30, 30, 30); imagefill($im, 0, 0, $bg);
        $w = imagecolorallocate($im, 255, 255, 0); $blk = imagecolorallocate($im, 0, 0, 0);
        for ($k = 0; $k < $per; $k++) {
            $i = $n * $per + $k; if ($i >= count($c)) break;
            $u = str_replace('/500px-', '/330px-', preg_replace('/\?.*$/', '', (string)$c[$i]['th']));
            $r = wp_remote_get($u, ['timeout' => 20, 'user-agent' => 'CadaquesSi/1.0 (https://cadaques.si; photo selection)']);
            if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) { $r = wp_remote_get(preg_replace('/\?.*$/', '', (string)$c[$i]['th']), ['timeout' => 20, 'user-agent' => 'CadaquesSi/1.0 (https://cadaques.si; photo selection)']); }
            $src = is_wp_error($r) ? false : @imagecreatefromstring(wp_remote_retrieve_body($r));
            $x = ($k % $cols) * $cw; $y = intdiv($k, $cols) * $ch;
            if ($src) { $sw = imagesx($src); $sh = imagesy($src); $s = min(($cw - 4) / $sw, ($ch - 4) / $sh);
                imagecopyresampled($im, $src, $x + 2 + (int)((($cw - 4) - $sw * $s) / 2), $y + 2 + (int)((($ch - 4) - $sh * $s) / 2), 0, 0, (int)($sw * $s), (int)($sh * $s), $sw, $sh); imagedestroy($src); }
            imagefilledrectangle($im, $x + 2, $y + 2, $x + 44, $y + 18, $blk); imagestring($im, 5, $x + 5, $y + 3, (string)$i, $w);
            usleep(150000);
        }
        ob_start(); imagejpeg($im, null, 62); $jpg = ob_get_clean(); imagedestroy($im);
        file_put_contents(SSI_DIR.sprintf('out/sheets/sheet-%02d.b64.txt', $n), base64_encode($jpg));
        $n++; update_option('cqs_sheets_n', $n, false);
    }
    if ($n * $per >= count($c)) update_option('cqs_sheets_done', '1', false);
    delete_transient('cqs_sheets_lock');
}, 75);

/* Site Reviews en francés (el núcleo solo traduce es/ca/en y en las páginas FR salía en inglés) */
add_filter('gettext', function ($tr, $text, $domain) {
    if ($domain !== 'site-reviews' || cqs_cur_lang() !== 'fr') return $tr;
    static $fr = ['There are no reviews yet. Be the first one to write one.' => 'Pas encore d’avis. Les premiers arriveront avec les fiches de l’annuaire.', 'Select a Rating' => 'Choisissez une note'];
    return $fr[$text] ?? $tr;
}, 20, 3);

/* Envío de correo por SMTP con el buzón web@cadaques.si (25/11/2026, elegido por Alex). Las credenciales están en
   wp-content/cqs-smtp.php, en el servidor y fuera del repositorio. Sin ese archivo, WordPress envía como antes. */
function cqs_smtp_conf() { static $c = null; if ($c === null) { $f = WP_CONTENT_DIR.'/cqs-smtp.php'; $c = is_readable($f) ? (array)include $f : []; } return $c; }
add_action('phpmailer_init', function ($m) {
    $c = cqs_smtp_conf(); if (empty($c['user']) || empty($c['pass'])) return;
    $m->isSMTP(); $m->Host = $c['host']; $m->Port = (int)$c['port']; $m->SMTPSecure = $c['secure']; $m->SMTPAuth = true;
    $m->Username = $c['user']; $m->Password = $c['pass'];
    $m->setFrom($c['user'], 'Cadaqués Sí', false); $m->Sender = $c['user'];
    // Un Reply-To con una dirección del propio dominio (p. ej. info@ escrito en el formulario) hace que el filtro lo mande a Spam: se quita
    foreach (array_keys($m->getReplyToAddresses()) as $rt) if (preg_match('/@cadaques\.si$/i', $rt)) { $m->clearReplyTos(); break; }
}, 99);
add_action('wp_mail_failed', function ($e) {
    if (!function_exists('cqs_out')) return;
    $f = SSI_DIR.'out/mail-fail.json'; $a = (array)json_decode((string)@file_get_contents($f), true);
    $a[] = ['ts' => wp_date('c'), 'error' => $e->get_error_message()]; cqs_out('mail-fail.json', array_slice($a, -20));
});

/* Formularios con el mismo estilo que sitges.si (25/11/2026): Contact Form 7 no ponía la clase ssi-form y los campos salían sin diseño. */
add_filter('wpcf7_form_class_attr', fn($c) => strpos($c, 'ssi-form') === false ? $c.' ssi-form' : $c);

/* Diagnóstico de spam (25/11/2026): tres variantes del correo de un formulario para ver cuál envía el filtro a Spam. Una sola vez. */
add_action('wp_loaded', function () {
    if (get_option('cqs_spamtest') === 'x1' || get_transient('cqs_spamtest_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_spamtest_lock', 1, 900); update_option('cqs_spamtest', 'x1', false);
    $body = "Cadaqués Sí · Propón una idea (es)\n\nidea-title: PRUEBA\nidea-topic: Otro\nyour-message: Prueba de entrega. Se puede borrar.\nyour-name: Prueba\nyour-email: %s\n\n--\nhttps://cadaques.si/tu-opinion/";
    $r = [];
    $r['A_replyto_info'] = wp_mail('info@cadaques.si', 'Cadaqués Sí · Prueba A', sprintf($body, 'info@cadaques.si'), ['Reply-To: info@cadaques.si']); sleep(3);
    $r['B_sin_replyto'] = wp_mail('info@cadaques.si', 'Cadaqués Sí · Prueba B', sprintf($body, '-')); sleep(3);
    $r['C_replyto_web'] = wp_mail('info@cadaques.si', 'Cadaqués Sí · Prueba C', sprintf($body, 'web@cadaques.si'), ['Reply-To: web@cadaques.si']);
    $r['ts'] = wp_date('c'); cqs_out('spam-test.json', $r);
}, 71);

/* Destino de los formularios (25/11/2026, decisión de Alex): su correo de administrador. Se aplica una vez a los 16 formularios. */
add_action('wp_loaded', function () {
    $to = 'partenopides@gmail.com';
    if (get_option('cqs_forms_to') === $to || !class_exists('WPCF7_ContactForm')) return;
    update_option('cqs_forms_to', $to);
    foreach ((array)get_option('cqs_cf7', []) as $byL) foreach ((array)$byL as $id) {
        $cf = WPCF7_ContactForm::get_instance((int)$id); if (!$cf) continue;
        $m = $cf->prop('mail'); $m['recipient'] = $to; $cf->set_properties(['mail' => $m]); $cf->save();
    }
    delete_option('cqs_formtest'); // vuelve a probar los formularios con el nuevo destino
}, 69);

/* Correo público de contacto: info@cadaques.si (Alex, 25/11/2026: se mantiene info@, con reenvío a su Gmail; lo revisará en 6 meses).
   Los formularios siguen llegando directos al Gmail de administrador (opción cqs_forms_to). */

/* Webs hermanas .si al pie de todas las páginas (Alex, 25/11/2026) */
add_action('kadence_footer', function () {
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    $lab = ['es' => 'Otras guías .si', 'ca' => 'Altres guies .si', 'en' => 'Other .si guides', 'fr' => 'Autres guides .si'][$l] ?? 'Otras guías .si';
    $S = ['sitges.si' => 'Sitges', 'vilanova.si' => 'Vilanova i la Geltrú', 'santperederibes.si' => 'Sant Pere de Ribes', 'garraf.si' => 'Garraf', 'castelldefels.si' => 'Castelldefels', 'santcugat.si' => 'Sant Cugat', 'eivissa.si' => 'Eivissa'];
    $a = [];
    foreach ($S as $d => $n) $a[] = '<a href="https://'.$d.'/" rel="noopener">'.esc_html($n).' Sí</a>';
    echo '<nav class="cqs-sisters" aria-label="'.esc_attr($lab).'"><div class="ssi-wrap"><span class="cqs-sisters__t">'.esc_html($lab).':</span> '.implode('<span aria-hidden="true"> · </span>', $a).'</div></nav>';
}, 11);

/* Francés en fichas, directorio, alta de negocio y opiniones (25/11/2026).
   El núcleo y los plugins usan el inglés como base para el francés; aquí se traducen al vuelo los textos de la interfaz
   (solo nodos de texto y placeholder/aria-label/title/botones; nunca scripts ni estilos). Diccionario: data/fr-ui.json */
function cqs_fr_ui() { static $x = null; if ($x === null) { $x = json_decode((string)@file_get_contents(SSI_DIR.'data/fr-ui.json'), true) ?: ['d' => [], 'm' => []]; } return $x; }
function cqs_fr_tr($s) {
    $X = cqs_fr_ui(); $D = $X['d']; if (trim($s) === '') return $s;
    $all = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if (!preg_match('/^([\s\x{00A0}]*)(.*?)([\s\x{00A0}]*)$/su', $all, $w)) return $s;
    $pre = esc_html($w[1]); $post = esc_html($w[3]); $dec = $w[2]; if ($dec === '') return $s;
    $r = null;
    if (isset($D[$dec])) $r = $D[$dec];
    elseif (preg_match('/^(.+?) →$/u', $dec, $m) && isset($D[$m[1]])) $r = $D[$m[1]].' →';
    elseif (preg_match('/^More in (.+)$/u', $dec, $m)) $r = 'Plus dans la catégorie '.($D[$m[1]] ?? $m[1]);
    elseif (preg_match('/^(.*) — Created and run by$/u', $dec, $m)) $r = $m[1].' — Créé et géré par';
    elseif (preg_match('/^(\d+) places?$/u', $dec, $m)) $r = $m[1].' lieux';
    elseif (preg_match('/^(\d+) of (\d+) on the map(.*)$/u', $dec, $m)) $r = $m[1].' sur '.$m[2].' sur la carte'.$m[3];
    elseif (strpos($dec, ' · ') !== false) { $p = explode(' · ', $dec); $ch = false; foreach ($p as &$q) if (isset($D[$q])) { $q = $D[$q]; $ch = true; } unset($q); if ($ch) $r = implode(' · ', $p); }
    if ($r === null && preg_match('/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/', $dec)) {
        $r = preg_replace_callback('/\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})\b/', fn($m) => $m[1].' '.$X['m'][$m[2]].' '.$m[3], $dec);
        $r = preg_replace('/^Updated:/', 'Mis à jour :', $r);
        if ($r === $dec) $r = null;
    }
    return $r === null ? $s : $pre.esc_html($r).$post;
}
function cqs_fr_ob($h) {
    if (stripos($h, '<html') === false) return $h;
    $root = untrailingslashit(home_url());
    $keep = []; // las líneas hreflang no se tocan (la de en-GB debe seguir en /en/)
    $h = preg_replace_callback('#<link rel="alternate" hreflang="[^"]+" href="[^"]*"\s*/?>#', function ($m) use (&$keep) { $k = '<!--cqfr'.count($keep).'-->'; $keep[$k] = $m[0]; return $k; }, $h);
    $h = str_replace([$root.'/en/directory/', $root.'/en/event/', '"/en/directory/', '.si\\/en\\/directory\\/'], [$root.'/fr/directory/', $root.'/fr/event/', '"/fr/directory/', '.si\\/fr\\/directory\\/'], $h); // fichas y eventos en su versión francesa
    $h = strtr($h, $keep);
    return preg_replace_callback('#(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<textarea\b[^>]*>.*?</textarea>)|>([^<>]+)(?=<)|\b(placeholder|aria-label|title|data-label)="([^"]*)"|(<input\b[^>]*\btype="(?:submit|button)"[^>]*\bvalue=")([^"]*)"#is', function ($m) {
        if (!empty($m[1])) return $m[0];
        if (isset($m[2]) && $m[2] !== '' && empty($m[3]) && empty($m[5])) return '>'.cqs_fr_tr($m[2]);
        if (!empty($m[3])) { $r = cqs_fr_tr($m[4]); return $m[3].'="'.esc_attr(html_entity_decode(trim($r), ENT_QUOTES, 'UTF-8')).'"'; }
        if (!empty($m[5])) { $r = cqs_fr_tr($m[6]); return $m[5].esc_attr(html_entity_decode(trim($r), ENT_QUOTES, 'UTF-8')).'"'; }
        return $m[0];
    }, $h) ?? $h;
}
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST) || cqs_cur_lang() !== 'fr') return;
    ob_start('cqs_fr_ob');
}, 0);

/* Fichas en francés con su propia dirección (/fr/directory/x/) en lugar de la inglesa (25/11/2026).
   Cambio puntual de inc/lang-urls.php, aplicado una vez (y también en boot/patches.php para futuras copias del núcleo). */
function cqs_fr_url_patches() {
    return [
        ['inc/lang-urls.php', "\$re = '#^(ca|en)/('", "\$re = '#^(ca|en|fr)/('"],
        ['inc/lang-urls.php', "\$m = preg_match(\$re, \$path, \$x) ? ['lang'=>\$x[1],", "\$m = preg_match(\$re, \$path, \$x) ? ['lang'=>(\$x[1] === 'fr' ? 'en' : \$x[1]), 'fr'=>(\$x[1] === 'fr'),"],
        ['inc/lang-urls.php', "if (preg_match('#^(ca|en)/#', \$rest)) \$rest = substr(\$rest, 3);", "\$rest = preg_replace('#^((ca|en|fr)/)+#', '', \$rest);"],
        ['inc/lang-urls.php', "return ssi_xl_url(\$url, \$GLOBALS['ssi_force_lang'] ?? ssi_lang());", "return ssi_xl_url(\$url, \$GLOBALS['ssi_force_lang'] ?? (function_exists('cqs_cur_lang') ? cqs_cur_lang() : ssi_lang()));"],
        ['inc/lang-urls.php', "\$rest = preg_replace('#^(ca|en)/#', '', substr(\$u, strlen(\$root)));", "\$rest = preg_replace('#^((ca|en|fr)/)+#', '', substr(\$u, strlen(\$root)));"],
        ['inc/lang-urls.php', "foreach (['es'=>'es-ES','ca'=>'ca','en'=>'en-GB'] as \$l=>\$h)", "foreach (['es'=>'es-ES','ca'=>'ca','en'=>'en-GB','fr'=>'fr-FR'] as \$l=>\$h)"],
    ];
}
add_action('init', function () {
    if (get_option('cqs_fr_urls') === 'u1') return;
    update_option('cqs_fr_urls', 'u1', false);
    $rep = [];
    foreach (cqs_fr_url_patches() as $i => [$f, $a, $b]) {
        $p = SSI_DIR.$f; $c = (string)@file_get_contents($p); $n = substr_count($c, $a);
        if ($n) file_put_contents($p, str_replace($a, $b, $c));
        $rep[] = "#$i ".($n ? "$n cambio(s)" : (strpos($c, $b) !== false ? 'ya estaba' : 'NO ENCAJA'));
    }
    if (function_exists('cqs_out')) cqs_out('fr-urls.txt', implode("\n", $rep));
}, 1);

/* El tiempo en Cadaqués en la portada (25/11/2026): [cqs_tiempo lang="es"]. Previsión de Open-Meteo (sin clave), en los cuatro idiomas.
   El servidor guarda los datos una hora; además el navegador los vuelve a pedir al cargar, así la página en caché nunca enseña una previsión vieja. */
function cqs_wx_data() {
    $c = get_transient('cqs_wx1'); if ($c !== false) return $c;
    $u = 'https://api.open-meteo.com/v1/forecast?latitude=42.2886&longitude=3.2776&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=5';
    $r = wp_remote_get($u, ['timeout' => 10]);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) return get_option('cqs_wx_last', []);
    $d = json_decode(wp_remote_retrieve_body($r), true); if (empty($d['daily'])) return get_option('cqs_wx_last', []);
    $d['_t'] = time(); set_transient('cqs_wx1', $d, HOUR_IN_SECONDS); update_option('cqs_wx_last', $d, false);
    return $d;
}
add_shortcode('cqs_tiempo', function ($a) {
    $a = shortcode_atts(['lang' => ''], $a); $l = $a['lang'] ?: (function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es');
    if (!in_array($l, ['es', 'ca', 'en', 'fr'], true)) $l = 'es';
    $T = ['es' => ['Ahora', 'Viento', 'Prob. lluvia', 'Previsión de Open-Meteo. Actualizada a las', 'Despejado|Poco nuboso|Nublado|Niebla|Llovizna|Lluvia|Nieve|Chubascos|Tormenta', 'es-ES'],
          'ca' => ['Ara', 'Vent', 'Prob. pluja', 'Previsió d’Open-Meteo. Actualitzada a les', 'Serè|Poc ennuvolat|Ennuvolat|Boira|Plugim|Pluja|Neu|Xàfecs|Tempesta', 'ca-ES'],
          'en' => ['Now', 'Wind', 'Chance of rain', 'Forecast by Open-Meteo. Updated at', 'Clear|Partly cloudy|Cloudy|Fog|Drizzle|Rain|Snow|Showers|Thunderstorm', 'en-GB'],
          'fr' => ['Maintenant', 'Vent', 'Risque de pluie', 'Prévisions Open-Meteo. Mises à jour à', 'Dégagé|Peu nuageux|Nuageux|Brouillard|Bruine|Pluie|Neige|Averses|Orage', 'fr-FR']][$l];
    $d = cqs_wx_data();
    $cfg = esc_attr(wp_json_encode(['t' => $T, 'd' => $d]));
    $h = '<div class="cq-wx" data-wx="'.$cfg.'"><div class="cq-wx__row"></div><p class="cq-wx__src"></p></div>';
    static $js = false;
    if (!$js) { $js = true; $h .= <<<'JS'
<script>(function(){
var ic=[[0,'☀️',0],[2,'⛅',1],[3,'☁️',2],[48,'🌫️',3],[57,'🌦️',4],[67,'🌧️',5],[77,'❄️',6],[82,'🌦️',7],[86,'❄️',6],[99,'⛈️',8]];
function code(c,n){for(var i=0;i<ic.length;i++)if(c<=ic[i][0])return[ic[i][1],n[ic[i][2]]];return['',''];}
function draw(el,d){var c=JSON.parse(el.getAttribute('data-wx')),T=c.t,n=T[4].split('|');d=d||c.d;if(!d||!d.daily)return;
var f=function(s,o){return new Date(s).toLocaleDateString(T[5],o);},h='',k=code(d.current.weather_code,n);
h+='<div class="cq-wx__d cq-wx__now"><b>'+T[0]+'</b><span class="i">'+k[0]+'</span><span class="mx">'+Math.round(d.current.temperature_2m)+'°</span><small>'+k[1]+' · '+T[1]+' '+Math.round(d.current.wind_speed_10m)+' km/h</small></div>';
for(var i=0;i<d.daily.time.length;i++){k=code(d.daily.weather_code[i],n);h+='<div class="cq-wx__d"><b>'+f(d.daily.time[i]+'T12:00',{weekday:'short',day:'numeric'})+'</b><span class="i">'+k[0]+'</span><span class="mx">'+Math.round(d.daily.temperature_2m_max[i])+'°</span> <span class="mn">'+Math.round(d.daily.temperature_2m_min[i])+'°</span><small>'+k[1]+' · '+T[2]+' '+(d.daily.precipitation_probability_max[i]|0)+'%</small></div>';}
el.querySelector('.cq-wx__row').innerHTML=h;var t=d._t?new Date(d._t*1000):new Date();
el.querySelector('.cq-wx__src').textContent=T[3]+' '+t.toLocaleTimeString(T[5],{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'})+'.';}
document.querySelectorAll('.cq-wx').forEach(function(el){draw(el);
fetch('https://api.open-meteo.com/v1/forecast?latitude=42.2886&longitude=3.2776&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=5')
.then(function(r){return r.json();}).then(function(d){if(d&&d.daily){d._t=Date.now()/1000;draw(el,d);}}).catch(function(){});});
})();</script>
JS;
    }
    return $h;
});

/* Agenda de Turisme de Cadaqués (visitcadaques.org), aprobada por Alex el 25/11/2026.
   Cada vez que corre la agenda automática (cada 3 días) se leen el mes en curso y los tres siguientes, en catalán, castellano e inglés,
   y cada acto se crea o se actualiza como evento con su estado («confirmado»), hora, lugar y enlace a la fuente. Informe en out/agenda-vc.json. */
function cqs_vc_month($y, $m, $lang) {
    $u = "https://visitcadaques.org/?ano=$y&lang=$lang&mes=$m&sec=agenda";
    $r = wp_remote_get($u, ['timeout' => 25, 'redirection' => 3, 'user-agent' => 'Mozilla/5.0 (compatible; CadaquesSi/1.0; +https://cadaques.si)']);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) return null;
    $b = wp_remote_retrieve_body($r);
    if (!preg_match('/^(?:\xEF\xBB\xBF)?/u', $b) || !mb_check_encoding($b, 'UTF-8')) $b = mb_convert_encoding($b, 'UTF-8', 'ISO-8859-1');
    $i = strpos($b, 'id="contingut"'); if ($i === false) return [];
    $b = substr($b, $i);
    $parts = preg_split('/<div id="cal_(esq|drt)"[^>]*>/', $b, -1, PREG_SPLIT_DELIM_CAPTURE);
    $out = []; $day = 0; $n = 0;
    for ($k = 1; $k < count($parts); $k += 2) {
        $kind = $parts[$k]; $chunk = $parts[$k + 1] ?? '';
        if ($kind === 'esq') { if (preg_match('/<span>(\d{1,2})<\/span>/', $chunk, $mm)) { $day = (int)$mm[1]; $n = 0; } continue; }
        if (!$day || !preg_match('/<h3>(.*?)<\/h3>/s', $chunk, $t)) continue;
        $clean = fn($s) => trim(preg_replace('/\s+/u', ' ', html_entity_decode(wp_strip_all_tags((string)$s), ENT_QUOTES | ENT_HTML5, 'UTF-8')), " \u{a0}");
        $title = $clean($t[1]); if ($title === '') continue;
        $hora = preg_match('/<span>\s*(?:HORA|HORARIO|TIME|HEURE)\s*:\s*(.*?)<\/span>/si', $chunk, $h) ? $clean($h[1]) : '';
        $lloc = preg_match('/<span>\s*(?:LLOC|LUGAR|PLACE|VENUE|LIEU)\s*:\s*(.*?)<\/span>/si', $chunk, $p) ? $clean($p[1]) : '';
        $desc = [];
        if (preg_match_all('/<p>(.*?)<\/p>/s', $chunk, $ps)) foreach ($ps[1] as $x) { $x = $clean($x); if ($x !== '') $desc[] = $x; }
        $out[] = ['day' => $day, 'i' => $n++, 'title' => $title, 'hora' => $hora, 'lloc' => $lloc, 'desc' => array_values(array_unique($desc)), 'url' => $u];
    }
    return $out;
}
function cqs_vc_case($s) {
    // Palabras en mayúsculas a minúsculas (salvo números romanos: III, VI…); el resto se deja como viene
    $s = preg_replace_callback('/[\p{Lu}][\p{Lu}\'’·]+/u', fn($m) => preg_match('/^[IVXLC]+$/', $m[0]) ? $m[0] : mb_strtolower($m[0]), $s);
    $s = preg_replace_callback('/\b([ivxlc]+)\b(?= (?:torneig|concurs|edició|torneo|concurso|edición|tournament|competition))/iu', fn($m) => mb_strtoupper($m[1]), $s);
    $s = mb_strtoupper(mb_substr($s, 0, 1)).mb_substr($s, 1);
    $s = preg_replace_callback('/(?<=\p{Ll} )([IAOYE])(?= )/u', fn($m) => mb_strtolower($m[1]), $s); // «Nadal I ball» → «Nadal i ball»
    $s = preg_replace_callback('/\/([A-Z])\b/u', fn($m) => '/'.mb_strtolower($m[1]), $s);
    $P = ['Cadaqués', 'Sant Sebastià', 'Sant Sebastián', 'Cap de Creus', 'Nadal', 'Navidad', 'Christmas', 'Reis', 'Reyes', 'Kings', 'Melcior', 'Gaspar', 'Gasspar', 'Baltasar', 'Melchor',
          'Es Poal', 'Es Llané', 'Portlligat', 'Dalí', 'Art i Joia', 'Unió Esportiva', 'Heribert Gispert', 'Santa Esperança', 'Sol Ixent', 'Orient', 'Oriente', 'Gaudí', 'Sant Silvestre', 'San Silvestre',
          'Festa Major d’Hivern', 'Festa Major', 'Fiesta Mayor', 'Barcelona City Ballet', 'Ràdio Cap de Creus', 'Radio Cap de Creus'];
    foreach ($P as $w) { $re = preg_quote($w, '/'); $re = strtr($re, ['’' => "['’]", "'" => "['’]"]); $s = preg_replace('/(?<![\p{L}])'.$re.'(?![\p{L}])/iu', $w, $s); }
    $s = str_replace("d'Hivern", 'd’Hivern', $s);
    $s = mb_strtoupper(mb_substr($s, 0, 1)).mb_substr($s, 1);
    return $s;
}
function cqs_vc_run() {
    if (!function_exists('tribe_create_event')) return ['error' => 'sin The Events Calendar'];
    $tz = wp_timezone(); $now = new DateTimeImmutable('first day of this month', $tz); $rep = ['ts' => wp_date('c'), 'meses' => []]; $new = 0; $upd = 0;
    $ST = ['es' => 'Estado: confirmado. Publicado en la agenda de Turisme de Cadaqués', 'ca' => 'Estat: confirmat. Publicat a l’agenda de Turisme de Cadaqués',
           'en' => 'Status: confirmed. Published in the Turisme de Cadaqués events calendar', 'fr' => 'Statut : confirmé. Publié dans l’agenda de Turisme de Cadaqués'];
    $LB = ['es' => ['Hora', 'Lugar', 'Fuente'], 'ca' => ['Hora', 'Lloc', 'Font'], 'en' => ['Time', 'Place', 'Source'], 'fr' => ['Heure', 'Lieu', 'Source']];
    for ($k = 0; $k < 4; $k++) {
        $d = $now->modify("+$k month"); $y = (int)$d->format('Y'); $m = (int)$d->format('n');
        $ca = cqs_vc_month($y, $m, 'cat'); if ($ca === null) { $rep['meses']["$y-$m"] = 'error'; continue; }
        $es = cqs_vc_month($y, $m, 'es') ?: []; $en = cqs_vc_month($y, $m, 'uk') ?: [];
        $idx = function ($rows) { $o = []; foreach ($rows as $r) $o[$r['day'].'-'.$r['i']] = $r; return $o; };
        $es = $idx($es); $en = $idx($en); $cnt = 0;
        foreach ($ca as $r) {
            if ($r['day'] > (int)$d->format('t')) continue;
            $date = sprintf('%04d-%02d-%02d', $y, $m, $r['day']);
            if ($date < wp_date('Y-m-d')) continue;
            if ($m === 12 && preg_match('/\b(REIS|REYES|KINGS|ROIS)\b/u', mb_strtoupper($r['title']))) continue; // la llegada de los Reyes es el 5 de enero: en diciembre es un error de la fuente
            $tr = ['ca' => $r, 'es' => $es[$r['day'].'-'.$r['i']] ?? $r, 'en' => $en[$r['day'].'-'.$r['i']] ?? $r];
            $tr['fr'] = $tr['en'];
            $hh = preg_match('/\b([01]?\d|2[0-3])[:.]([0-5]\d)/', $r['hora'], $x) ? sprintf('%02d:%02d', $x[1], $x[2]) : '';
            $key = 'vc:'.$date.':'.md5(mb_strtolower($r['title']));
            $T = []; $C = [];
            foreach ($tr as $L => $row) {
                $T[$L] = cqs_vc_case($row['title']);
                $c = '<p><strong>'.esc_html($ST[$L]).'</strong> (<a href="'.esc_url($r['url']).'" target="_blank" rel="noopener">visitcadaques.org</a>).</p>';
                if ($row['hora'] !== '') $c .= '<p>'.$LB[$L][0].': '.esc_html($row['hora']).'</p>';
                if ($row['lloc'] !== '') $c .= '<p>'.$LB[$L][1].': '.esc_html($row['lloc']).', Cadaqués</p>';
                foreach ($row['desc'] as $p) $c .= '<p>'.esc_html($p).'</p>';
                $C[$L] = $c;
            }
            $venue = $r['lloc'] !== '' ? $r['lloc'] : 'Cadaqués';
            $args = ['post_title' => $T['es'], 'post_content' => $C['es'], 'post_status' => 'publish', 'EventStartDate' => $date, 'EventEndDate' => $date, 'EventTimezone' => 'Europe/Madrid',
                     'Venue' => ['Venue' => $venue, 'City' => 'Cadaqués', 'Country' => 'Spain', 'Province' => 'Girona', 'Zip' => '17488']];
            if ($hh) { $e = (new DateTimeImmutable("$date $hh", $tz))->modify('+2 hours'); $args += ['EventStartHour' => substr($hh, 0, 2), 'EventStartMinute' => substr($hh, 3, 2), 'EventEndHour' => $e->format('H'), 'EventEndMinute' => $e->format('i')];
                       if ($e->format('Y-m-d') !== $date) { $args['EventEndHour'] = '23'; $args['EventEndMinute'] = '59'; } }
            else $args['EventAllDay'] = 'yes';
            $ex = get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $key, 'suppress_filters' => true, 'lang' => '']);
            if ($ex) { $id = (int)$ex[0]; tribe_update_event($id, $args); $upd++; }
            else { $id = tribe_create_event($args); if (!$id || is_wp_error($id)) continue; update_post_meta($id, '_cqs_key', $key); $new++; }
            update_post_meta($id, '_cqs_status', 'confirmado'); update_post_meta($id, '_cqs_src', $r['url']);
            update_post_meta($id, '_cqs_loc', ['name' => $venue]);
            foreach (['ca', 'en', 'fr'] as $L) { update_post_meta($id, '_ssi_title_'.$L, $T[$L]); update_post_meta($id, '_ssi_content_'.$L, $C[$L]); }
            wp_set_object_terms($id, ['cadaques'], 'tribe_events_cat', true);
            $cnt++;
        }
        $rep['meses']["$y-$m"] = $cnt;
    }
    $rep['nuevos'] = $new; $rep['actualizados'] = $upd;
    if (function_exists('cqs_out')) cqs_out('agenda-vc.json', $rep);
    return $rep;
}
