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
