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
