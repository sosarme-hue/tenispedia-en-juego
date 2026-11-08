<?php
/* Instala wp-content/mu-plugins/ssi-baja-form.php (botón «Solicitar baja») y vacía la caché. Idempotente. */
header('Content-Type: text/plain; charset=utf-8'); header('X-Robots-Tag: noindex');
require dirname(__DIR__).'/wp-load.php';
$codigo = <<<'MUEND'
<?php
/* Sitges Sí — «Solicitar baja» (8/11/2026).
 * 1) En cada ficha, debajo de «¿Algún dato incorrecto?», un enlace «Solicita la baja» al formulario de corrección.
 * 2) El formulario de corrección gana la opción «Quiero que se borre la ficha (baja)» y llega ya relleno (negocio, enlace, propietario).
 * 3) Si piden la baja, el asunto del correo empieza por [BAJA].
 * Para quitarlo basta con borrar este archivo. */
if (!defined('ABSPATH')) exit;

function ssi_bf_txt($k, $l = null) {
    $l = $l ?: (function_exists('ssi_lang') ? ssi_lang() : 'es');
    static $t = [
        'opt'  => ['es'=>'Quiero que se borre la ficha (baja)', 'ca'=>'Vull que s’esborri la fitxa (baixa)', 'en'=>'Please remove the listing'],
        'link' => ['es'=>'¿Es tu negocio y prefieres no aparecer? Solicita la baja →', 'ca'=>'És el teu negoci i prefereixes no sortir-hi? Demana la baixa →', 'en'=>'Is this your business and you’d rather not be listed? Ask for removal →'],
        'ph'   => ['es'=>'Si pides la baja, cuéntanos que eres el titular. Borramos la ficha en un plazo máximo de 30 días.', 'ca'=>'Si demanes la baixa, explica’ns que n’ets el titular. Esborrem la fitxa en un termini màxim de 30 dies.', 'en'=>'If you’re asking for removal, tell us you’re the owner. We delete the listing within 30 days at most.'],
    ];
    return $t[$k][$l] ?? $t[$k]['es'];
}

/* 1. Enlace en la ficha */
add_action('template_redirect', function () {
    if (!is_singular('at_biz_dir') || !function_exists('ssi_link')) return;
    ob_start(function ($html) {
        $id = get_queried_object_id(); $l = ssi_lang();
        $anchor = ['es'=>'#ficha','ca'=>'#fitxa','en'=>'#listing'][$l] ?? '#ficha';
        $url = add_query_arg(['baja'=>'1', 'fix-business'=>rawurlencode(html_entity_decode(get_the_title($id), ENT_QUOTES)), 'fix-link'=>rawurlencode(get_permalink($id))], ssi_link('voice')).$anchor;
        $p = '<p class="ssi-more ssi-baja" style="margin-top:-.6rem"><a href="'.esc_url($url).'" rel="nofollow" style="color:#5b6b75">'.esc_html(ssi_bf_txt('link', $l)).'</a></p>';
        return preg_replace('~(<p class="ssi-more"><a href="[^"]*#(?:ficha|fitxa|listing)">[^<]*</a></p>)~', '$1'.$p, $html, 1);
    });
});

/* 2. Opción de baja en el desplegable «¿Qué ha cambiado?» (vale para mostrar y para validar) */
add_filter('wpcf7_form_tag', function ($tag) {
    if (!is_array($tag) || ($tag['name'] ?? '') !== 'fix-what' || empty($tag['values'])) return $tag;
    $vals = (array)$tag['values'];
    $l = in_array('Altres', $vals, true) ? 'ca' : (in_array('Other', $vals, true) ? 'en' : 'es');
    $o = ssi_bf_txt('opt', $l);
    if (!in_array($o, $vals, true)) { $tag['values'][] = $o; $tag['raw_values'][] = $o; $tag['labels'][] = $o; }
    return $tag;
});

/* Relleno automático al llegar desde «Solicita la baja» */
add_action('wp_footer', function () {
    if (!isset($_GET['baja'])) return;
    $ph = wp_json_encode(['es'=>ssi_bf_txt('ph','es'),'ca'=>ssi_bf_txt('ph','ca'),'en'=>ssi_bf_txt('ph','en')]);
    $op = wp_json_encode([ssi_bf_txt('opt','es'), ssi_bf_txt('opt','ca'), ssi_bf_txt('opt','en')]);
    echo '<script>(function(){function go(){var q=new URLSearchParams(location.search),s=document.querySelector(\'select[name="fix-what"]\');if(!s)return;var f=s.form,ops='.$op.',ph='.$ph.';'
       .'for(var i=0;i<s.options.length;i++)if(ops.indexOf(s.options[i].value)>-1)s.selectedIndex=i;'
       .'["fix-business","fix-link"].forEach(function(n){var e=f.querySelector(\'[name="\'+n+\'"]\'),v=q.get(n);if(e&&v&&!e.value)e.value=v;});'
       .'var r=f.querySelectorAll(\'input[name="fix-relation"]\');if(r.length>1)r[r.length-1].checked=true;'
       .'var b=f.querySelector(\'textarea[name="fix-body"]\'),L=(document.documentElement.lang||"es").slice(0,2);if(b)b.placeholder=ph[L]||ph.es;}if(document.readyState==="complete")setTimeout(go,400);else addEventListener("load",function(){setTimeout(go,400);});})();</script>';
}, 99);

/* 3. Asunto del correo */
add_filter('wpcf7_mail_components', function ($c, $form = null, $mail = null) {
    if (!class_exists('WPCF7_Submission') || !($s = WPCF7_Submission::get_instance())) return $c;
    $w = $s->get_posted_data('fix-what'); $w = is_array($w) ? reset($w) : $w;
    if ($w && in_array($w, [ssi_bf_txt('opt','es'), ssi_bf_txt('opt','ca'), ssi_bf_txt('opt','en')], true) && strpos($c['subject'] ?? '', '[BAJA]') !== 0) $c['subject'] = '[BAJA] '.($c['subject'] ?? '');
    return $c;
}, 10, 3);
MUEND;
$f = WP_CONTENT_DIR.'/mu-plugins/ssi-baja-form.php';
if (!is_file($f) || file_get_contents($f) !== $codigo) echo 'ssi-baja-form.php: '.(file_put_contents($f, $codigo, LOCK_EX) ? 'instalado' : 'ERROR')."\n"; else echo "ssi-baja-form.php: ya instalado\n";
wp_cache_flush(); do_action('litespeed_purge_all'); if (!headers_sent()) header('X-LiteSpeed-Purge: *');
echo "Caché vaciada\n";
