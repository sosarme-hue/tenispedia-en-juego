<?php
if (!defined('ABSPATH')) exit;
/* Cambios puntuales del núcleo de eivissa.si para Cadaqués (se aplican tras cada copia). */
return [
    ['inc/i18n.php', 'la información de las islas está en conselldeivissa.es y consellinsulardeformentera.cat, y la de cada municipio, en la web de su Ajuntament.', 'la información municipal está en cadaques.cat, la web del Ajuntament de Cadaqués.'],
    ['inc/i18n.php', 'la informació de les illes és a conselldeivissa.es i consellinsulardeformentera.cat, i la de cada municipi, a la web del seu Ajuntament.', 'la informació municipal és a cadaques.cat, el web de l’Ajuntament de Cadaqués.'],
    ['inc/i18n.php', 'island information is at conselldeivissa.es and consellinsulardeformentera.cat, and each town’s at its Town Council website.', 'local council information is at cadaques.cat, the Cadaqués Town Council website.'],
    ['inc/front.php', "return ['eivissa' => ['Eivissa', 38.9067, 1.4206],", "return ['cadaques' => ['Cadaqués', 42.2886, 3.2776]]; /* "],
    ['inc/front.php', "'formentera' => ['Formentera', 38.7059, 1.4290]];", "*/"],
    ['inc/front.php', '// El tiempo en Eivissa y Formentera: [gsi_tiempo] (los seis municipios) o [gsi_tiempo town="formentera"]', '// El tiempo en Cadaqués: [gsi_tiempo]'],
    ['inc/seo.php', "['es' => 'Eivissa', 'ca' => 'Eivissa', 'en' => 'Ibiza'][\$L]", "['es' => 'Cadaqués', 'ca' => 'Cadaqués', 'en' => 'Cadaqués'][\$L]"],
    ['templates/single-listing.php', "\$sep.'Eivissa';", "\$sep.'Cadaqués';"],
    ['templates/single-listing.php', "', Eivissa').', Girona'", "', 17488 Cadaqués').', Girona'"],
    ['inc/addform.php', "[\$address.', Eivissa, Girona', \$address.', Formentera, Girona', \$address]", "[\$address.', 17488 Cadaqués, Girona', \$address]"],
    ['inc/shortcodes.php', "'eivissa','ibiza','formentera'", "'cadaques','cadaqués','portlligat'"],
    ['re', 'templates/404.php', '/\$M = \[.*?\n\];\n/s', "\$M = [\n  [['Qué ver','Què veure','What to see'][\$i0 = (['es'=>0,'ca'=>1,'en'=>2][\$L] ?? 0)], ['/visitar/', '/ca/que-visitar/', '/en/visit/']],\n  [['Playas y calas','Platges i cales','Beaches and coves'][\$i0], ['/playas-y-calas/', '/ca/platges-i-cales/', '/en/beaches-and-coves/']],\n  [['Cap de Creus','Cap de Creus','Cap de Creus'][\$i0], ['/cap-de-creus/', '/ca/parc-natural-cap-de-creus/', '/en/cap-de-creus-natural-park/']],\n  [['Comer y beber','Menjar i beure','Eat and drink'][\$i0], ['/comer-y-beber/', '/ca/menjar-i-beure/', '/en/eat-and-drink/']],\n  [['Dónde dormir','On dormir','Where to stay'][\$i0], ['/donde-dormir/', '/ca/on-dormir/', '/en/where-to-stay/']],\n  [['Mapa','Mapa','Map'][\$i0], ['/mapa/', '/ca/mapa-ca/', '/en/map/']],\n];\n"],
    ['templates/404.php', "'mun'  => ['es'=>'Los seis municipios','ca'=>'Els sis municipis','en'=>'The six towns'],", "'mun'  => ['es'=>'Lo más visitado','ca'=>'El més visitat','en'=>'Most visited'],"],
    ['templates/404.php', 'sigue por uno de los municipios.', 'sigue por una de estas secciones.'],
    ['templates/404.php', 'continua per un dels municipis.', 'continua per una d’aquestes seccions.'],
    ['templates/404.php', 'carry on through one of the towns.', 'carry on through one of these sections.'],
    // Francés: la interfaz del núcleo usa el inglés como base y los textos propios en francés (cq/site.php)
    ['inc/i18n.php', "return in_array(\$l, ['es','ca','en'], true) ? \$l : 'es';", "if (\$l === 'fr') return 'en'; return in_array(\$l, ['es','ca','en'], true) ? \$l : 'es';"],
    ['inc/i18n.php', "\$lang = \$lang ?: ssi_lang();", "\$lang = \$lang ?: (function_exists('cqs_cur_lang') ? cqs_cur_lang() : ssi_lang());"],
    ['inc/i18n.php', "foreach (['ca','en'] as \$l) { \$t = pll_get_post(\$ids[\$key], \$l);", "foreach (['ca','en','fr'] as \$l) { \$t = pll_get_post(\$ids[\$key], \$l);"],
    ['inc/i18n.php', "return \$s[\$key][\$l] ?? (\$s[\$key]['es'] ?? \$key);", "if (function_exists('cqs_fr_t') && (\$f = cqs_fr_t(\$key)) !== null) return \$f; return \$s[\$key][\$l] ?? (\$s[\$key]['es'] ?? \$key);"],
    // Fichas en francés: _ssi_title_fr / _ssi_content_fr; si faltan, el inglés
    ['inc/listing-i18n.php', 'return trim((string)get_post_meta($id, "_ssi_{$field}_{$l}", true));', 'if (function_exists(\'cqs_cur_lang\') && cqs_cur_lang() === \'fr\' && ($fr = trim((string)get_post_meta($id, "_ssi_{$field}_fr", true))) !== \'\') return $fr; return trim((string)get_post_meta($id, "_ssi_{$field}_{$l}", true));'],
    // Buscador de la portada (form.gsi-search): mismo desplegable de sugerencias que el del núcleo
    ['inc/shortcodes.php', "document.querySelectorAll('form.ssi-search input[name=s]')", "document.querySelectorAll('form.ssi-search input[name=s],form.gsi-search input[name=s]')"],
    // El buscador también encuentra por la descripción en francés
    ['inc/shortcodes.php', "get_post_meta($id, '_ssi_content_en', true),", "get_post_meta($id, '_ssi_content_en', true), get_post_meta($id, '_ssi_content_fr', true),"],
];
