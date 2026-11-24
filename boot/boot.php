<?php
if (!defined('ABSPATH')) exit;
/* Copia del código del núcleo de la red (solo los archivos del plugin de eivissa.si, sin datos ni claves)
   e informe de lo que aún hay que adaptar a Cadaqués. Resultado en out/ (cerrado al público con .htaccess). */

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
    $rep = cqs_global_replacements();
    $skip = ['/'.CQS_SRC_CORE_SLUG.'.php', '/inc/bus.php', '/inc/feeds.php', '/inc/guardia.php'];
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
    $pr = cqs_apply_patches();
    cqs_out('report-core.txt', $report);
    cqs_out('report-patches.txt', $pr);
    cqs_out('report-symbols.txt', cqs_symbols());
    return $n.' archivos';
}

/* Cambios puntuales tras la copia: [archivo, buscar, reemplazar] o ['re', archivo, patrón, reemplazo]. Informe de los que no encajan. */
function cqs_apply_patches() {
    $out = '';
    foreach (require SSI_DIR.'boot/patches.php' as $i => $p) {
        $re = $p[0] === 're'; if ($re) array_shift($p);
        [$file, $a, $b] = $p; $path = SSI_DIR.ltrim($file, '/');
        if (!file_exists($path)) { $out .= "#$i FALTA $file\n"; continue; }
        $c = file_get_contents($path); $n = 0;
        if ($re) $c2 = preg_replace($a, $b, $c, -1, $n);
        else { $n = substr_count($c, $a); $c2 = str_replace($a, $b, $c); }
        if ($n) file_put_contents($path, $c2);
        $out .= "#$i $file: ".($n ? "$n cambio(s)" : 'NO ENCAJA')."\n";
    }
    return $out;
}
/* Qué usa el núcleo: claves de páginas, shortcodes, opciones y funciones de los archivos que no se copian */
function cqs_symbols() {
    $keys = $sc = $opts = []; $code = '';
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(SSI_DIR, FilesystemIterator::SKIP_DOTS)) as $f) {
        if (substr($f->getFilename(), -4) !== '.php' || strpos($f->getPathname(), '/boot/') !== false) continue;
        $c = file_get_contents($f->getPathname()); $code .= $c;
        if (preg_match_all("/ssi_(?:link|page_ids_all)\\(\\s*'([a-z0-9_]+)'/", $c, $m)) foreach ($m[1] as $k) $keys[$k] = 1;
        if (preg_match_all("/add_shortcode\\(\\s*'([a-z0-9_]+)'/", $c, $m)) foreach ($m[1] as $k) $sc[$k] = basename($f->getPathname());
        if (preg_match_all("/get_option\\(\\s*'([a-z0-9_]+)'/", $c, $m)) foreach ($m[1] as $k) $opts[$k] = 1;
    }
    $miss = [];
    $src = cqs_site_root(CQS_SRC_CORE).'/wp-content/plugins/'.CQS_SRC_CORE_SLUG.'/inc/';
    foreach (['bus','feeds','guardia'] as $x) {
        $c = (string)@file_get_contents($src.$x.'.php');
        if (preg_match_all('/function\\s+([a-z0-9_]+)\\s*\\(/i', $c, $m)) foreach ($m[1] as $fn) if (preg_match('/\\b'.$fn.'\\s*\\(/', $code)) $miss[] = "$x.php: $fn";
    }
    return "CLAVES DE PAGINA: ".implode(', ', array_keys($keys))."\n\nSHORTCODES:\n".implode("\n", array_map(function ($k, $v) { return "$k ($v)"; }, array_keys($sc), $sc))
        ."\n\nOPCIONES: ".implode(', ', array_keys($opts))."\n\nFUNCIONES DE ARCHIVOS NO COPIADOS USADAS POR EL RESTO:\n".implode("\n", $miss)."\n";
}
function cqs_global_replacements() {
    return [
        'Eivissa Sí' => 'Cadaqués Sí', 'Eivissa S\\u00ed' => 'Cadaqu\\u00e9s S\\u00ed', 'eivissa.si' => 'cadaques.si', 'Eivissa.si' => 'Cadaques.si',
        'eivissa/v1' => 'cadaques/v1', 'Eivissa <span' => 'Cadaqués <span', CQS_SRC_CORE_SLUG => 'cadaques-si', 'EivissaSi/1.0' => 'CadaquesSi/1.0',
        'La guía de Eivissa y Formentera' => 'La guía de Cadaqués', 'La guia d’Eivissa i Formentera' => 'La guia de Cadaqués', 'The guide to Ibiza and Formentera' => 'The guide to Cadaqués',
        'la guía de Eivissa y Formentera' => 'la guía de Cadaqués', 'la guia d’Eivissa i Formentera' => 'la guia de Cadaqués', 'the guide to Ibiza and Formentera' => 'the guide to Cadaqués',
        'en Eivissa y Formentera' => 'en Cadaqués', 'a Eivissa i Formentera' => 'a Cadaqués', 'in Ibiza and Formentera' => 'in Cadaqués',
        'de Eivissa y Formentera' => 'de Cadaqués', 'd’Eivissa i Formentera' => 'de Cadaqués', 'Ibiza and Formentera shops' => 'Cadaqués shops',
        'Illes Balears' => 'Girona',
    ];
}
