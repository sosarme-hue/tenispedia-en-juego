<?php
// Instalador de un solo uso: añade el bloque «og-imagen» al .htaccess de la raíz de
// catdogpedia.com y celebraciones.org para que los lectores de enlaces (WhatsApp, Facebook, X...)
// pasen por _og/og.php. Guarda copia en .htaccess.antes-og. Si ya está, no hace nada. No borra nada.
header('Content-Type: text/plain; charset=utf-8');
$bot = '(facebookexternalhit|facebookcatalog|Facebot|meta-externalagent|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|SkypeUriPreview|redditbot|Iframely|Embedly|vkShare|Bluesky|Mastodon|Viber)';
$webs = [
  // CatDogPedia: solo portadas (las fichas ya tienen buenas etiquetas)
  'catdogpedia.com' => "RewriteCond %{REQUEST_URI} ^/(en/)?(index\\.html)?$\n",
  // celebraciones.org: todas las páginas
  'celebraciones.org' => "RewriteCond %{REQUEST_FILENAME} -d [OR]\nRewriteCond %{REQUEST_FILENAME} \\.html?$\n",
  // enfermeria.si: todas las páginas (saberparainvertir.com lleva el bloque en el .htaccess de su repositorio)
  'enfermeria.si' => "RewriteCond %{REQUEST_FILENAME} -d [OR]\nRewriteCond %{REQUEST_FILENAME} \\.html?$\n",
];
$dominios = dirname(__DIR__, 3);
foreach ($webs as $w => $cond) {
  $pub = "$dominios/$w/public_html";
  if (!is_file("$pub/_og/og.php")) { echo "$w: sin _og/og.php, no se toca\n"; continue; }
  $ht = "$pub/.htaccess";
  $antes = is_file($ht) ? file_get_contents($ht) : '';
  if ($antes === false) { echo "$w: no se puede leer .htaccess\n"; continue; }
  if (strpos($antes, 'BEGIN og-imagen') !== false) { echo "$w: ya instalado\n"; continue; }
  if ($antes !== '' && !is_file("$ht.antes-og")) copy($ht, "$ht.antes-og");
  $bloque = "\n# BEGIN og-imagen (foto al compartir; quitar este bloque para desactivarla)\n<IfModule mod_rewrite.c>\nRewriteEngine On\n"
    . "RewriteCond %{HTTP_USER_AGENT} $bot [NC]\nRewriteCond %{REQUEST_URI} !^/_og/\n" . $cond
    . "RewriteRule ^ /_og/og.php [L]\n</IfModule>\n# END og-imagen\n";
  $ok = file_put_contents($ht, rtrim($antes) . "\n" . $bloque, LOCK_EX);
  echo "$w: " . ($ok ? 'instalado' : 'ERROR al escribir') . "\n";
}
