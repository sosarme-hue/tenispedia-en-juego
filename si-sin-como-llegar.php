<?php
/**
 * Plugin Name: Guías .si · Sin «Cómo llegar»
 * Description: Quita los botones «Cómo llegar» / «Com arribar» / «Directions» que abren un mapa externo (OpenStreetMap o Google Maps), en listados, fichas, farmacias, playas y rutas, en todos los idiomas. No toca el mapa incrustado de la ficha ni el botón «Google Maps ↗». Petición de Alex, 24/11/2026.
 * Version: 1.1.0
 */
if (!defined('ABSPATH')) exit;

/* Texto de botón que significa «cómo llegar» en es/ca/en/fr. */
function si_scl_label_re() { return '/c[oó]mo\s+llegar|com\s+arribar|get(ting)?\s+there|how\s+to\s+get|get\s+directions|^\s*directions\b|itin[ée]raire|comment\s+s.y\s+rendre/iu'; }
/* Enlace a un mapa externo. */
function si_scl_map_re() { return '#^https?://(?:www\.)?(?:openstreetmap\.org/|google\.[a-z.]+/maps|maps\.google\.|maps\.app\.goo\.gl)#i'; }

// 1) HTML del servidor: quita esos enlaces antes de enviarlo.
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) return;
    ob_start(function ($html) {
        if (!is_string($html) || (stripos($html, 'openstreetmap.org') === false && stripos($html, 'maps') === false)) return $html;
        $out = preg_replace_callback('#<a\b([^>]*)>(.*?)</a>#is', function ($m) {
            if (!preg_match('#\bhref\s*=\s*["\']([^"\']+)["\']#i', $m[1], $h)) return $m[0];
            $href = html_entity_decode($h[1]);
            if (!preg_match(si_scl_map_re(), $href)) return $m[0];
            if (preg_match('#openstreetmap\.org/(?:directions|search)\?#i', $href)) return '';
            $txt = trim(html_entity_decode(wp_strip_all_tags($m[2]), ENT_QUOTES, 'UTF-8'));
            return preg_match(si_scl_label_re(), $txt) ? '' : $m[0];
        }, $html);
        return is_string($out) ? $out : $html;
    });
});

// 2) Páginas en caché o botones creados con JavaScript (tarjetas de los listados).
add_action('wp_head', function () {
    echo '<style id="si-sin-como-llegar">a[href*="openstreetmap.org/directions"],a[href*="openstreetmap.org/search?"],a.si-scl-x{display:none!important}</style>' . "\n";
}, 99);
add_action('wp_footer', function () { ?>
<script id="si-sin-como-llegar-js">(function(){
var L=<?php echo wp_json_encode(si_scl_label_re()); ?>,M=/^https?:\/\/(?:www\.)?(?:openstreetmap\.org\/|google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl)/i;
L=new RegExp(L.slice(1,L.lastIndexOf('/')),'i');
function f(root){(root||document).querySelectorAll('a[href]').forEach(function(a){var h=a.href||'';if(!M.test(h))return;
 if(/openstreetmap\.org\/(directions|search)\?/i.test(h)||L.test((a.textContent||'').trim())){var p=a.parentNode;a.remove();
 if(p&&p.classList&&p.classList.contains('ssi-cardacts')&&!p.children.length)p.remove();}});}
f();document.addEventListener('DOMContentLoaded',function(){f();});window.addEventListener('load',function(){f();});
if(window.MutationObserver)new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)f(n.parentNode||n);});});}).observe(document.documentElement,{childList:true,subtree:true});
})();</script>
<?php }, 999);
