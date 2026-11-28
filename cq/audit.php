<?php
/* Arreglos de la auditoría del 25/11/2026 (/mnt/project-files/cadaques/auditoria-arreglos-2026-11-25.md).
   Todo lo que toca archivos del núcleo se aplica una vez aquí y también está en boot/patches.php para futuras copias. */
if (!defined('ABSPATH')) exit;

/* ---------- 1. Cambios puntuales en archivos del núcleo ---------- */
function cqs_audit_core_patches() {
    return [
        // Migas de pan y «Más en Dormir»: la sección se llama 'sleep', no 'stay' (antes llevaba a la portada)
        ['inc/i18n.php', "if (!isset(\$ids[\$key]) && \$key === 'services') \$key = 'shop';", "if (!isset(\$ids[\$key]) && \$key === 'services') \$key = 'shop';\n    if (!isset(\$ids[\$key]) && \$key === 'stay') \$key = 'sleep';"],
        // Sitemap de fichas también en francés
        ['inc/seo.php', "return ['ca' => (object)['name' => 'ca'], 'en' => (object)['name' => 'en']]; }", "return ['ca' => (object)['name' => 'ca'], 'en' => (object)['name' => 'en'], 'fr' => (object)['name' => 'fr']]; }"],
        ['inc/seo.php', "if (!in_array(\$subtype, ['ca', 'en'], true)) return [];", "if (!in_array(\$subtype, ['ca', 'en', 'fr'], true)) return [];"],
        ['inc/seo.php', "'#^((?:ca|en)/)?directory/([^/]+)\$#'", "'#^((?:ca|en|fr)/)?directory/([^/]+)\$#'"],
        // Categorías que faltaban en catalán e inglés («Naturaleza y rutas» salía en castellano)
        ['inc/dir-i18n.php', "'psiquiatria'=>['Psiquiatria','Psychiatry'],", "'psiquiatria'=>['Psiquiatria','Psychiatry'],\n   'alimentacion-y-mercados'=>['Alimentació i mercats','Food and markets'],'mercadillos'=>['Mercats ambulants','Street markets'],'naturaleza-y-rutas'=>['Natura i rutes','Nature and trails'],'playas-y-calas'=>['Platges i cales','Beaches and coves'],'centros-de-salud'=>['Centres de salut','Health centres'],'hospitales'=>['Hospitals','Hospitals'],'urgencias'=>['Urgències','Emergencies'],"],
    ];
}
add_action('init', function () {
    if (get_option('cqs_audit_core') === 'a1') return;
    update_option('cqs_audit_core', 'a1', false);
    $rep = [];
    foreach (cqs_audit_core_patches() as $i => [$f, $a, $b]) {
        $p = SSI_DIR.$f; $c = (string)@file_get_contents($p);
        if (strpos($c, $b) !== false) { $rep[] = "#$i ya estaba"; continue; }
        $n = substr_count($c, $a);
        if ($n) file_put_contents($p, str_replace($a, $b, $c));
        $rep[] = "#$i ".($n ? "$n cambio(s)" : 'NO ENCAJA');
    }
    if (function_exists('cqs_out')) cqs_out('audit-core.txt', implode("\n", $rep));
}, 0);

/* ---------- 2. Redirecciones: /fr/directory/, feeds de fichas, slug inglés de privacidad, fichas duplicadas ---------- */
add_action('template_redirect', function () {
    $path = trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if ($path === 'fr/directory' && function_exists('ssi_link')) { wp_safe_redirect(ssi_link('directory', 'fr'), 301); exit; }
    if (preg_match('#^((?:ca|en|fr)/)?(directory|event)/([^/]+)/feed(/[a-z0-9]*)?$#', $path, $m)) { wp_safe_redirect(home_url('/'.$m[1].$m[2].'/'.$m[3].'/'), 301); exit; }
    if ($path === 'en/privacy-policy-2' && function_exists('ssi_link')) { wp_safe_redirect(ssi_link('privacy', 'en'), 301); exit; }
    if (is_404() && preg_match('#^((?:ca|en|fr)/)?directory/([^/]+)$#', $path, $m)) {
        $map = (array)get_option('cqs_dup_map', []);
        if (!empty($map[$m[2]]) && get_post_status($map[$m[2]]) === 'publish') {
            $u = function_exists('ssi_xl_permalink') ? ssi_xl_permalink((int)$map[$m[2]], $m[1] ? rtrim($m[1], '/') : 'es') : get_permalink($map[$m[2]]);
            wp_safe_redirect($u, 301); exit;
        }
    }
}, 0);
/* Sin enlaces oEmbed en fichas y eventos (en francés apuntaban a la URL inglesa y daban 404) */
add_action('wp', function () { if (is_singular(['at_biz_dir', 'tribe_events'])) remove_action('wp_head', 'wp_oembed_add_discovery_links'); });
/* JSON-LD de eventos: descripción y nombre en el idioma de la página, lugar y organizador */
add_filter('tribe_json_ld_event_object', function ($data, $args = [], $post = null) {
    if (!is_object($data) || !($post instanceof WP_Post)) return $data;
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    if ($l !== 'es') {
        $c = trim((string)get_post_meta($post->ID, '_ssi_content_'.$l, true)); $t = trim((string)get_post_meta($post->ID, '_ssi_title_'.$l, true));
        if ($c !== '') $data->description = wp_html_excerpt(trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags(preg_replace('#</p>#', ' ', $c)))), 300, '…');
        if ($t !== '') $data->name = $t;
    }
    $loc = get_post_meta($post->ID, '_cqs_loc', true);
    if (is_array($loc)) {
        $pl = ['@type' => 'Place', 'name' => cqs_audit_xmap()[$l][$loc['name']] ?? $loc['name'], 'address' => (object)['@type' => 'PostalAddress', 'addressLocality' => 'Cadaqués', 'postalCode' => '17488', 'addressRegion' => 'Girona', 'addressCountry' => 'ES']];
        if (!empty($loc['lat'])) $pl['geo'] = (object)['@type' => 'GeoCoordinates', 'latitude' => $loc['lat'], 'longitude' => $loc['lng']];
        $data->location = (object)$pl;
    }
    $org = (string)get_post_meta($post->ID, '_cqs_org', true);
    if ($org !== '') $data->organizer = (object)['@type' => 'Organization', 'name' => $org, 'url' => 'https://www.cadaques.cat/'];
    $data->eventStatus = 'https://schema.org/EventScheduled';
    return $data;
}, 30, 3);
/* JSON-LD de eventos (28/11/2026, aviso de Search Console): image, offers y organizer en todos los eventos.
   image: la foto del evento o, si no tiene, una foto de la guía del lugar o tipo de acto. offers: enlace a la fuente, en euros, precio 0 solo si el texto dice que es gratuito.
   organizer: el que consta en el evento; si no, la entidad que aparece en el título; si no, el Ajuntament de Cadaqués, que publica la agenda municipal. */
function cqs_ev_img_for($post) {
    $im = (array)get_option('cqs_imgs', []);
    $txt = mb_strtolower($post->post_title.' '.(is_array($l = get_post_meta($post->ID, '_cqs_loc', true)) ? ($l['name'] ?? '') : '').' '.wp_strip_all_tags($post->post_content));
    $pick = [['/cap de creus|sol ixent|far |torre de les creus|camins/u', 'cm_capfar'], ['/missa|ofici|esglés|iglesi|iglesia|gospel|coral|canta/u', 'cm_church'],
             ['/platja|plaja|capbussada|llané|mar\b/u', 'cm_llane'], ['/portlligat|dalí/u', 'cm_portlligat'], ['/sardan|festa major|ball|passeig|portal/u', 'cm_statue']];
    $k = 'hero'; foreach ($pick as [$re, $kk]) if (preg_match($re, $txt)) { $k = $kk; break; }
    foreach ([$k, 'hero', 'cm_church'] as $kk) if (!empty($im[$kk]) && ($u = wp_get_attachment_image_url((int)$im[$kk], 'large'))) return $u;
    return '';
}
add_filter('tribe_json_ld_event_object', function ($data, $args = [], $post = null) {
    if (!is_object($data) || !($post instanceof WP_Post)) return $data;
    if (empty($data->image)) {
        $u = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, 'large') : cqs_ev_img_for($post);
        if ($u) $data->image = [$u];
    }
    if (empty($data->organizer)) {
        $all = $post->post_title.' '.wp_strip_all_tags($post->post_content);
        $known = ['Unió Esportiva Cadaqués', 'Societat l’Amistat', "Societat l'Amistat", 'Escola de Música de Cadaqués', 'Fundació Hospital de Cadaqués', 'Ràdio Cap de Creus', 'Art i Joia'];
        $org = ''; foreach ($known as $k) if (mb_stripos($post->post_title, $k) !== false) { $org = str_replace("'", '’', $k); break; }
        $data->organizer = $org !== '' ? (object)['@type' => 'Organization', 'name' => $org]
                                       : (object)['@type' => 'Organization', 'name' => 'Ajuntament de Cadaqués', 'url' => 'https://www.cadaques.cat/'];
    }
    if (empty($data->offers)) {
        $txt = mb_strtolower(wp_strip_all_tags($post->post_content.' '.get_post_meta($post->ID, '_ssi_content_ca', true).' '.get_post_meta($post->ID, '_EventCost', true)));
        $o = ['@type' => 'Offer', 'url' => (string)(get_post_meta($post->ID, '_cqs_src', true) ?: get_permalink($post)), 'priceCurrency' => 'EUR',
              'availability' => 'https://schema.org/InStock', 'validFrom' => get_post_time('c', true, $post)];
        if (preg_match('/gratu[iï]t|gratuita|gratis|gratuito|\bfree\b|entrada lliure|entrada libre|accés lliure|acceso libre|obert a tothom/u', $txt)) $o['price'] = '0';
        $data->offers = (object)$o;
    }
    return $data;
}, 40, 3);
/* Sitemap de eventos en catalán, inglés y francés (wp-sitemap-ssievents-ca-1.xml…) */
add_action('init', function () {
    if (!class_exists('WP_Sitemaps_Provider') || !function_exists('wp_register_sitemap_provider') || !function_exists('ssi_xl_permalink') || class_exists('CQS_Sitemap_Events')) return;
    class CQS_Sitemap_Events extends WP_Sitemaps_Provider {
        public function __construct() { $this->name = 'ssievents'; $this->object_type = 'post'; }
        public function get_object_subtypes() { return ['ca' => (object)['name' => 'ca'], 'en' => (object)['name' => 'en'], 'fr' => (object)['name' => 'fr']]; }
        public function get_url_list($page_num, $subtype = '') {
            if (!in_array($subtype, ['ca', 'en', 'fr'], true)) return [];
            $q = new WP_Query(['post_type' => 'tribe_events', 'post_status' => 'publish', 'posts_per_page' => 500, 'paged' => max(1, (int)$page_num), 'orderby' => 'ID', 'order' => 'ASC', 'no_found_rows' => true, 'lang' => '', 'suppress_filters' => true]);
            $out = []; foreach ($q->posts as $p) { $u = ssi_xl_permalink($p, $subtype); if ($u) $out[] = ['loc' => $u, 'lastmod' => wp_date(DATE_W3C, strtotime($p->post_modified_gmt.' UTC'))]; }
            return $out;
        }
        public function get_max_num_pages($subtype = '') { $c = wp_count_posts('tribe_events'); return (int)ceil(max(1, (int)($c->publish ?? 0)) / 500); }
    }
    wp_register_sitemap_provider('ssievents', new CQS_Sitemap_Events());
}, 20);
add_filter('wp_sitemaps_add_provider', function ($p, $name = '') { if ($p instanceof CQS_Sitemap_Events) $GLOBALS['cqs_sm_events'] = $p; return $p; }, 5, 2);
add_filter('wp_sitemaps_add_provider', function ($p, $name = '') { return ($name === 'ssievents' && !empty($GLOBALS['cqs_sm_events'])) ? $GLOBALS['cqs_sm_events'] : $p; }, 50, 2);
/* Sin enlaces a feeds de comentarios de cada ficha (daban 404) */
add_action('wp', function () { if (is_singular(['at_biz_dir', 'tribe_events'])) remove_action('wp_head', 'feed_links_extra', 3); });

/* ---------- 3. Títulos de pestaña: con la marca de cada idioma y como mucho 65 caracteres (se recorta el nombre, no la marca) ---------- */
add_filter('document_title_parts', function ($p) {
    if (empty($p['title']) || is_front_page() || (function_exists('ssi_is_home_page') && ssi_is_home_page())) return $p;
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    $site = ['es' => 'Cadaqués Sí', 'ca' => 'Guia Cadaqués Sí', 'en' => 'Cadaqués Sí guide', 'fr' => 'Guide Cadaqués Sí'][$l] ?? 'Cadaqués Sí';
    unset($p['tagline']); $p['site'] = $site;
    $t = html_entity_decode(wp_strip_all_tags($p['title']), ENT_QUOTES, 'UTF-8');
    $room = 65 - 3 - mb_strlen($site) - (isset($p['page']) ? mb_strlen((string)$p['page']) + 3 : 0);
    if (mb_strlen($t) > $room) { $c = mb_substr($t, 0, $room - 1); $sp = mb_strrpos($c, ' '); $p['title'] = rtrim($sp > $room * 0.6 ? mb_substr($c, 0, $sp) : $c, " ,·|–-:").'…'; }
    return $p;
}, 200);

/* ---------- 4. Textos de interfaz en el idioma de la página ---------- */
function cqs_audit_ui() {
    return [
        'es' => [
            'Your review' => 'Tu opinión', 'Your overall rating' => 'Tu valoración general', 'Title of your review' => 'Título de tu opinión',
            'Your name' => 'Tu nombre', 'Your email' => 'Tu correo electrónico', 'Submit Review' => 'Enviar opinión', 'Submit Your Review' => 'Enviar opinión',
            'This review is based on my own experience and is my genuine opinion.' => 'Esta opinión se basa en mi propia experiencia y es sincera.',
            'Submitting, please wait...' => 'Enviando, un momento…', 'Tell people your review' => 'Cuenta tu experiencia',
            'Summarize your review or highlight an interesting detail' => 'Resume tu opinión o destaca un detalle', 'Tell us your name' => 'Escribe tu nombre', 'Tell us your email' => 'Escribe tu correo',
            '5 Stars' => '5 estrellas', '4 Stars' => '4 estrellas', '3 Stars' => '3 estrellas', '2 Stars' => '2 estrellas', '1 Star' => '1 estrella',
            'This field is required.' => 'Este campo es obligatorio.', 'This field must be accepted.' => 'Marca esta casilla para continuar.',
            'This field requires a valid e-mail address.' => 'Escribe un correo electrónico válido.', 'Please fix the submission errors.' => 'Revisa los campos marcados.',
            'Your review has been submitted!' => '¡Gracias! Hemos recibido tu opinión.', 'Your review has been submitted and is pending approval.' => '¡Gracias! Publicaremos tu opinión cuando la revisemos.',
            'Close Modal' => 'Cerrar',
        ],
        'ca' => [
            'Your review' => 'La teva opinió', 'Your overall rating' => 'La teva valoració general', 'Title of your review' => 'Títol de la teva opinió',
            'Your name' => 'El teu nom', 'Your email' => 'El teu correu electrònic', 'Submit Review' => 'Envia l’opinió', 'Submit Your Review' => 'Envia l’opinió',
            'This review is based on my own experience and is my genuine opinion.' => 'Aquesta opinió es basa en la meva experiència i és sincera.',
            'Submitting, please wait...' => 'Enviant, un moment…', 'Tell people your review' => 'Explica la teva experiència',
            'Summarize your review or highlight an interesting detail' => 'Resumeix la teva opinió o destaca un detall', 'Tell us your name' => 'Escriu el teu nom', 'Tell us your email' => 'Escriu el teu correu',
            '5 Stars' => '5 estrelles', '4 Stars' => '4 estrelles', '3 Stars' => '3 estrelles', '2 Stars' => '2 estrelles', '1 Star' => '1 estrella',
            'This field is required.' => 'Aquest camp és obligatori.', 'This field must be accepted.' => 'Marca aquesta casella per continuar.',
            'This field requires a valid e-mail address.' => 'Escriu un correu electrònic vàlid.', 'Please fix the submission errors.' => 'Revisa els camps marcats.',
            'Your review has been submitted!' => 'Gràcies! Hem rebut la teva opinió.', 'Your review has been submitted and is pending approval.' => 'Gràcies! Publicarem la teva opinió quan l’haguem revisada.',
            'Close Modal' => 'Tanca',
        ],
        'fr' => [
            'Submitting, please wait...' => 'Envoi en cours…', 'This field is required.' => 'Ce champ est obligatoire.', 'This field must be accepted.' => 'Cochez cette case pour continuer.',
            'This field requires a valid e-mail address.' => 'Saisissez une adresse e-mail valide.', 'Please fix the submission errors.' => 'Vérifiez les champs signalés.',
            'Your review has been submitted!' => 'Merci ! Nous avons bien reçu votre avis.', 'Your review has been submitted and is pending approval.' => 'Merci ! Votre avis sera publié après relecture.',
            'Close Modal' => 'Fermer', 'Submit Your Review' => 'Envoyer mon avis',
        ],
    ];
}
add_filter('gettext', function ($tr, $text, $domain) {
    if ($domain !== 'site-reviews' || (is_admin() && !wp_doing_ajax())) return $tr;
    static $U = null; if ($U === null) $U = cqs_audit_ui();
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    return $U[$l][$text] ?? $tr;
}, 30, 3);

/* Site Reviews: avisos de opiniones nuevas al correo de los formularios (estaba el de sitges.si) */
add_action('init', function () {
    if (get_option('cqs_sr_mail') === 'm1') return;
    $o = get_option('site_reviews'); $to = (string)get_option('cqs_forms_to', '');
    if (!is_array($o) || !isset($o['settings']['general']) || !is_email($to)) return;
    $o['settings']['general']['notification_email'] = $to;
    update_option('site_reviews', $o); update_option('cqs_sr_mail', 'm1', false);
}, 30);

/* Textos sueltos por idioma (lugares de eventos, país, categorías de eventos, alta de negocio) */
function cqs_audit_xmap() {
    $V1 = 'Església de Santa Maria de Cadaqués y otros espacios del pueblo'; $V2 = 'Cadaqués (recorrido por el centro del pueblo, pendiente de confirmar)'; $V3 = 'Cadaqués (calles y plazas del pueblo)';
    return [
        'es' => ['Save & Next' => 'Guardar y seguir', 'Website' => 'Web', 'Spain' => 'España', 'fiestas' => 'Fiestas', 'cadaques' => 'Cadaqués'],
        'ca' => ['Save & Next' => 'Desa i continua', 'Website' => 'Web', 'Spain' => 'Espanya', 'fiestas' => 'Festes', 'cadaques' => 'Cadaqués',
                 $V1 => 'Església de Santa Maria de Cadaqués i altres espais del poble', $V2 => 'Cadaqués (recorregut pel centre del poble, pendent de confirmar)', $V3 => 'Cadaqués (carrers i places del poble)'],
        'en' => ['fiestas' => 'Festivities', 'cadaques' => 'Cadaqués',
                 $V1 => 'Church of Santa Maria, Cadaqués, and other spots in the village', $V2 => 'Cadaqués (route through the village centre, to be confirmed)', $V3 => 'Cadaqués (streets and squares of the village)'],
        'fr' => ['Spain' => 'Espagne', 'fiestas' => 'Fêtes', 'cadaques' => 'Cadaqués',
                 $V1 => 'Église Santa Maria de Cadaqués et autres lieux du village', $V2 => 'Cadaqués (parcours dans le centre du village, à confirmer)', $V3 => 'Cadaqués (rues et places du village)'],
    ];
}
/* ---------- 5. Ajustes del HTML de cada página (todas las lenguas) ---------- */
function cqs_audit_months($s, $l) {
    $en = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if ($l === 'ca') {
        $ca = ['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
        $s = preg_replace_callback('/\b(de |d’|d\')?('.implode('|', $en).')\b/u', function ($m) use ($en, $ca) {
            $c = $ca[array_search($m[2], $en, true)];
            if ($m[1] === '') return $c;
            return (preg_match('/^[aeiouàèéíòóú]/u', $c) ? 'd’' : 'de ').$c;
        }, $s);
        $s = preg_replace('/\b(de )(abril|agost|octubre)\b/u', 'd’$2', $s);
    } elseif ($l === 'fr') {
        $fr = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
        $s = preg_replace_callback('/\b('.implode('|', $en).')\s+(\d{1,2})\b/u', fn($m) => $m[2].' '.$fr[array_search($m[1], $en, true)], $s);
        $s = preg_replace_callback('/\b('.implode('|', $en).')\b/u', fn($m) => $fr[array_search($m[1], $en, true)], $s);
        $s = strtr($s, ['Monday' => 'lundi', 'Tuesday' => 'mardi', 'Wednesday' => 'mercredi', 'Thursday' => 'jeudi', 'Friday' => 'vendredi', 'Saturday' => 'samedi', 'Sunday' => 'dimanche', 'All day' => 'Toute la journée', 'All Day' => 'Toute la journée']);
    }
    return $s;
}
function cqs_audit_ob($h) {
    if (stripos($h, '<html') === false) return $h;
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    // «0.0 (0)» en las tarjetas del directorio
    $nr = ['es' => 'Sin valoraciones', 'ca' => 'Sense valoracions', 'en' => 'No reviews yet', 'fr' => 'Aucun avis'][$l] ?? 'Sin valoraciones';
    $h = preg_replace('#<span class="directorist-rating-avg">\s*0\.0\s*</span>\s*<span class="directorist-total-review">\s*\(0\)\s*</span>#', '<span class="directorist-rating-avg cq-norev">'.$nr.'</span>', $h);
    // Eventos: meta descripción en el idioma de la página (salía en castellano)
    if ($l !== 'es' && function_exists('ssi_xl_request') && ($xr = ssi_xl_request()) && $xr['type'] === 'tribe_events' && ($ev = get_page_by_path($xr['slug'], OBJECT, 'tribe_events'))) {
        $c = trim((string)get_post_meta($ev->ID, '_ssi_content_'.$l, true));
        if ($c !== '') {
            $t = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags(preg_replace('#</p>#', ' ', html_entity_decode($c, ENT_QUOTES, 'UTF-8')))));
            if (mb_strlen($t) > 158) { $t = mb_substr($t, 0, 157); $t = mb_substr($t, 0, (int)mb_strrpos($t, ' ')).'…'; }
            $h = preg_replace_callback('#(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"#', fn($mm) => $mm[1].esc_attr($t).'"', $h);
        }
    }
    // Ficha actualizada frente a datos comprobados con el establecimiento
    if (is_singular('at_biz_dir')) {
        $id = get_queried_object_id();
        $ok = get_post_meta($id, '_cqs_checked', true) || (string)get_post_meta($id, '_claimed_by_admin', true) === '1';
        $L = ['es' => ['Ficha actualizada', 'Datos comprobados con el establecimiento', 'Datos de fuentes públicas, aún sin comprobar con el establecimiento'],
              'ca' => ['Fitxa actualitzada', 'Dades comprovades amb l’establiment', 'Dades de fonts públiques, encara sense comprovar amb l’establiment'],
              'en' => ['Listing updated', 'Details checked with the business', 'Details from public sources, not yet checked with the business'],
              'fr' => ['Fiche mise à jour', 'Données vérifiées auprès de l’établissement', 'Données issues de sources publiques, pas encore vérifiées auprès de l’établissement']][$l];
        $h = preg_replace_callback('#(<div class="ssi-listing__meta">\s*)<span>[^<:]+:\s*([^<]+)</span>#u', fn($m) => $m[1].'<span>'.$L[0].($l === 'fr' ? ' : ' : ': ').cqs_audit_months(trim($m[2]), $l).'</span> <span class="cq-check'.($ok ? ' is-ok' : '').'">'.($ok ? '✓ '.$L[1] : $L[2]).'</span>', $h, 1);
    }
    // Imágenes de la biblioteca: width/height y srcset (tamaño por el nombre del archivo o por el adjunto; caché en cqs_imgdims)
    $n = 0; static $C = null; if ($C === null) $C = (array)get_option('cqs_imgdims', []); $dirty = false; $budget = 150;
    $up = wp_upload_dir(); $base = $up['baseurl']; $bdir = $up['basedir'];
    $h = preg_replace_callback('#<img\b([^>]*)>#i', function ($m) use (&$n, &$C, &$dirty, &$budget, $base, $bdir) {
        $a = $m[1];
        if (!preg_match('#\bsrc="(https?://[^"]*?/wp-content/(?:uploads|plugins|themes)/[^"?]+\.(?:jpe?g|png|webp|gif))(?:\?[^"]*)?"#i', $a, $sm)) return $m[0];
        $isUp = strpos($sm[1], '/wp-content/uploads/') !== false;
        $src = preg_replace('#^https?:#', '', $sm[1]); $n++;
        $hasW = (bool)preg_match('/\bwidth=/', $a); $hasS = (bool)preg_match('/\bsrcset=/', $a);
        if ($hasW && $hasS) return $m[0];
        if (!isset($C[$src])) {
            if ($budget-- <= 0) { $C2 = null; } else {
                $w = 0; $hh = 0; $set = '';
                if (preg_match('/-(\d{2,4})x(\d{2,4})\.[a-z]+$/i', $src, $dm)) { $w = (int)$dm[1]; $hh = (int)$dm[2]; }
                $orig = preg_replace('/-\d{2,4}x\d{2,4}(\.[a-z]+)$/i', '$1', $sm[1]);
                $id = $isUp ? attachment_url_to_postid($orig) : 0;
                if ($id) {
                    $md = wp_get_attachment_metadata($id);
                    if (!$w && !empty($md['width'])) { $w = (int)$md['width']; $hh = (int)$md['height']; }
                    if ($w) $set = (string)wp_calculate_image_srcset([$w, $hh], $sm[1], $md, $id);
                }
                if (!$w) { $f = WP_CONTENT_DIR.substr($sm[1], strpos($sm[1], '/wp-content') + strlen('/wp-content')); $gs = @getimagesize($f); if ($gs) { $w = $gs[0]; $hh = $gs[1]; } }
                $C[$src] = [$w, $hh, $set]; $dirty = true;
            }
        }
        $d = $C[$src] ?? null; if (!$d || !$d[0]) return $m[0];
        $add = '';
        if (!$hasW) $add .= ' width="'.$d[0].'" height="'.$d[1].'"';
        if (!$hasS && $d[2] !== '') $add .= ' srcset="'.esc_attr($d[2]).'" sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 400px"';
        if ($n > 3 && stripos($a, 'loading=') === false) $add .= ' loading="lazy"';
        if (stripos($a, 'decoding=') === false) $add .= ' decoding="async"';
        return '<img'.$add.$a.'>';
    }, $h) ?? $h;
    if ($dirty) { if (count($C) > 8000) $C = array_slice($C, -6000, null, true); update_option('cqs_imgdims', $C, false); }
    // Textos fuera de scripts: formulario de opiniones (es/ca) y meses (ca)
    $U = (in_array($l, ['es', 'ca'], true) ? cqs_audit_ui()[$l] : []) + (cqs_audit_xmap()[$l] ?? []);
    if ($U) {
        $h = preg_replace_callback('#(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<textarea\b[^>]*>.*?</textarea>)|>([^<>]+)(?=<)|\b(placeholder|aria-label|title|data-label)="([^"]*)"|(<(?:input|button)\b[^>]*\bvalue=")([^"]*)"#is', function ($m) use ($U, $l) {
            if (!empty($m[1])) return $m[0];
            if (!empty($m[3])) { $v = html_entity_decode($m[4], ENT_QUOTES, 'UTF-8'); return isset($U[$v]) ? $m[3].'="'.esc_attr($U[$v]).'"' : $m[0]; }
            if (!empty($m[5])) { $v = html_entity_decode($m[6], ENT_QUOTES, 'UTF-8'); return isset($U[$v]) ? $m[5].esc_attr($U[$v]).'"' : $m[0]; }
            if (!isset($m[2]) || $m[2] === '') return $m[0];
            $raw = $m[2]; $t = trim(html_entity_decode($raw, ENT_QUOTES, 'UTF-8'), " \t\n\r\0\x0B\xC2\xA0");
            if ($t === '') return $m[0];
            if (isset($U[$t])) return '>'.str_replace($t, esc_html($U[$t]), html_entity_decode($raw, ENT_QUOTES, 'UTF-8'));
            if ($l === 'ca' && preg_match('/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/', $raw)) return '>'.cqs_audit_months($raw, 'ca');
            return $m[0];
        }, $h) ?? $h;
    }
    if (in_array($l, ['es', 'ca'], true)) {
        $U = cqs_audit_ui()[$l];
        // Textos de validación del formulario (van en un script)
        $h = preg_replace_callback('#GLSR\.validation_strings=\{.*?\};#s', function ($m) use ($U) { $s = $m[0]; foreach ($U as $a => $b) $s = str_replace('"'.$a.'"', '"'.addslashes($b).'"', $s); return $s; }, $h);
        $h = str_replace('GLSR.text={"close_modal":"Close Modal"}', 'GLSR.text={"close_modal":"'.$U['Close Modal'].'"}', $h);
    }
    // Pie: correo de contacto
    return $h;
}
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST) || is_feed()) return;
    ob_start('cqs_audit_ob');
}, 1);

/* Francés: idioma, títulos, datos estructurados y canonical (se ejecuta antes del traductor de cq/site.php) */
function cqs_audit_fr_desc($id) {
    $D = function_exists('cqs_fr_ui') ? cqs_fr_ui()['d'] : [];
    $name = html_entity_decode(get_the_title($id), ENT_QUOTES, 'UTF-8'); $cat = '';
    $terms = get_the_terms($id, 'at_biz_dir-category');
    if ($terms && !is_wp_error($terms)) {
        usort($terms, fn($a, $b) => (int)($b->parent > 0) - (int)($a->parent > 0)); $t = $terms[0];
        if ($t->slug !== 'otras-actividades') { $map = function_exists('ssi_dir_cat_names') ? ssi_dir_cat_names() : []; $en = $map[$t->slug][1] ?? ''; $cat = $D[$en] ?? ''; }
    }
    $head = $name.' : '.($cat !== '' ? mb_strtolower(mb_substr($cat, 0, 1)).mb_substr($cat, 1).' ' : '').'à Cadaqués.';
    $tail = 'Adresse, horaires, téléphone et itinéraire.';
    $body = trim((string)get_post_meta($id, '_ssi_content_fr', true));
    $body = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags(html_entity_decode($body, ENT_QUOTES, 'UTF-8'))));
    if ($body !== '') {
        $first = trim(preg_split('/(?<=[.!?])\s+/u', $body)[0]); if (!preg_match('/[.!?…]$/u', $first)) $first .= '.';
        foreach ([$head.' '.$first.' '.$tail, $head.' '.$first] as $c) if (mb_strlen($c) <= 160) return $c;
        return mb_substr($head.' '.$first, 0, 157).'…';
    }
    return $head.' '.$tail;
}
function cqs_audit_fr_head($h) {
    if (stripos($h, '<html') === false) return $h;
    $h = preg_replace('#<html lang="en-GB"#', '<html lang="fr-FR"', $h, 1);
    // Eventos: título y texto en francés (_ssi_title_fr / _ssi_content_fr en lugar del inglés)
    $xr = function_exists('ssi_xl_request') ? ssi_xl_request() : false;
    $ev = ($xr && $xr['type'] === 'tribe_events') ? get_page_by_path($xr['slug'], OBJECT, 'tribe_events') : null;
    if ($ev) {
        $id = (int)$ev->ID;
        foreach (['content', 'title'] as $f) {
            $en = trim((string)get_post_meta($id, '_ssi_'.$f.'_en', true)); $fr = trim((string)get_post_meta($id, '_ssi_'.$f.'_fr', true));
            if ($en === '' || $fr === '') continue;
            if ($f === 'content') { // párrafo a párrafo (wpautop añade saltos de línea entre ellos)
                preg_match_all('#<p>(.*?)</p>#s', $en, $pe); preg_match_all('#<p>(.*?)</p>#s', $fr, $pf);
                foreach ($pe[1] as $i => $pp) if (isset($pf[1][$i])) foreach (array_unique([$pp, wptexturize($pp)]) as $v) $h = str_replace('<p>'.$v.'</p>', '<p>'.$pf[1][$i].'</p>', $h);
                continue;
            }
            foreach (array_unique([$en, wptexturize($en), esc_html($en), esc_html(wptexturize($en))]) as $v) $h = str_replace($v, $v !== $en ? esc_html($fr) : $fr, $h);
        }
    }
    $h = str_replace(['"inLanguage":"en"', 'og:locale" content="en_GB"'], ['"inLanguage":"fr-FR"', 'og:locale" content="fr_FR"'], $h);
    // Las líneas hreflang se protegen: la de en-GB debe seguir apuntando a /en/
    $keep = [];
    $h = preg_replace_callback('#<link rel="alternate" hreflang="[^"]+" href="[^"]*"\s*/?>#', function ($m) use (&$keep) { $k = '<!--cqhl'.count($keep).'-->'; $keep[$k] = $m[0]; return $k; }, $h);
    if (function_exists('ssi_xl_request') && ($x = ssi_xl_request()) && !empty($x['fr'])) {
        $root = untrailingslashit(home_url());
        $h = preg_replace_callback('#(<link rel="canonical" href="|og:url" content=")'.preg_quote($root, '#').'/en/#', fn($m) => $m[1].$root.'/fr/', $h);
    }
    // Paginación del directorio en francés (/fr/annuaire/page/N/): hreflang a la misma página en cada idioma
    if (!$keep && is_page() && ($pg = (int)get_query_var('paged')) > 1 && function_exists('pll_get_post')) {
        $id = get_queried_object_id(); $add = '';
        foreach (['es' => 'es-ES', 'ca' => 'ca', 'en' => 'en-GB', 'fr' => 'fr-FR'] as $L => $hl) { $t = pll_get_post($id, $L); if ($t) $add .= '<link rel="alternate" hreflang="'.$hl.'" href="'.esc_url(trailingslashit(get_permalink($t)).'page/'.$pg.'/').'">'."\n"; }
        $te = pll_get_post($id, 'es'); if ($te) $add .= '<link rel="alternate" hreflang="x-default" href="'.esc_url(trailingslashit(get_permalink($te)).'page/'.$pg.'/').'">'."\n";
        $self = trailingslashit(get_permalink($id)).'page/'.$pg.'/';
        $h = preg_replace('#<link rel="canonical" href="[^"]*"#', '<link rel="canonical" href="'.esc_url($self).'"', $h, 1);
        if ($add) $h = preg_replace('#</head>#', $add.'</head>', $h, 1);
    }
    $h = strtr($h, $keep);
    // Fichas: meta descripción entera en francés
    if ($xr && $xr['type'] === 'at_biz_dir' && preg_match('#<meta name="description" content="([^"]*)"#', $h, $dm) && ($lp = get_page_by_path($xr['slug'], OBJECT, 'at_biz_dir'))) {
        $nd = cqs_audit_fr_desc($lp->ID);
        if ($nd !== '') $h = str_replace('content="'.$dm[1].'"', 'content="'.esc_attr($nd).'"', $h);
    }
    // Meses y días de la semana en inglés (fichas y eventos)
    $h = preg_replace_callback('#(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>)|>([^<>]*\d[^<>]*|[^<>]*\b(?:All day|All Day)\b[^<>]*)(?=<)#is', fn($m) => !empty($m[1]) ? $m[0] : '>'.cqs_audit_months($m[2], 'fr'), $h) ?? $h;
    return $h;
}
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST) || !function_exists('cqs_cur_lang') || cqs_cur_lang() !== 'fr') return;
    ob_start('cqs_audit_fr_head');
}, 0);

/* Pie: correo de contacto público */
add_action('kadence_footer', function () {
    echo '<p class="cqs-contact">'.esc_html(['es' => 'Contacto', 'ca' => 'Contacte', 'en' => 'Contact', 'fr' => 'Contact'][function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es'] ?? 'Contacto').((function_exists('cqs_cur_lang') && cqs_cur_lang() === 'fr') ? ' : ' : ': ').'<a href="mailto:info@cadaques.si">info@cadaques.si</a></p>';
}, 12);

/* ---------- 6. Tareas de una vez: menú, privacidad, eventos, duplicados, fuentes ---------- */
function cqs_audit_once() {
    $rep = [];
    // Menú: Transporte sale del menú principal (queda dentro de Info práctica, que ya enlaza «Cómo llegar y moverse»)
    $tp = get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => '^transport:', 'compare' => 'REGEXP']]]);
    $o = get_option('polylang'); $menus = (array)($o['nav_menus'][get_stylesheet()]['primary'] ?? []);
    $del = 0;
    foreach ($menus as $mid) foreach ((array)wp_get_nav_menu_items($mid) as $it) if ($it->object === 'page' && in_array((int)$it->object_id, array_map('intval', $tp), true)) { wp_delete_post($it->ID, true); $del++; }
    $rep['menu_transport_quitado'] = $del;

    // Privacidad en inglés: /en/privacy-policy/ en vez de /en/privacy-policy-2/
    $en = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'numberposts' => 1, 'lang' => '', 'suppress_filters' => true, 'meta_query' => [['key' => '_cqs_key', 'value' => 'privacy:en']]]);
    if ($en && $en[0]->post_name !== 'privacy-policy') {
        $old = get_posts(['post_type' => 'page', 'post_status' => ['draft', 'publish', 'private', 'pending'], 'name' => 'privacy-policy', 'numberposts' => 5, 'lang' => '', 'suppress_filters' => true]);
        foreach ($old as $p) if ((int)$p->ID !== (int)$en[0]->ID && !get_post_meta($p->ID, '_cqs_key', true)) { wp_trash_post($p->ID); $rep['privacy_trash'][] = $p->ID; }
        $r = wp_update_post(['ID' => $en[0]->ID, 'post_name' => 'privacy-policy'], true);
        $rep['privacy_slug'] = is_wp_error($r) ? $r->get_error_message() : get_post_field('post_name', $en[0]->ID);
    } else $rep['privacy_slug'] = $en ? 'ya estaba' : 'sin página';

    // Agenda: estado de cada evento, lugar exacto y organizador; sin horas que no son seguras
    $E = [
      'fm-hivern-2026' => ['allday' => true, 's' => '2026-12-18', 'e' => '2026-12-20', 'venue' => ['Venue' => 'Cadaqués (calles y plazas del pueblo)', 'City' => 'Cadaqués'], 'org' => 'Ajuntament de Cadaqués',
        'c' => ['es' => '<p><strong>Estado: confirmado</strong> (18–20 de diciembre de 2026). El Ayuntamiento publicará el programa con horarios.</p><p>La fiesta mayor de invierno, en honor a Santa Esperança: misa, sardanas, conciertos y baile en el pueblo.</p><p>Organiza: Ajuntament de Cadaqués.</p>',
                'ca' => '<p><strong>Estat: confirmat</strong> (18–20 de desembre de 2026). L’Ajuntament publicarà el programa amb horaris.</p><p>La festa major d’hivern, en honor de Santa Esperança: missa, sardanes, concerts i ball al poble.</p><p>Organitza: Ajuntament de Cadaqués.</p>',
                'en' => '<p><strong>Status: confirmed</strong> (18–20 December 2026). The Town Hall will publish the programme with times.</p><p>The winter festival in honour of Santa Esperança: mass, sardanas, concerts and dancing in the village.</p><p>Organised by: Ajuntament de Cadaqués.</p>',
                'fr' => '<p><strong>Statut : confirmé</strong> (18–20 décembre 2026). La mairie publiera le programme avec les horaires.</p><p>La fête d’hiver en l’honneur de Santa Esperança : messe, sardanes, concerts et bal au village.</p><p>Organisé par : Ajuntament de Cadaqués.</p>'],
        't' => ['fr' => 'Fête d’hiver de Cadaqués (Festa Major d’Hivern)']],
      'primer-sol-2027' => ['allday' => true, 's' => '2027-01-01', 'e' => '2027-01-01', 'venue' => ['Venue' => 'Far del Cap de Creus', 'City' => 'Cadaqués'], 'org' => '',
        'c' => ['es' => '<p><strong>Estado: tradición anual</strong>, sin organizador. Es una costumbre popular, no un acto programado.</p><p>Lugar: faro del Cap de Creus. Hora: al amanecer, hacia las 8:15.</p><p>Cada 1 de enero mucha gente sube al faro del Cap de Creus para ver salir el primer sol de la península. Ve con tiempo y abrígate. El acceso en coche al cabo puede estar limitado: consulta la web del Parc Natural.</p>',
                'ca' => '<p><strong>Estat: tradició anual</strong>, sense organitzador. És un costum popular, no un acte programat.</p><p>Lloc: far del Cap de Creus. Hora: a la sortida del sol, cap a les 8.15.</p><p>Cada 1 de gener molta gent puja al far del Cap de Creus per veure sortir el primer sol de la península. Ves-hi amb temps i abriga’t. L’accés amb cotxe al cap pot estar limitat: consulta el web del Parc Natural.</p>',
                'en' => '<p><strong>Status: annual tradition</strong>, with no organiser. It is a popular custom, not a scheduled event.</p><p>Place: Cap de Creus lighthouse. Time: at sunrise, around 8:15.</p><p>Every 1 January many people head to the Cap de Creus lighthouse to watch the first sunrise on the Iberian Peninsula. Go early and wrap up warm. Car access to the cape may be restricted: check the Natural Park website.</p>',
                'fr' => '<p><strong>Statut : tradition annuelle</strong>, sans organisateur. C’est une coutume populaire, pas un événement programmé.</p><p>Lieu : phare du Cap de Creus. Heure : au lever du soleil, vers 8 h 15.</p><p>Chaque 1er janvier, beaucoup de gens montent au phare du Cap de Creus pour voir le premier lever de soleil de la péninsule. Partez tôt et couvrez-vous bien. L’accès en voiture au cap peut être limité : consultez le site du Parc naturel.</p>'],
        't' => ['fr' => 'Premier lever de soleil de l’année au Cap de Creus']],
      'reis-2027' => ['allday' => true, 's' => '2027-01-05', 'e' => '2027-01-05', 'venue' => ['Venue' => 'Cadaqués (recorrido por el pueblo)', 'City' => 'Cadaqués'], 'org' => 'Ajuntament de Cadaqués',
        'c' => ['es' => '<p><strong>Estado: tradición anual</strong>; hora y recorrido pendientes de confirmar por el Ayuntamiento.</p><p>Los Reyes Magos llegan a Cadaqués la tarde del 5 de enero.</p><p>Organiza: Ajuntament de Cadaqués.</p>',
                'ca' => '<p><strong>Estat: tradició anual</strong>; hora i recorregut pendents de confirmar per l’Ajuntament.</p><p>Els Reis d’Orient arriben a Cadaqués la tarda del 5 de gener.</p><p>Organitza: Ajuntament de Cadaqués.</p>',
                'en' => '<p><strong>Status: annual tradition</strong>; time and route still to be confirmed by the Town Hall.</p><p>The Three Kings arrive in Cadaqués on the evening of 5 January.</p><p>Organised by: Ajuntament de Cadaqués.</p>',
                'fr' => '<p><strong>Statut : tradition annuelle</strong> ; heure et parcours à confirmer par la mairie.</p><p>Les Rois mages arrivent à Cadaqués le soir du 5 janvier.</p><p>Organisé par : Ajuntament de Cadaqués.</p>'],
        't' => ['fr' => 'Cavalcade des Rois mages']],
    ];
    foreach ($E as $k => $e) {
        $x = get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $k, 'suppress_filters' => true, 'lang' => '']);
        if (!$x) { $rep['eventos'][$k] = 'no está'; continue; }
        $id = (int)$x[0];
        $args = ['post_content' => $e['c']['es'], 'EventAllDay' => 'yes', 'EventStartDate' => $e['s'], 'EventEndDate' => $e['e'], 'EventTimezone' => 'Europe/Madrid', 'Venue' => $e['venue'] + ['Country' => 'Spain', 'Province' => 'Girona', 'Zip' => '17488']];
        if ($e['org']) $args['Organizer'] = ['Organizer' => $e['org'], 'Website' => 'https://www.cadaques.cat/'];
        $r = function_exists('tribe_update_event') ? tribe_update_event($id, $args) : wp_update_post(['ID' => $id, 'post_content' => $e['c']['es']]);
        foreach (['ca', 'en', 'fr'] as $L) update_post_meta($id, '_ssi_content_'.$L, $e['c'][$L]);
        update_post_meta($id, '_ssi_title_fr', $e['t']['fr']);
        update_post_meta($id, '_cqs_status', ['fm-hivern-2026' => 'confirmado', 'primer-sol-2027' => 'tradicion', 'reis-2027' => 'pendiente'][$k]);
        $rep['eventos'][$k] = $r ? 'ok' : 'error';
    }

    $rep['duplicados'] = cqs_audit_dedupe();

    // Fuentes que daban 404 (uploads/fonts/*-latin.woff2): se descargan de Google Fonts
    $up = wp_upload_dir(); $dir = trailingslashit($up['basedir']).'fonts/'; wp_mkdir_p($dir);
    foreach (['figtree-latin.woff2' => 'Figtree:wght@400..700', 'bricolage-grotesque-latin.woff2' => 'Bricolage+Grotesque:wght@600..700'] as $f => $fam) {
        if (file_exists($dir.$f) && filesize($dir.$f) > 1000) { $rep['fuentes'][$f] = 'ya estaba'; continue; }
        $css = wp_remote_get('https://fonts.googleapis.com/css2?family='.$fam.'&display=swap', ['timeout' => 20, 'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36']);
        $body = is_wp_error($css) ? '' : wp_remote_retrieve_body($css);
        if (preg_match('#/\*\s*latin\s*\*/\s*@font-face\s*\{[^}]*?url\((https://[^)]+\.woff2)\)#s', $body, $m)) {
            $r = wp_remote_get($m[1], ['timeout' => 30]);
            if (!is_wp_error($r) && wp_remote_retrieve_response_code($r) === 200) { file_put_contents($dir.$f, wp_remote_retrieve_body($r)); $rep['fuentes'][$f] = filesize($dir.$f).' bytes'; }
            else $rep['fuentes'][$f] = 'error descarga';
        } else $rep['fuentes'][$f] = 'sin css: '.(is_wp_error($css) ? $css->get_error_message() : wp_remote_retrieve_response_code($css));
    }
    flush_rewrite_rules(false);
    return $rep;
}
/* Agenda (2.ª vuelta): lugar exacto y organizador en cada evento, también en el JSON-LD */
add_action('wp_loaded', function () {
    if (get_option('cqs_ev2') === 'e1' || !function_exists('cqs_out')) return;
    update_option('cqs_ev2', 'e1', false);
    $E = [
      'fm-hivern-2026' => ['loc' => ['name' => 'Església de Santa Maria de Cadaqués y otros espacios del pueblo'], 'org' => 'Ajuntament de Cadaqués',
        'p' => ['es' => '<p>Lugar: el oficio solemne de la Mare de Déu de l’Esperança, en la Església de Santa Maria; los demás actos, en distintos espacios del pueblo que indicará el programa.</p>',
                'ca' => '<p>Lloc: l’ofici solemne de la Mare de Déu de l’Esperança, a l’Església de Santa Maria; la resta d’actes, en diferents espais del poble que indicarà el programa.</p>',
                'en' => '<p>Place: the solemn mass of Our Lady of Hope at the Church of Santa Maria; the other events at various spots in the village, as set out in the programme.</p>',
                'fr' => '<p>Lieu : la grand-messe de Notre-Dame de l’Espérance à l’église Santa Maria ; les autres activités dans différents lieux du village indiqués dans le programme.</p>']],
      'primer-sol-2027' => ['loc' => ['name' => 'Far del Cap de Creus', 'lat' => 42.3189, 'lng' => 3.3158], 'org' => '', 'p' => []],
      'reis-2027' => ['loc' => ['name' => 'Cadaqués (recorrido por el centro del pueblo, pendiente de confirmar)'], 'org' => 'Ajuntament de Cadaqués', 'p' => []],
    ];
    $rep = [];
    foreach ($E as $k => $e) {
        $x = get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $k, 'suppress_filters' => true, 'lang' => '']);
        if (!$x) { $rep[$k] = 'no está'; continue; } $id = (int)$x[0];
        update_post_meta($id, '_cqs_loc', $e['loc']); if ($e['org'] !== '') update_post_meta($id, '_cqs_org', $e['org']);
        if (function_exists('tribe_create_venue')) { $vid = tribe_create_venue(['Venue' => $e['loc']['name'], 'City' => 'Cadaqués', 'Country' => 'Spain', 'Province' => 'Girona', 'Zip' => '17488']); if ($vid) update_post_meta($id, '_EventVenueID', $vid); }
        if ($e['org'] !== '' && function_exists('tribe_create_organizer')) { $oid = tribe_create_organizer(['Organizer' => $e['org'], 'Website' => 'https://www.cadaques.cat/']); if ($oid) update_post_meta($id, '_EventOrganizerID', $oid); }
        foreach ($e['p'] as $L => $par) {
            if ($L === 'es') { $c = (string)get_post_field('post_content', $id); if (strpos($c, 'Lugar:') === false) wp_update_post(['ID' => $id, 'post_content' => preg_replace('#(</p>)#', '$1'.$par, $c, 1)]); continue; }
            $c = (string)get_post_meta($id, '_ssi_content_'.$L, true); if ($c !== '' && strpos($c, wp_strip_all_tags(mb_substr($par, 3, 10))) === false) update_post_meta($id, '_ssi_content_'.$L, preg_replace('#(</p>)#', '$1'.$par, $c, 1));
        }
        $rep[$k] = 'ok';
    }
    cqs_out('audit-ev2.json', $rep);
}, 71);
/* Tercera vuelta: textos de las calas (Cala Nans y francés), nombre francés de la Casa-Museu Dalí, índice A–Z sin fichas «-2» */
function cqs_audit_beaches_fr() {
    return ['platja-gran' => 'La plage du village, de galets, face au front de mer.', 'es-poal' => 'Petite plage à côté de la Platja Gran, entre les maisons de pêcheurs.',
            'es-llane' => 'Crique au sud du village, aux eaux claires, à quelques minutes à pied.', 'sa-conca' => 'Crique abritée sur le chemin de Portlligat, idéale pour nager.',
            'portlligat' => 'La baie de Dalí, avec des barques de pêche et la maison-musée au fond.', 'cala-nans' => 'Près du phare de Cala Nans, par le sentier côtier (1 h – 1 h 15).',
            'cala-guillola' => 'Dans le parc naturel du Cap de Creus, fond de sable et eau transparente.', 'cala-culip' => 'Crique du Cap de Creus, idéale pour le snorkeling.'];
}
add_action('wp_loaded', function () {
    if (get_option('cqs_x3') === 'x1' || !function_exists('cqs_out')) return;
    update_option('cqs_x3', 'x1', false);
    $rep = [];
    foreach (cqs_audit_beaches_fr() as $k => $fr) {
        $x = get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true, 'lang' => '', 'meta_key' => '_ssi_source', 'meta_value' => 'cqs:platja:'.$k]);
        if (!$x) { $rep[$k] = 'no está'; continue; } $id = (int)$x[0];
        update_post_meta($id, '_ssi_content_fr', '<p>'.$fr.'</p>');
        if ($k === 'cala-nans') {
            wp_update_post(['ID' => $id, 'post_content' => '<p>Junto al faro de Cala Nans, por el camino de ronda (1 h – 1 h 15).</p>']);
            update_post_meta($id, '_ssi_content_ca', '<p>Al costat del far de Cala Nans, pel camí de ronda (1 h – 1 h 15).</p>');
            update_post_meta($id, '_ssi_content_en', '<p>By Cala Nans lighthouse, along the coastal path (1 hr – 1 hr 15).</p>');
        }
        $rep[$k] = $id;
    }
    global $wpdb;
    foreach ($wpdb->get_results("SELECT p.ID, p.post_title, m.meta_value AS en FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id=p.ID AND m.meta_key='_ssi_title_en' WHERE p.post_type='at_biz_dir' AND p.post_status='publish' AND m.meta_value<>'' AND m.meta_value<>p.post_title") as $r) {
        if (trim((string)get_post_meta($r->ID, '_ssi_title_fr', true)) !== '') continue;
        $fr = function_exists('cqs_fr_ui') ? (cqs_fr_ui()['d'][$r->en] ?? '') : '';
        if (stripos($r->en, 'House-Museum Salvador Dal') !== false || stripos($r->en, 'Salvador Dalí House-Museum') !== false) $fr = 'Maison-musée Salvador Dalí';
        if ($fr !== '') update_post_meta($r->ID, '_ssi_title_fr', $fr);
        $rep['titulos_en'][] = $r->post_title.' | '.$r->en.' → '.($fr ?: '(sin cambio)');
    }
    foreach (['es', 'ca', 'en', 'fr'] as $L) delete_transient('cqs_idx_'.$L.'_'.CQS_BUILD_VER);
    if (function_exists('litespeed_purge_all')) litespeed_purge_all(); else do_action('litespeed_purge_all');
    cqs_out('audit-x3.json', $rep);
}, 72);
/* Fichas duplicadas: se repite tras cada montaje (el montaje recupera fichas de la papelera) */
function cqs_audit_dedupe() {
    // Fichas duplicadas (La Gritta, Sa Botiga, Galeria Cadaqués): se queda la más completa; las otras a la papelera con redirección
    global $wpdb;
    $norm = fn($t) => preg_replace('/[^a-z0-9]+/', '', strtolower(remove_accents(html_entity_decode($t, ENT_QUOTES, 'UTF-8'))));
    $rows = $wpdb->get_results("SELECT ID, post_title, post_name FROM {$wpdb->posts} WHERE post_type='at_biz_dir' AND post_status='publish' AND (post_title LIKE '%Gritta%' OR post_title LIKE '%Botiga%' OR post_title LIKE '%Galer%Cadaqu%')");
    $grp = [];
    foreach ($rows as $r) { $n = $norm($r->post_title); if (preg_match('/gritta|^sabotiga$|^galeriacadaques$/', $n)) $grp[preg_match('/gritta/', $n) ? 'gritta' : $n][] = $r; }
    $map = (array)get_option('cqs_dup_map', []); $blk = (array)get_option('cqs_dup_keys', []); $rep = [];
    foreach ($grp as $g => $list) {
        $info = [];
        foreach ($list as $r) {
            $m = fn($k) => trim((string)get_post_meta($r->ID, $k, true));
            $score = strlen($m('_phone')) > 3 ? 3 : 0; $score += $m('_website') ? 3 : 0; $score += $m('_email') ? 1 : 0; $score += (get_post_thumbnail_id($r->ID) || $m('_listing_prv_img')) ? 2 : 0;
            $score += min(3, (int)(strlen(wp_strip_all_tags((string)get_post_field('post_content', $r->ID))) / 150)); $score += (int)get_comments_number($r->ID) * 5;
            $info[] = ['id' => (int)$r->ID, 't' => $r->post_title, 'slug' => $r->post_name, 'lat' => (float)$m('_manual_lat'), 'lng' => (float)$m('_manual_lng'), 'tel' => preg_replace('/\D/', '', $m('_phone')), 'web' => preg_replace('#^https?://(www\.)?|/$#', '', $m('_website')), 'addr' => $m('_address'), 'score' => $score];
        }
        usort($info, fn($a, $b) => $b['score'] <=> $a['score'] ?: (int)preg_match('/-\d+$/', $a['slug']) <=> (int)preg_match('/-\d+$/', $b['slug']) ?: $a['id'] <=> $b['id']);
        $keep = array_shift($info); $done = [];
        foreach ($info as $d) {
            $near = $keep['lat'] && $d['lat'] && abs($keep['lat'] - $d['lat']) < 0.0008 && abs($keep['lng'] - $d['lng']) < 0.001;
            $same = $near || ($d['tel'] && $d['tel'] === $keep['tel']) || ($d['web'] && $d['web'] === $keep['web']) || ($d['addr'] && $norm($d['addr']) === $norm($keep['addr']));
            if (!$same) { $done[] = ['id' => $d['id'], 'accion' => 'se mantiene (otro lugar)', 'addr' => $d['addr']]; continue; }
            $src = (string)get_post_meta($d['id'], '_ssi_source', true); if ($src !== '') $blk[$src] = 1; // el montaje no la vuelve a sacar de la papelera
            wp_trash_post($d['id']); $map[$d['slug']] = $keep['id'];
            // La que queda se queda con la dirección sin «-2»
            if (preg_match('/^(.+)-\d+$/', $keep['slug'], $mm) && $mm[1] === preg_replace('/__trashed$/', '', $d['slug'])) {
                $r = wp_update_post(['ID' => $keep['id'], 'post_name' => $mm[1]], true);
                if (!is_wp_error($r)) { $map[$keep['slug']] = $keep['id']; $keep['slug'] = get_post_field('post_name', $keep['id']); }
            }
            $done[] = ['id' => $d['id'], 'accion' => 'papelera → '.$keep['id'], 'addr' => $d['addr']];
        }
        $rep[$g] = ['queda' => $keep, 'otras' => $done];
    }
    foreach ($map as $sl => $kid) if (get_post_status($kid) === 'publish' && get_post_field('post_name', $kid) === $sl) unset($map[$sl]);
    update_option('cqs_dup_map', $map, false); update_option('cqs_dup_keys', $blk, false);
    foreach (['es', 'ca', 'en', 'fr'] as $L) delete_transient('cqs_idx_'.$L.'_'.CQS_BUILD_VER);
    return $rep;
}
add_action('wp_loaded', function () {
    if (!defined('CQS_BUILD_VER') || get_option('cqs_dedupe') === CQS_BUILD_VER.'d2' || get_transient('cqs_dedupe_lock') || !function_exists('cqs_out')) return;
    if (get_option('cqs_build') !== CQS_BUILD_VER) { // en pleno montaje: en cuanto ha pasado el paso de fichas
        $bl = json_decode((string)@file_get_contents(SSI_DIR.'out/build-log.json'), true);
        if (!is_array($bl) || ($bl['ver'] ?? '') !== CQS_BUILD_VER || !isset($bl['t_fichas'])) return;
    }
    set_transient('cqs_dedupe_lock', 1, 300); update_option('cqs_dedupe', CQS_BUILD_VER.'d2', false);
    try { $r = cqs_audit_dedupe(); } catch (Throwable $e) { $r = ['error' => $e->getMessage().' @'.$e->getLine()]; }
    cqs_out('audit-dedupe.json', $r);
}, 69);
add_action('wp_loaded', function () {
    if (get_option('cqs_audit_once') === 'o1' || get_transient('cqs_audit_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_audit_lock', 1, 300);
    update_option('cqs_audit_once', 'o1', false);
    try { $rep = cqs_audit_once(); } catch (Throwable $e) { $rep = ['error' => $e->getMessage().' @'.$e->getLine()]; }
    cqs_out('audit-once.json', $rep);
}, 70);

/* ---------- 7. Comprobación desde fuera (out/audit-*.html y out/audit-check.json), una vez por versión ---------- */
add_action('wp_loaded', function () {
    $v = 'c10'; if (get_option('cqs_audit_once') !== 'o1' || get_option('cqs_x4') !== 'x2' || get_option('cqs_audit_check') === $v || get_transient('cqs_audit_lock') || get_transient('cqs_audit_clock') || !function_exists('cqs_out')) return;
    set_transient('cqs_audit_clock', 1, 600);
    $U = [];
    $s = get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'tax_query' => [['taxonomy' => 'at_biz_dir-category', 'field' => 'slug', 'terms' => ['apartamentos-turisticos', 'hoteles', 'dormir'], 'include_children' => true]]]);
    if ($s) { foreach (['es', 'ca', 'en', 'fr'] as $L) $U['sleep-'.$L] = ssi_xl_permalink($s[0], $L); }
    $ev = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => 'primer-sol-2027', 'suppress_filters' => true, 'lang' => '']);
    if ($ev) { $U['event-fr'] = ssi_xl_permalink($ev[0], 'fr'); $U['event-ca'] = ssi_xl_permalink($ev[0], 'ca'); }
    $U['home-en'] = home_url('/en/'); $U['calanans-fr'] = home_url('/fr/directory/cala-nans/'); $U['add-es'] = function_exists('ssi_link') ? ssi_link('add', 'es') : '';
    $U['repsol-fr'] = home_url('/fr/directory/repsol/'); $U['notaria-es'] = home_url('/directory/notaria-de-cadaques-maria-del-carmen-rusinol-riba/'); $U['visit-ca'] = home_url('/ca/que-visitar/');
    $U['fm-en'] = ($fm = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => 'fm-hivern-2026', 'suppress_filters' => true, 'lang' => ''])) ? ssi_xl_permalink($fm[0], 'en') : '';
    $dir = function_exists('ssi_link') ? ssi_link('directory', 'fr') : ''; if ($dir) $U['dir-fr-p2'] = trailingslashit($dir).'page/2/';
    $U['dir-es'] = function_exists('ssi_link') ? ssi_link('directory', 'es') : '';
    $U['home-es'] = home_url('/'); $U['collab-es'] = home_url('/colabora/'); $U['collab-fr'] = function_exists('ssi_link') ? ssi_link('collab', 'fr') : '';
    $out = [];
    foreach (array_filter($U) as $k => $u) {
        $r = wp_remote_get(add_query_arg('nocache', time(), $u), ['timeout' => 40, 'sslverify' => false]);
        if (is_wp_error($r)) { $out[$k] = $r->get_error_message(); continue; }
        @file_put_contents(SSI_DIR.'out/audit-'.$k.'.html', wp_remote_retrieve_body($r)); $out[$k] = [$u, wp_remote_retrieve_response_code($r)];
    }
    foreach (['/fr/directory/', '/en/privacy-policy-2/', '/en/privacy-policy/', '/wp-sitemap.xml', '/wp-sitemap-ssilistings-fr-1.xml', '/wp-content/uploads/fonts/figtree-latin.woff2', '/wp-content/uploads/fonts/bricolage-grotesque-latin.woff2', '/directory/la-gritta-2/', '/directory/sa-botiga-2/', '/directory/galeria-cadaques-2/', '/directory/la-gritta/', '/directory/sa-botiga/', '/directory/galeria-cadaques/', '/fr/directory/la-gritta-2/', '/wp-sitemap-ssievents-fr-1.xml'] as $p) {
        $r = wp_remote_get(home_url($p), ['timeout' => 30, 'sslverify' => false, 'redirection' => 0]);
        $out['head'][$p] = is_wp_error($r) ? $r->get_error_message() : wp_remote_retrieve_response_code($r).' '.wp_remote_retrieve_header($r, 'location').' '.strlen(wp_remote_retrieve_body($r));
    }
    if ($s) { $r = wp_remote_get(trailingslashit(get_permalink($s[0])).'feed/', ['timeout' => 30, 'sslverify' => false, 'redirection' => 0]); $out['head']['feed'] = is_wp_error($r) ? $r->get_error_message() : wp_remote_retrieve_response_code($r).' '.wp_remote_retrieve_header($r, 'location'); }
    $out['t'] = gmdate('c'); cqs_out('audit-check.json', $out);
    update_option('cqs_audit_check', $v, false);
}, 80);

/* Colabora como sitges.si y bloque «Esta guía la hacemos entre todos» con cuatro tarjetas (25/11/2026):
   crea el formulario «colabora» y vuelve a escribir las páginas desde data/pages.json, sin repetir todo el montaje */
add_action('wp_loaded', function () {
    if (get_option('cqs_x4') === 'x2' || !function_exists('cqs_step_forms') || !function_exists('cqs_step_pages') || get_transient('cqs_x4_lock')) return;
    if (get_option('cqs_build') !== CQS_BUILD_VER) return; // no pisa un montaje en marcha
    set_transient('cqs_x4_lock', 1, 300);
    if (!get_current_user_id()) wp_set_current_user(1);
    $rep = ['t' => gmdate('c')];
    try { $rep['forms'] = cqs_step_forms(); $rep['pages'] = cqs_step_pages(); update_option('cqs_x4', 'x2', false); }
    catch (Throwable $e) { $rep['error'] = $e->getMessage(); }
    wp_set_current_user(0);
    cqs_out('audit-x4.json', $rep);
    do_action('litespeed_purge_all');
}, 30);

/* Agenda (3.ª vuelta, 25/11/2026): tres estados claros (confirmado, tradición anual, pendiente de confirmar),
   la cabalgata pasa a «pendiente de confirmar» y se añade la fiesta de Sant Sebastià (20 de enero, tradición anual) */
add_action('wp_loaded', function () {
    if (get_option('cqs_ev3') === 'e1' || !function_exists('cqs_out') || !function_exists('tribe_create_event')) return;
    update_option('cqs_ev3', 'e1', false);
    $rep = [];
    $find = fn($k) => get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $k, 'suppress_filters' => true, 'lang' => '']);
    // Cabalgata de Reyes: pendiente de confirmar, sin hora
    $C = ['es' => '<p><strong>Estado: pendiente de confirmar.</strong> Es una tradición anual, pero el Ayuntamiento aún no ha publicado la hora ni el recorrido; no indicamos ninguna hora hasta que se confirme.</p><p>Los Reyes Magos llegan a Cadaqués la tarde del 5 de enero.</p><p>Lugar: recorrido por el centro del pueblo, pendiente de confirmar.</p><p>Organiza: Ajuntament de Cadaqués.</p>',
          'ca' => '<p><strong>Estat: pendent de confirmar.</strong> És una tradició anual, però l’Ajuntament encara no ha publicat l’hora ni el recorregut; no indiquem cap hora fins que es confirmi.</p><p>Els Reis d’Orient arriben a Cadaqués la tarda del 5 de gener.</p><p>Lloc: recorregut pel centre del poble, pendent de confirmar.</p><p>Organitza: Ajuntament de Cadaqués.</p>',
          'en' => '<p><strong>Status: to be confirmed.</strong> It is an annual tradition, but the Town Hall has not yet published the time or the route; we will not give a time until it is confirmed.</p><p>The Three Kings arrive in Cadaqués on the evening of 5 January.</p><p>Place: a route through the village centre, to be confirmed.</p><p>Organised by: Ajuntament de Cadaqués.</p>',
          'fr' => '<p><strong>Statut : à confirmer.</strong> C’est une tradition annuelle, mais la mairie n’a pas encore publié l’heure ni le parcours ; nous n’indiquons aucune heure avant confirmation.</p><p>Les Rois mages arrivent à Cadaqués le soir du 5 janvier.</p><p>Lieu : parcours dans le centre du village, à confirmer.</p><p>Organisé par : Ajuntament de Cadaqués.</p>'];
    if ($x = $find('reis-2027')) { $id = (int)$x[0]; wp_update_post(['ID' => $id, 'post_content' => $C['es']]); foreach (['ca', 'en', 'fr'] as $L) update_post_meta($id, '_ssi_content_'.$L, $C[$L]); update_post_meta($id, '_cqs_status', 'pendiente'); $rep['reis'] = $id; }
    // Sant Sebastià: aplec en la ermita, cada 20 de enero
    if (!$find('sant-sebastia-2027')) {
        $C = ['es' => '<p><strong>Estado: tradición anual</strong>, pendiente de programa. Se celebra cada 20 de enero; la hora de la misa se confirmará más cerca de la fecha.</p><p>Aplec en la ermita de Sant Sebastià, en la montaña del Pení: se sube a pie desde el pueblo, hay misa en honor al santo, sardanas y comida popular al aire libre. La ermita es privada y solo se abre este día.</p><p>Lugar: ermita de Sant Sebastià (Pení), Cadaqués.</p>',
              'ca' => '<p><strong>Estat: tradició anual</strong>, pendent de programa. Se celebra cada 20 de gener; l’hora de la missa es confirmarà més a prop de la data.</p><p>Aplec a l’ermita de Sant Sebastià, a la muntanya del Pení: s’hi puja a peu des del poble, hi ha missa en honor del sant, sardanes i dinar popular a l’aire lliure. L’ermita és privada i només s’obre aquest dia.</p><p>Lloc: ermita de Sant Sebastià (Pení), Cadaqués.</p>',
              'en' => '<p><strong>Status: annual tradition</strong>, programme to come. It takes place every 20 January; the time of the mass will be confirmed nearer the date.</p><p>A gathering at the hermitage of Sant Sebastià on Pení mountain: people walk up from the village for a mass in honour of the saint, sardanas and an open-air community lunch. The hermitage is private and only opens on this day.</p><p>Place: Sant Sebastià hermitage (Pení), Cadaqués.</p>',
              'fr' => '<p><strong>Statut : tradition annuelle</strong>, programme à venir. Elle a lieu chaque 20 janvier ; l’heure de la messe sera confirmée à l’approche de la date.</p><p>Rassemblement à l’ermitage de Sant Sebastià, sur le mont Pení : on y monte à pied depuis le village pour une messe en l’honneur du saint, des sardanes et un repas populaire en plein air. L’ermitage est privé et n’ouvre que ce jour-là.</p><p>Lieu : ermitage de Sant Sebastià (Pení), Cadaqués.</p>'];
        $id = tribe_create_event(['post_title' => 'Fiesta de Sant Sebastià', 'post_content' => $C['es'], 'post_status' => 'publish', 'EventStartDate' => '2027-01-20', 'EventEndDate' => '2027-01-20', 'EventAllDay' => 'yes', 'EventTimezone' => 'Europe/Madrid',
            'Venue' => ['Venue' => 'Ermita de Sant Sebastià (Pení)', 'City' => 'Cadaqués', 'Country' => 'Spain', 'Province' => 'Girona', 'Zip' => '17488']]);
        if ($id && !is_wp_error($id)) {
            update_post_meta($id, '_cqs_key', 'sant-sebastia-2027'); update_post_meta($id, '_cqs_status', 'tradicion');
            update_post_meta($id, '_cqs_loc', ['name' => 'Ermita de Sant Sebastià (Pení)']);
            foreach (['ca' => 'Festa de Sant Sebastià', 'en' => 'Sant Sebastià festival', 'fr' => 'Fête de Sant Sebastià'] as $L => $t) { update_post_meta($id, '_ssi_title_'.$L, $t); update_post_meta($id, '_ssi_content_'.$L, $C[$L]); }
            wp_set_object_terms($id, ['fiestas', 'cadaques'], 'tribe_events_cat');
            $rep['sant-sebastia'] = $id;
        } else $rep['sant-sebastia'] = 'error';
    }
    delete_option('cqs_agenda_last'); // relanza la importación automática con el nuevo formato
    cqs_out('audit-ev3.json', $rep);
    do_action('litespeed_purge_all');
}, 35);

/* Agenda de visitcadaques.org (25/11/2026, aprobado por Alex): copia del HTML de sus meses para preparar la importación semanal */
add_action('wp_loaded', function () {
    $v = 'g1'; if (get_option('cqs_ag_raw') === $v || get_transient('cqs_ag_raw_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_ag_raw_lock', 1, 600); @set_time_limit(200);
    $U = ['vc-2026-12' => 'https://visitcadaques.org/?ano=2026&lang=cat&mes=12&sec=agenda', 'vc-2027-01' => 'https://visitcadaques.org/?ano=2027&lang=cat&mes=1&sec=agenda',
          'vc-2026-01' => 'https://visitcadaques.org/?ano=2026&lang=cat&mes=1&sec=agenda'];
    $o = [];
    foreach ($U as $k => $u) {
        $r = wp_remote_get($u, ['timeout' => 25, 'redirection' => 5, 'user-agent' => 'Mozilla/5.0 (compatible; CadaquesSi/1.0; +https://cadaques.si)']);
        if (is_wp_error($r)) { $o[$k] = $r->get_error_message(); continue; }
        $b = wp_remote_retrieve_body($r); $o[$k] = [wp_remote_retrieve_response_code($r), strlen($b)];
        cqs_out('agraw-'.$k.'.html', $b);
    }
    cqs_out('agraw.json', $o); update_option('cqs_ag_raw', $v, false);
}, 70);

/* Copia rápida de páginas concretas (out/q-*.html), una vez por versión de la lista */
add_action('wp_loaded', function () {
    $v = 'q2'; if (get_option('cqs_snapq') === $v || get_transient('cqs_snapq_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_snapq_lock', 1, 300);
    $ev = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_src', 'meta_compare' => 'EXISTS', 'suppress_filters' => true, 'lang' => '', 'orderby' => 'ID', 'order' => 'DESC']);
    $Q = ['home-es' => '/'];
    if ($ev && function_exists('ssi_xl_permalink')) { $Q['ev-es'] = wp_make_link_relative(ssi_xl_permalink($ev[0], 'es')); $Q['ev-fr'] = wp_make_link_relative(ssi_xl_permalink($ev[0], 'fr')); }
    if ($fm = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => 'fm-hivern-2026', 'suppress_filters' => true, 'lang' => ''])) $Q['ev-fm'] = wp_make_link_relative(get_permalink($fm[0]));
    foreach ($Q as $k => $p) {
        $r = wp_remote_get(add_query_arg('nocache', time(), home_url($p)), ['timeout' => 40, 'sslverify' => false]);
        if (!is_wp_error($r)) @file_put_contents(SSI_DIR.'out/q-'.$k.'.html', wp_remote_retrieve_body($r));
    }
    update_option('cqs_snapq', $v, false);
}, 85);

/* Primera importación de visitcadaques.org ahora mismo (luego sigue sola cada 3 días) */
add_action('wp_loaded', function () {
    if (get_option('cqs_vc1') === 'v1' || !function_exists('cqs_vc_run') || get_transient('cqs_vc1_lock')) return;
    set_transient('cqs_vc1_lock', 1, 600); @set_time_limit(240);
    if (!get_current_user_id()) wp_set_current_user(1);
    $r = cqs_vc_run(); wp_set_current_user(0);
    if (empty($r['error'])) update_option('cqs_vc1', 'v1', false);
    do_action('litespeed_purge_all');
}, 90);

/* Tras importar la agenda oficial (25/11/2026): el Aplec del Sol Ixent y Sant Sebastià ya vienen de visitcadaques.org con hora, lugar y programa,
   así que las fichas hechas a mano se pasan a la papelera para no duplicar; la Festa Major d'Hivern remite a su programa ya publicado */
add_action('wp_loaded', function () {
    if (get_option('cqs_ev4') === 'e1' || get_option('cqs_vc1') !== 'v1' || !function_exists('cqs_out')) return;
    update_option('cqs_ev4', 'e1', false);
    $rep = [];
    $find = fn($k) => get_posts(['post_type' => 'tribe_events', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => $k, 'suppress_filters' => true, 'lang' => '']);
    foreach (['primer-sol-2027', 'sant-sebastia-2027'] as $k) if ($x = $find($k)) { wp_trash_post((int)$x[0]); $rep[$k] = 'papelera'; }
    if ($x = $find('fm-hivern-2026')) {
        $id = (int)$x[0];
        $C = ['es' => '<p><strong>Estado: confirmado</strong> (18–20 de diciembre de 2026). El programa ya está publicado: cada acto (oficio solemne, sardanas, baile, conciertos, quina, dinar popular…) aparece en la agenda con su hora y su lugar.</p><p>La fiesta mayor de invierno, en honor a Santa Esperança.</p><p>Organiza: Ajuntament de Cadaqués.</p>',
              'ca' => '<p><strong>Estat: confirmat</strong> (18–20 de desembre de 2026). El programa ja és publicat: cada acte (ofici solemne, sardanes, ball, concerts, quina, dinar popular…) surt a l’agenda amb la seva hora i el seu lloc.</p><p>La festa major d’hivern, en honor de Santa Esperança.</p><p>Organitza: Ajuntament de Cadaqués.</p>',
              'en' => '<p><strong>Status: confirmed</strong> (18–20 December 2026). The programme is out: each event (solemn mass, sardanas, dance, concerts, bingo, community lunch…) is listed in the calendar with its time and place.</p><p>The winter festival in honour of Santa Esperança.</p><p>Organised by: Ajuntament de Cadaqués.</p>',
              'fr' => '<p><strong>Statut : confirmé</strong> (18–20 décembre 2026). Le programme est publié : chaque activité (grand-messe, sardanes, bal, concerts, loto, repas populaire…) figure dans l’agenda avec son heure et son lieu.</p><p>La fête d’hiver en l’honneur de Santa Esperança.</p><p>Organisé par : Ajuntament de Cadaqués.</p>'];
        wp_update_post(['ID' => $id, 'post_content' => $C['es']]); foreach (['ca', 'en', 'fr'] as $L) update_post_meta($id, '_ssi_content_'.$L, $C[$L]);
        $rep['fm'] = $id;
    }
    cqs_out('audit-ev4.json', $rep);
    do_action('litespeed_purge_all');
}, 95);

/* ---------- Ronda 4 de la auditoría (25/11/2026) ---------- */
/* Direcciones de cada página por idioma (sacadas de data/pages.json una vez por versión) */
function cqs_r4_pages() {
    static $m = null; if ($m !== null) return $m;
    $v = CQS_BUILD_VER.'-'.@filemtime(SSI_DIR.'data/pages.json');
    $o = get_option('cqs_r4_pages');
    if (is_array($o) && ($o['_v'] ?? '') === $v) return $m = $o;
    $d = function_exists('cqs_json') ? cqs_json('pages.json') : json_decode((string)@file_get_contents(SSI_DIR.'data/pages.json'), true);
    $m = ['_v' => $v];
    foreach ((array)$d as $k => $by) foreach ((array)$by as $l => $p) $m[$k][$l] = $k === 'home' ? ($l === 'es' ? '/' : "/$l/") : ($l === 'es' ? '/'.$p['slug'].'/' : "/$l/".$p['slug'].'/');
    update_option('cqs_r4_pages', $m, false);
    return $m;
}
function cqs_r4_url($k, $l) { $m = cqs_r4_pages(); return home_url($m[$k][$l] ?? ($m[$k]['es'] ?? '/')); }

/* 5) Enlaces rotos: eventos pasados a la papelera, ?p= de eventos borrados y categorías de eventos → agenda del idioma */
add_action('template_redirect', function () {
    if (!is_404()) return;
    $p = trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $l = preg_match('#^(ca|en|fr)/#', $p, $lm) ? $lm[1] : 'es';
    $go = '';
    if (preg_match('#(?:^|/)events?/categori[ae]/#', $p)) $go = cqs_r4_url('agenda', $l);
    elseif (preg_match('#(?:^|/)event/([a-z0-9-]+)/?$#', $p, $m)) {
        $t = get_posts(['post_type' => 'tribe_events', 'post_status' => 'trash', 'numberposts' => 1, 'name' => $m[1].'__trashed', 'suppress_filters' => true, 'lang' => ''])
          ?: get_posts(['post_type' => 'tribe_events', 'post_status' => 'trash', 'numberposts' => 1, 'name' => $m[1], 'suppress_filters' => true, 'lang' => '']);
        $alt = ['fiesta-de-sant-sebastia' => 'sant-sebastia', 'primer-sol-del-ano-en-el-cap-de-creus' => 'xxxv-aplec-del-sol-ixent'];
        if (isset($alt[$m[1]]) && ($e = get_page_by_path($alt[$m[1]], OBJECT, 'tribe_events')) && $e->post_status === 'publish')
            $go = function_exists('ssi_xl_permalink') ? ssi_xl_permalink($e->ID, $l) : get_permalink($e);
        elseif ($t || isset($alt[$m[1]])) $go = cqs_r4_url('agenda', $l);
    } elseif (!empty($_GET['p']) && ($pp = get_post((int)$_GET['p'])) && $pp->post_type === 'tribe_events') $go = cqs_r4_url('agenda', $l);
    if ($go) { wp_safe_redirect($go, 301); exit; }
}, 1);

/* Último retoque del HTML (se ejecuta después de las traducciones) */
function cqs_r4_ob($h) {
    if (stripos($h, '<html') === false) return $h;
    $l = function_exists('cqs_cur_lang') ? cqs_cur_lang() : 'es';
    $root = untrailingslashit(home_url());
    // 3) Lugares de los eventos en el idioma de la página, también dentro de las listas («fecha · lugar»)
    if ($l !== 'es') { $x = cqs_audit_xmap()[$l] ?? []; foreach ($x as $a => $b) if (mb_strlen($a) > 20) $h = str_replace([$a, esc_html($a)], [$b, esc_html($b)], $h); }
    if ($l === 'fr') { $X = cqs_audit_xmap(); foreach ($X['fr'] as $a => $b) if (mb_strlen($a) > 20 && !empty($X['en'][$a])) $h = str_replace([$X['en'][$a], esc_html($X['en'][$a])], [$b, esc_html($b)], $h); } // en francés el núcleo da el nombre inglés
    // 5) Enlaces a categorías de eventos de TEC → agenda del idioma de la página
    $ag = cqs_r4_url('agenda', $l);
    $h = preg_replace('#href="(?:'.preg_quote($root, '#').')?/(?:(?:ca|en|fr)/)?events?/categor(?:ia|ie|y)/[^"]*"#', 'href="'.esc_url($ag).'"', $h) ?? $h;
    // 4) Eventos con el mismo título que otros (actos que se repiten): la fecha va en el título de la pestaña
    if (function_exists('ssi_xl_request') && ($xr = ssi_xl_request()) && $xr['type'] === 'tribe_events' && ($ev = get_page_by_path($xr['slug'], OBJECT, 'tribe_events'))) {
        global $wpdb;
        $n = (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='tribe_events' AND post_status='publish' AND post_title=%s", $ev->post_title));
        if ($n > 1 && ($sd = get_post_meta($ev->ID, '_EventStartDate', true))) {
            $ts = strtotime($sd);
            $MN = ['es' => ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                   'ca' => ['de gener', 'de febrer', 'de març', 'd’abril', 'de maig', 'de juny', 'de juliol', 'd’agost', 'de setembre', 'd’octubre', 'de novembre', 'de desembre'],
                   'en' => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                   'fr' => ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']];
            $mi = (int)date('n', $ts) - 1; $dd = (int)date('j', $ts);
            $ds = ['es' => "$dd de {$MN['es'][$mi]}", 'ca' => "$dd {$MN['ca'][$mi]}", 'en' => "$dd {$MN['en'][$mi]}", 'fr' => "$dd {$MN['fr'][$mi]}"][$l] ?? '';
            if ($ds !== '') $h = preg_replace_callback('#<title>(.*?)</title>#s', function ($m) use ($ds) {
                $t = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
                $parts = preg_split('/ (–|\||-) (?!.* (–|\||-) )/u', $t, 2);
                if (count($parts) < 2) return '<title>'.esc_html($t.', '.$ds).'</title>';
                $sep = mb_substr($t, mb_strlen($parts[0]), mb_strlen($t) - mb_strlen($parts[0]) - mb_strlen($parts[1]));
                return '<title>'.esc_html($parts[0].', '.$ds.$sep.$parts[1]).'</title>';
            }, $h, 1) ?? $h;
        }
    }
    // 4) Mes de las insignias de fecha de la agenda
    $M = ['es' => ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], 'ca' => ['gen', 'febr', 'març', 'abr', 'maig', 'juny', 'jul', 'ag', 'set', 'oct', 'nov', 'des'],
          'en' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 'fr' => ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']];
    $src = ['jan' => 0, 'ene' => 0, 'gen' => 0, 'janv' => 0, 'feb' => 1, 'febr' => 1, 'févr' => 1, 'mar' => 2, 'març' => 2, 'mars' => 2, 'apr' => 3, 'abr' => 3, 'avr' => 3, 'may' => 4, 'maig' => 4, 'mai' => 4,
            'jun' => 5, 'juny' => 5, 'juin' => 5, 'jul' => 6, 'juil' => 6, 'aug' => 7, 'ago' => 7, 'ag' => 7, 'août' => 7, 'sep' => 8, 'set' => 8, 'sept' => 8, 'oct' => 9, 'nov' => 10, 'dec' => 11, 'dic' => 11, 'des' => 11, 'déc' => 11];
    $h = preg_replace_callback('#(<span class="ssi-badge[^"]*"[^>]*><span>)([^<]{2,6})(</span>)#u', function ($m) use ($M, $src, $l) {
        $k = rtrim(mb_strtolower(trim($m[2])), '.'); return isset($src[$k]) ? $m[1].$M[$l][$src[$k]].$m[3] : $m[0]; }, $h) ?? $h;
    if ($l === 'fr') {
        // 1) «English» en el pie de las fichas y eventos franceses: a la versión inglesa, y «Français» como idioma actual
        $h = preg_replace_callback('#<a href="([^"]*)" lang="en" aria-current="true">#', fn($m) => '<a href="'.str_replace(['/fr/directory/', '/fr/event/'], ['/en/directory/', '/en/event/'], $m[1]).'" lang="en">', $h) ?? $h;
        $h = preg_replace('#(<a href="[^"]*" lang="fr")>#', '$1 aria-current="true">', $h, 1);
        // 2) Enlaces a páginas inglesas desde páginas francesas (pie: «Collaborez avec le projet», «Crédits photo»…)
        $keep = [];
        $h = preg_replace_callback('#<link rel="alternate" hreflang="[^"]+" href="[^"]*"\s*/?>|<a href="[^"]*" lang="en"[^>]*>#', function ($m) use (&$keep) { $k = '<!--cqr4'.count($keep).'-->'; $keep[$k] = $m[0]; return $k; }, $h) ?? $h;
        $map = [];
        foreach (cqs_r4_pages() as $k => $by) { if ($k === '_v' || $k === 'home' || empty($by['en']) || empty($by['fr'])) continue; $map['href="'.$root.$by['en'].'"'] = 'href="'.$root.$by['fr'].'"'; $map['href="'.$by['en'].'"'] = 'href="'.$by['fr'].'"'; }
        $h = strtr(strtr($h, $map), $keep);
    }
    // 6) Título de la pestaña: como mucho 65 caracteres (después de traducir), se recorta el nombre y se deja la marca
    $h = preg_replace_callback('#<title>(.*?)</title>#s', function ($m) {
        $t = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8'); if (mb_strlen($t) <= 65) return $m[0];
        $parts = preg_split('/ (–|\||-) (?!.* (–|\||-) )/u', $t, 2);
        if (count($parts) < 2) { $c = mb_substr($t, 0, 64); return '<title>'.esc_html(rtrim($c).'…').'</title>'; }
        $sep = mb_substr($t, mb_strlen($parts[0]), mb_strlen($t) - mb_strlen($parts[0]) - mb_strlen($parts[1]));
        $room = 65 - mb_strlen($sep) - mb_strlen($parts[1]) - 1; $c = mb_substr($parts[0], 0, max(10, $room)); $sp = mb_strrpos($c, ' ');
        if ($sp > $room * 0.6) $c = mb_substr($c, 0, $sp);
        return '<title>'.esc_html(rtrim($c, " ,·|–-:").'…'.$sep.$parts[1]).'</title>';
    }, $h, 1) ?? $h;
    // 7) Imágenes sin srcset (marcadores de Directorist y miniaturas de un solo tamaño): srcset con su único tamaño
    $h = preg_replace_callback('#(<script\b[^>]*>.*?</script>)|<img\b([^>]*)>#is', function ($m) {
        if (!empty($m[1])) return $m[0];
        $a = $m[2]; if (stripos($a, 'srcset=') !== false || !preg_match('/\bsrc="([^"]+)"/', $a, $s) || !preg_match('/\bwidth="(\d+)"/', $a, $w) || strpos($s[1], 'data:') === 0) return $m[0];
        $a = rtrim($a); $sl = substr($a, -1) === '/' ? ' /' : ''; if ($sl) $a = rtrim(substr($a, 0, -1));
        return '<img'.$a.' srcset="'.esc_attr($s[1]).' '.$w[1].'w"'.$sl.'>';
    }, $h) ?? $h;
    return $h;
}
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) return;
    ob_start('cqs_r4_ob');
}, -5);

/* 3) Recintos de TEC con nombre traducido (también en catalán e inglés desde el núcleo) */
add_action('wp_loaded', function () {
    if (get_option('cqs_r4v') === 'v1') return;
    update_option('cqs_r4v', 'v1', false);
    $x = cqs_audit_xmap(); $rep = [];
    foreach (array_keys($x['ca']) as $name) {
        if (mb_strlen($name) < 20) continue;
        foreach (get_posts(['post_type' => 'tribe_venue', 'post_status' => 'any', 'numberposts' => -1, 'title' => $name, 'suppress_filters' => true, 'lang' => '']) as $v) {
            foreach (['ca', 'en', 'fr'] as $L) if (!empty($x[$L][$name])) update_post_meta($v->ID, '_ssi_title_'.$L, $x[$L][$name]);
            $rep[$name][] = $v->ID;
        }
    }
    if (function_exists('cqs_out')) cqs_out('audit-r4.json', $rep);
});

/* Ronda 5: la importación de visitcadaques.org se repite ya (lugares normalizados, «Iglesi» → «Església de Santa Maria») */
add_action('wp_loaded', function () {
    if (get_option('cqs_vc1') !== 'v1' || get_option('cqs_vc2') === 'v1' || !function_exists('cqs_vc_run') || get_transient('cqs_vc2_lock')) return;
    set_transient('cqs_vc2_lock', 1, 600); @set_time_limit(240);
    if (!get_current_user_id()) wp_set_current_user(1);
    $r = cqs_vc_run(); wp_set_current_user(0);
    if (empty($r['error'])) update_option('cqs_vc2', 'v1', false);
    do_action('litespeed_purge_all');
}, 91);
