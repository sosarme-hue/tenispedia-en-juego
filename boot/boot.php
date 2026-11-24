<?php
if (!defined('ABSPATH')) exit;
/* Copia del núcleo de la red y exportación de la estructura de las guías modelo.
   Todo ocurre dentro del servidor: las claves de las otras webs no salen de él.
   Resultado en out/ (cerrado al público con .htaccess). */

register_activation_hook(CQS_FILE, 'cqs_boot_run');
add_action('init', function () {
    if (get_option('cqs_boot') === CQS_BOOT_VER) return;
    if (get_transient('cqs_boot_lock')) return;
    set_transient('cqs_boot_lock', 1, 300);
    cqs_boot_run();
}, 1);

function cqs_domains_dir() { return dirname(dirname(rtrim(ABSPATH, '/'))); } // .../domains
function cqs_site_root($domain) { return cqs_domains_dir().'/'.$domain.'/public_html'; }

function cqs_out($name, $data) {
    $dir = SSI_DIR.'out';
    if (!is_dir($dir)) wp_mkdir_p($dir);
    if (!file_exists($dir.'/.htaccess')) file_put_contents($dir.'/.htaccess', "Require all denied\n");
    file_put_contents($dir.'/'.$name, is_string($data) ? $data : wp_json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function cqs_boot_run() {
    $log = ['started' => gmdate('c'), 'ver' => CQS_BOOT_VER];
    try {
        update_option('blog_public', 0); // fuera de Google hasta el visto bueno de Alex
        $log['copy'] = cqs_copy_core();
        $log['export'] = [];
        foreach (CQS_SRC_PAGES as $d) $log['export'][$d] = cqs_export_site($d);
        $log['plugins'] = array_keys(get_plugins());
        $log['active'] = (array)get_option('active_plugins');
        $log['theme'] = get_stylesheet();
        $log['php'] = PHP_VERSION;
        update_option('cqs_boot', CQS_BOOT_VER);
    } catch (Throwable $e) {
        $log['error'] = $e->getMessage().' @ '.$e->getFile().':'.$e->getLine();
    }
    $log['ended'] = gmdate('c');
    cqs_out('boot-log.json', $log);
}

/* 1) Núcleo: copia del plugin de eivissa.si con el nombre cambiado. Informe de lo que aún habla de Eivissa. */
function cqs_copy_core() {
    $src = cqs_site_root(CQS_SRC_CORE).'/wp-content/plugins/'.CQS_SRC_CORE_SLUG;
    if (!is_dir($src)) return 'no existe '.$src;
    $rep = [
        CQS_SRC_CORE_SLUG.'.css' => 'cadaques-si.css', CQS_SRC_CORE_SLUG.'.js' => 'cadaques-si.js',
        'Eivissa Sí' => 'Cadaqués Sí', 'Eivissa Sí' => 'Cadaqués Sí', 'eivissa.si' => 'cadaques.si',
        "'eivissa/v1'" => "'cadaques/v1'", 'Eivissa <span' => 'Cadaqués <span',
    ];
    $skip = ['/'.CQS_SRC_CORE_SLUG.'.php', '/inc/bus.php'];
    $pat = '/eivissa|ibiza|eivissenc|ibicenc|pitius|formentera|balear|\b07[89]\d\d\b|sant antoni|santa eul|sant josep|sant joan|vara de rey|dalt vila|SSI_LAT0|SSI_LNG0/i';
    $n = 0; $report = '';
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        $rel = substr($f->getPathname(), strlen($src));
        if (in_array($rel, $skip, true) || strpos($rel, '/.git') === 0) continue;
        $dstRel = str_replace(CQS_SRC_CORE_SLUG, 'cadaques-si', $rel);
        $dst = SSI_DIR.ltrim($dstRel, '/');
        wp_mkdir_p(dirname($dst));
        $ext = strtolower(pathinfo($rel, PATHINFO_EXTENSION));
        if (in_array($ext, ['php','css','js','json','txt','html'], true)) {
            $c = strtr(file_get_contents($f->getPathname()), $rep);
            file_put_contents($dst, $c);
            foreach (explode("\n", $c) as $i => $line) if (preg_match($pat, $line)) $report .= $dstRel.':'.($i+1).': '.mb_substr(trim($line), 0, 220)."\n";
        } else {
            copy($f->getPathname(), $dst);
        }
        $n++;
    }
    cqs_out('report-core.txt', $report);
    return $n.' archivos';
}

/* 2) Estructura de una guía modelo (páginas, menús, categorías, ajustes), leída de su base de datos */
function cqs_db_for($domain) {
    $cfg = @file_get_contents(cqs_site_root($domain).'/wp-config.php');
    if (!$cfg) return [null, null];
    $get = function ($k) use ($cfg) { return preg_match("/define\(\s*['\"]".$k."['\"]\s*,\s*['\"]([^'\"]*)['\"]/", $cfg, $m) ? $m[1] : null; };
    $prefix = preg_match('/\$table_prefix\s*=\s*[\'"]([^\'"]+)[\'"]/', $cfg, $m) ? $m[1] : 'wp_';
    $db = @new mysqli('127.0.0.1', $get('DB_USER'), $get('DB_PASSWORD'), $get('DB_NAME'), 3306);
    if ($db->connect_errno) return [null, null];
    $db->set_charset('utf8mb4');
    return [$db, $prefix];
}
function cqs_q($db, $sql) { $r = $db->query($sql); $o = []; if ($r) while ($row = $r->fetch_assoc()) $o[] = $row; return $o; }
function cqs_mask($v) {
    if (is_array($v)) { foreach ($v as $k => $x) $v[$k] = preg_match('/key|secret|token|pass|smtp|api/i', (string)$k) ? '***' : cqs_mask($x); return $v; }
    return $v;
}
function cqs_export_site($domain) {
    [$db, $p] = cqs_db_for($domain);
    if (!$db) return 'sin acceso a la base de datos';
    $slug = sanitize_title(str_replace('.si', '', $domain));
    // Idioma y traducciones de cada objeto (Polylang)
    $lang = []; foreach (cqs_q($db, "SELECT tr.object_id, t.slug FROM {$p}term_relationships tr JOIN {$p}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id JOIN {$p}terms t ON t.term_id=tt.term_id WHERE tt.taxonomy IN ('language','term_language')") as $r) $lang[$r['object_id']] = $r['slug'];
    $tr = []; foreach (cqs_q($db, "SELECT tr.object_id, tt.description FROM {$p}term_relationships tr JOIN {$p}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id WHERE tt.taxonomy='post_translations'") as $r) $tr[$r['object_id']] = maybe_unserialize($r['description']);
    $pages = cqs_q($db, "SELECT ID, post_name, post_title, post_parent, menu_order, post_status, post_content, post_excerpt FROM {$p}posts WHERE post_type='page' AND post_status IN ('publish','draft','private') ORDER BY ID");
    $meta = []; foreach (cqs_q($db, "SELECT pm.post_id, pm.meta_key, pm.meta_value FROM {$p}postmeta pm JOIN {$p}posts po ON po.ID=pm.post_id WHERE po.post_type IN ('page','nav_menu_item') AND pm.meta_key NOT IN ('_edit_lock','_edit_last')") as $r) $meta[$r['post_id']][$r['meta_key']] = maybe_unserialize($r['meta_value']);
    foreach ($pages as &$pg) { $pg['lang'] = $lang[$pg['ID']] ?? null; $pg['tr'] = $tr[$pg['ID']] ?? null; $pg['meta'] = $meta[$pg['ID']] ?? []; } unset($pg);
    $menus = cqs_q($db, "SELECT t.term_id, t.name, t.slug FROM {$p}terms t JOIN {$p}term_taxonomy tt ON tt.term_id=t.term_id WHERE tt.taxonomy='nav_menu'");
    foreach ($menus as &$mn) {
        $mn['items'] = cqs_q($db, "SELECT po.ID, po.post_title, po.menu_order FROM {$p}posts po JOIN {$p}term_relationships tr ON tr.object_id=po.ID JOIN {$p}term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id WHERE tt.term_id=".(int)$mn['term_id']." AND po.post_type='nav_menu_item' ORDER BY po.menu_order");
        foreach ($mn['items'] as &$it) $it['meta'] = $meta[$it['ID']] ?? []; unset($it);
    } unset($mn);
    $terms = [];
    foreach (['at_biz_dir-category','at_biz_dir-location','at_biz_dir-tags','tribe_events_cat','category'] as $tax) {
        $rows = cqs_q($db, "SELECT t.term_id, t.name, t.slug, tt.parent, tt.description, tt.count FROM {$p}terms t JOIN {$p}term_taxonomy tt ON tt.term_id=t.term_id WHERE tt.taxonomy='".$db->real_escape_string($tax)."' ORDER BY t.term_id");
        $tm = []; foreach (cqs_q($db, "SELECT tm.term_id, tm.meta_key, tm.meta_value FROM {$p}termmeta tm JOIN {$p}term_taxonomy tt ON tt.term_id=tm.term_id WHERE tt.taxonomy='".$db->real_escape_string($tax)."'") as $r) $tm[$r['term_id']][$r['meta_key']] = maybe_unserialize($r['meta_value']);
        foreach ($rows as &$t) { $t['meta'] = $tm[$t['term_id']] ?? []; $t['lang'] = $lang[$t['term_id']] ?? null; } unset($t);
        $terms[$tax] = $rows;
    }
    $opts = [];
    foreach (cqs_q($db, "SELECT option_name, option_value FROM {$p}options WHERE option_name IN ('ssi_page_ids','polylang','atbdp_option','theme_mods_kadence','ssi_public_listings','show_on_front','page_on_front','blogname','blogdescription','permalink_structure','tribe_events_calendar_options','wpcf7','site_icon','widget_block','sidebars_widgets','kadence_global_palette') OR option_name LIKE 'ssi\\_%' OR option_name LIKE 'site\\_reviews%settings%'") as $r) $opts[$r['option_name']] = cqs_mask(maybe_unserialize($r['option_value']));
    $counts = cqs_q($db, "SELECT post_type, post_status, COUNT(*) n FROM {$p}posts GROUP BY post_type, post_status ORDER BY n DESC");
    $forms = cqs_q($db, "SELECT ID, post_title, post_content FROM {$p}posts WHERE post_type='wpcf7_contact_form'");
    $db->close();
    cqs_out('export-'.$slug.'.json', ['domain' => $domain, 'pages' => $pages, 'menus' => $menus, 'terms' => $terms, 'options' => $opts, 'counts' => $counts, 'forms' => $forms]);
    return count($pages).' páginas, '.count($menus).' menús';
}
