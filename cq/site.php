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
