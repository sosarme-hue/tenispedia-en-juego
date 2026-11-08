<?php
// Instalador de la foto al compartir. Añade al .htaccess de la raíz de cada pedia
// un bloque que manda a _og/og.php solo a los lectores de enlaces (WhatsApp, Facebook, X...).
// - Solo actúa en las webs de la lista que ya tienen _og/og.php.
// - Guarda una copia del .htaccess anterior en .htaccess.antes-og.
// - Si el bloque ya está, no hace nada. No borra nada.
// Para desactivarlo en una web basta con quitar el bloque «og-imagen» de su .htaccess.

header('Content-Type: text/plain; charset=utf-8');

$webs = ['ludicopedia.com', 'zodiacopedia.com', 'mythicapedia.com', 'culinapedia.com',
         'newtonpedia.com', 'tenispedia.com', 'cinematopedia.com', 'medicapedia.org',
         'filopedia.com', 'pinacopedia.com', 'classicapedia.com'];

$bloque = <<<'HT'

# BEGIN og-imagen (foto al compartir; quitar este bloque para desactivarla)
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} (facebookexternalhit|facebookcatalog|Facebot|meta-externalagent|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|SkypeUriPreview|redditbot|Iframely|Embedly|vkShare|Bluesky|Mastodon|Viber) [NC]
RewriteCond %{REQUEST_URI} !^/_og/
RewriteCond %{REQUEST_FILENAME} -d [OR]
RewriteCond %{REQUEST_FILENAME} \.html?$
RewriteRule ^ /_og/og.php [L]
</IfModule>
# END og-imagen

HT;

$dominios = dirname(__DIR__, 3);   // /home/usuario/domains
foreach ($webs as $w) {
    $pub = "$dominios/$w/public_html";
    if (!is_file("$pub/_og/og.php")) { echo "$w: sin _og/og.php, no se toca\n"; continue; }
    $ht = "$pub/.htaccess";
    $antes = is_file($ht) ? file_get_contents($ht) : '';
    if ($antes === false) { echo "$w: no se puede leer .htaccess\n"; continue; }
    if (strpos($antes, 'BEGIN og-imagen') !== false) { echo "$w: ya instalado\n"; continue; }
    if ($antes !== '' && !is_file("$ht.antes-og")) copy($ht, "$ht.antes-og");
    $ok = file_put_contents($ht, rtrim($antes) . "\n" . $bloque, LOCK_EX);
    echo $w . ': ' . ($ok ? 'instalado' . ($antes === '' ? ' (.htaccess nuevo)' : '') : 'ERROR al escribir') . "\n";
}
