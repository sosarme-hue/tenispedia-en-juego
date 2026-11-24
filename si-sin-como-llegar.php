<?php
/**
 * Plugin Name: Guías .si · Sin «Cómo llegar»
 * Description: Quita el botón «Cómo llegar» (enlaces a openstreetmap.org/directions y /search) de los listados y de las fichas de negocio, en todos los idiomas. No toca el mapa de la ficha ni el botón de Google Maps. Petición de Alex, 24/11/2026.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

// 1) En la ficha (HTML del servidor): quita el enlace antes de enviarlo.
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) return;
    ob_start(function ($html) {
        if (!is_string($html) || strpos($html, 'openstreetmap.org/') === false) return $html;
        return preg_replace('#<a\b[^>]*href="https?://(?:www\.)?openstreetmap\.org/(?:directions|search)\?[^"]*"[^>]*>.*?</a>#is', '', $html);
    });
});

// 2) Por si acaso (páginas en caché o botones creados con JavaScript en los listados).
add_action('wp_head', function () {
    echo '<style id="si-sin-como-llegar">a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search?"]{display:none!important}</style>' . "\n";
}, 99);
add_action('wp_footer', function () {
    echo '<script id="si-sin-como-llegar-js">(function(){function f(){document.querySelectorAll(\'a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search?"]\').forEach(function(a){var p=a.parentNode;a.remove();if(p&&p.classList&&p.classList.contains("ssi-cardacts")&&!p.children.length)p.remove();});}f();document.addEventListener("DOMContentLoaded",f);window.addEventListener("load",f);})();</script>' . "\n";
}, 999);
