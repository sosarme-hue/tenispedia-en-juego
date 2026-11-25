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
/* Sin enlaces a feeds de comentarios de cada ficha (daban 404) */
add_action('wp', function () { if (is_singular(['at_biz_dir', 'tribe_events'])) remove_action('wp_head', 'feed_links_extra', 3); });

/* ---------- 3. Títulos de pestaña de hasta 65 caracteres ---------- */
add_filter('document_title_parts', function ($p) {
    if (empty($p['title'])) return $p;
    $t = html_entity_decode(wp_strip_all_tags($p['title']), ENT_QUOTES, 'UTF-8');
    if (!empty($p['site']) && mb_strlen($t) + 3 + mb_strlen($p['site']) > 65) unset($p['site'], $p['tagline']);
    if (mb_strlen($t) > 65) { $c = mb_substr($t, 0, 64); $s = mb_strrpos($c, ' '); $p['title'] = rtrim($s > 40 ? mb_substr($c, 0, $s) : $c, " ,·|–-").'…'; }
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
    // Imágenes con tamaño conocido por el nombre del archivo (-300x200.jpg): width/height para que no salte la página
    $n = 0;
    $h = preg_replace_callback('#<img\b(?![^>]*\bwidth=)([^>]*?\bsrc="[^"]*-(\d{2,4})x(\d{2,4})\.(?:jpe?g|png|webp)(?:\?[^"]*)?")([^>]*)>#i', function ($m) use (&$n) {
        $n++; $lazy = ($n > 3 && stripos($m[0], 'loading=') === false) ? ' loading="lazy"' : '';
        return '<img width="'.$m[2].'" height="'.$m[3].'"'.$lazy.(stripos($m[0], 'decoding=') === false ? ' decoding="async"' : '').$m[1].$m[4].'>';
    }, $h);
    // Textos fuera de scripts: formulario de opiniones (es/ca) y meses (ca)
    if (in_array($l, ['es', 'ca'], true)) {
        $U = cqs_audit_ui()[$l];
        $h = preg_replace_callback('#(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<textarea\b[^>]*>.*?</textarea>)|>([^<>]+)(?=<)|\b(placeholder|aria-label|title|data-label)="([^"]*)"#is', function ($m) use ($U, $l) {
            if (!empty($m[1])) return $m[0];
            if (!empty($m[3])) { $v = html_entity_decode($m[4], ENT_QUOTES, 'UTF-8'); return isset($U[$v]) ? $m[3].'="'.esc_attr($U[$v]).'"' : $m[0]; }
            $raw = $m[2]; $t = trim(html_entity_decode($raw, ENT_QUOTES, 'UTF-8'), " \t\n\r\0\x0B\xC2\xA0");
            if ($t === '') return $m[0];
            if (isset($U[$t])) return '>'.str_replace($t, esc_html($U[$t]), html_entity_decode($raw, ENT_QUOTES, 'UTF-8'));
            if ($l === 'ca' && preg_match('/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/', $raw)) return '>'.cqs_audit_months($raw, 'ca');
            return $m[0];
        }, $h) ?? $h;
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
function cqs_audit_fr_head($h) {
    if (stripos($h, '<html') === false) return $h;
    $h = preg_replace('#<html lang="en-GB"#', '<html lang="fr-FR"', $h, 1);
    // Eventos: título y texto en francés (_ssi_title_fr / _ssi_content_fr en lugar del inglés)
    if (is_singular('tribe_events')) {
        $id = get_queried_object_id();
        foreach (['content', 'title'] as $f) {
            $en = trim((string)get_post_meta($id, '_ssi_'.$f.'_en', true)); $fr = trim((string)get_post_meta($id, '_ssi_'.$f.'_fr', true));
            if ($en === '' || $fr === '') continue;
            foreach (array_unique([$en, wptexturize($en), esc_html($en), esc_html(wptexturize($en))]) as $v) $h = str_replace($v, $f === 'title' && $v !== $en ? esc_html($fr) : $fr, $h);
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
        if ($add) $h = preg_replace('#</head>#', $add.'</head>', $h, 1);
    }
    $h = strtr($h, $keep);
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

    // Fichas duplicadas (La Gritta, Sa Botiga, Galeria Cadaqués): se queda la más completa; las otras a la papelera con redirección
    global $wpdb;
    $norm = fn($t) => preg_replace('/[^a-z0-9]+/', '', strtolower(remove_accents(html_entity_decode($t, ENT_QUOTES, 'UTF-8'))));
    $rows = $wpdb->get_results("SELECT ID, post_title, post_name FROM {$wpdb->posts} WHERE post_type='at_biz_dir' AND post_status='publish' AND (post_title LIKE '%Gritta%' OR post_title LIKE '%Botiga%' OR post_title LIKE '%Galer%Cadaqu%')");
    $grp = [];
    foreach ($rows as $r) { $n = $norm($r->post_title); if (preg_match('/gritta|^sabotiga$|^galeriacadaques$/', $n)) $grp[preg_match('/gritta/', $n) ? 'gritta' : $n][] = $r; }
    $map = (array)get_option('cqs_dup_map', []);
    foreach ($grp as $g => $list) {
        $info = [];
        foreach ($list as $r) {
            $m = fn($k) => trim((string)get_post_meta($r->ID, $k, true));
            $score = strlen($m('_phone')) > 3 ? 3 : 0; $score += $m('_website') ? 3 : 0; $score += $m('_email') ? 1 : 0; $score += (get_post_thumbnail_id($r->ID) || $m('_listing_prv_img')) ? 2 : 0;
            $score += min(3, (int)(strlen(wp_strip_all_tags((string)get_post_field('post_content', $r->ID))) / 150)); $score += (int)get_comments_number($r->ID) * 5;
            $info[] = ['id' => (int)$r->ID, 't' => $r->post_title, 'slug' => $r->post_name, 'lat' => (float)$m('_manual_lat'), 'lng' => (float)$m('_manual_lng'), 'tel' => preg_replace('/\D/', '', $m('_phone')), 'web' => preg_replace('#^https?://(www\.)?|/$#', '', $m('_website')), 'addr' => $m('_address'), 'score' => $score];
        }
        usort($info, fn($a, $b) => $b['score'] <=> $a['score'] ?: $a['id'] <=> $b['id']);
        $keep = array_shift($info); $done = [];
        foreach ($info as $d) {
            $near = $keep['lat'] && $d['lat'] && abs($keep['lat'] - $d['lat']) < 0.0008 && abs($keep['lng'] - $d['lng']) < 0.001;
            $same = $near || ($d['tel'] && $d['tel'] === $keep['tel']) || ($d['web'] && $d['web'] === $keep['web']) || ($d['addr'] && $norm($d['addr']) === $norm($keep['addr']));
            if (!$same) { $done[] = ['id' => $d['id'], 'accion' => 'se mantiene (otro lugar)', 'addr' => $d['addr']]; continue; }
            wp_trash_post($d['id']); $map[$d['slug']] = $keep['id'];
            $done[] = ['id' => $d['id'], 'accion' => 'papelera → '.$keep['id'], 'addr' => $d['addr']];
        }
        $rep['duplicados'][$g] = ['queda' => $keep, 'otras' => $done];
    }
    update_option('cqs_dup_map', $map, false);

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
add_action('wp_loaded', function () {
    if (get_option('cqs_audit_once') === 'o1' || get_transient('cqs_audit_lock') || !function_exists('cqs_out')) return;
    set_transient('cqs_audit_lock', 1, 300);
    update_option('cqs_audit_once', 'o1', false);
    try { $rep = cqs_audit_once(); } catch (Throwable $e) { $rep = ['error' => $e->getMessage().' @'.$e->getLine()]; }
    cqs_out('audit-once.json', $rep);
}, 70);

/* ---------- 7. Comprobación desde fuera (out/audit-*.html y out/audit-check.json), una vez por versión ---------- */
add_action('wp_loaded', function () {
    $v = 'c2'; if (get_option('cqs_audit_once') !== 'o1' || get_option('cqs_audit_check') === $v || get_transient('cqs_audit_lock') || get_transient('cqs_audit_clock') || !function_exists('cqs_out')) return;
    set_transient('cqs_audit_clock', 1, 600);
    $U = [];
    $s = get_posts(['post_type' => 'at_biz_dir', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true, 'tax_query' => [['taxonomy' => 'at_biz_dir-category', 'field' => 'slug', 'terms' => ['apartamentos-turisticos', 'hoteles', 'dormir'], 'include_children' => true]]]);
    if ($s) { foreach (['es', 'ca', 'en', 'fr'] as $L) $U['sleep-'.$L] = ssi_xl_permalink($s[0], $L); }
    $ev = get_posts(['post_type' => 'tribe_events', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_cqs_key', 'meta_value' => 'primer-sol-2027', 'suppress_filters' => true, 'lang' => '']);
    if ($ev) { $U['event-fr'] = ssi_xl_permalink($ev[0], 'fr'); $U['event-ca'] = ssi_xl_permalink($ev[0], 'ca'); }
    $U['home-en'] = home_url('/en/');
    $dir = function_exists('ssi_link') ? ssi_link('directory', 'fr') : ''; if ($dir) $U['dir-fr-p2'] = trailingslashit($dir).'page/2/';
    $U['dir-es'] = function_exists('ssi_link') ? ssi_link('directory', 'es') : '';
    $out = [];
    foreach (array_filter($U) as $k => $u) {
        $r = wp_remote_get(add_query_arg('nocache', time(), $u), ['timeout' => 40, 'sslverify' => false]);
        if (is_wp_error($r)) { $out[$k] = $r->get_error_message(); continue; }
        @file_put_contents(SSI_DIR.'out/audit-'.$k.'.html', wp_remote_retrieve_body($r)); $out[$k] = [$u, wp_remote_retrieve_response_code($r)];
    }
    foreach (['/fr/directory/', '/en/privacy-policy-2/', '/en/privacy-policy/', '/wp-sitemap.xml', '/wp-sitemap-ssilistings-fr-1.xml', '/wp-content/uploads/fonts/figtree-latin.woff2', '/wp-content/uploads/fonts/bricolage-grotesque-latin.woff2'] as $p) {
        $r = wp_remote_get(home_url($p), ['timeout' => 30, 'sslverify' => false, 'redirection' => 0]);
        $out['head'][$p] = is_wp_error($r) ? $r->get_error_message() : wp_remote_retrieve_response_code($r).' '.wp_remote_retrieve_header($r, 'location').' '.strlen(wp_remote_retrieve_body($r));
    }
    if ($s) { $r = wp_remote_get(trailingslashit(get_permalink($s[0])).'feed/', ['timeout' => 30, 'sslverify' => false, 'redirection' => 0]); $out['head']['feed'] = is_wp_error($r) ? $r->get_error_message() : wp_remote_retrieve_response_code($r).' '.wp_remote_retrieve_header($r, 'location'); }
    cqs_out('audit-check.json', $out);
    update_option('cqs_audit_check', $v, false);
}, 80);
