<?php
/**
 * Plugin Name: SSI AdSense
 * Description: Código de Google AdSense (pub-6250668607782976) y aviso de publicidad en las páginas de privacidad y cookies.
 */
if (!defined('ABSPATH')) exit;

define('SSI_ADSENSE_CLIENT', 'ca-pub-6250668607782976');

add_action('wp_head', function () {
	if (is_admin() || is_feed() || is_404()) return;
	echo '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . SSI_ADSENSE_CLIENT . '" crossorigin="anonymous"></script>' . "\n";
}, 1);

add_filter('the_content', function ($html) {
	if (!is_page() || !in_the_loop() || !is_main_query()) return $html;
	$slug = get_post_field('post_name', get_the_ID());
	$priv = array('es' => array('politica-de-privacidad', 'privacidad'), 'ca' => array('politica-de-privacitat', 'privacitat'), 'en' => array('privacy-policy'));
	$cook = array('es' => array('politica-de-cookies', 'cookies'), 'ca' => array('politica-de-galetes', 'galetes'), 'en' => array('cookie-policy'));
	$lang = null; $kind = null;
	foreach (array('priv' => $priv, 'cook' => $cook) as $k => $set) {
		foreach ($set as $l => $slugs) if (in_array($slug, $slugs, true)) { $lang = $l; $kind = $k; }
	}
	if (!$lang) return $html;
	$t = array(
		'es' => array(
			'h' => 'Publicidad: Google AdSense',
			'p' => 'Este sitio muestra anuncios de Google AdSense, un servicio de Google Ireland Limited. Google y sus socios pueden usar cookies e identificadores para mostrar anuncios, limitar cuántas veces ves uno y medir su rendimiento. Solo se muestran anuncios personalizados si das tu consentimiento en el aviso de privacidad de Google que aparece al entrar; si no, los anuncios no son personalizados.',
			'l' => 'Puedes cambiar tu elección en cualquier momento con el enlace «Privacidad y cookies» del aviso de Google, y gestionar la personalización en <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Configuración de anuncios de Google</a>. Más información: <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">cómo usa Google los datos de los sitios que usan sus servicios</a>.',
		),
		'ca' => array(
			'h' => 'Publicitat: Google AdSense',
			'p' => 'Aquest lloc mostra anuncis de Google AdSense, un servei de Google Ireland Limited. Google i els seus socis poden fer servir galetes i identificadors per mostrar anuncis, limitar quantes vegades en veus un i mesurar-ne el rendiment. Només es mostren anuncis personalitzats si hi dones el consentiment a l\'avís de privacitat de Google que apareix en entrar; si no, els anuncis no són personalitzats.',
			'l' => 'Pots canviar la teva elecció en qualsevol moment amb l\'enllaç «Privacitat i galetes» de l\'avís de Google, i gestionar la personalització a <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Configuració d\'anuncis de Google</a>. Més informació: <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">com fa servir Google les dades dels llocs que fan servir els seus serveis</a>.',
		),
		'en' => array(
			'h' => 'Advertising: Google AdSense',
			'p' => 'This site shows ads from Google AdSense, a service of Google Ireland Limited. Google and its partners may use cookies and identifiers to show ads, cap how often you see them and measure their performance. Personalised ads are shown only if you consent in the Google privacy message shown when you arrive; otherwise ads are non-personalised.',
			'l' => 'You can change your choice at any time through the "Privacy and cookie settings" link in the Google message, and manage personalisation in <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Google Ad Settings</a>. More information: <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">how Google uses data from sites that use its services</a>.',
		),
	);
	$x = $t[$lang];
	return $html . "\n<section class=\"ssi-adsense-info\" id=\"publicidad\"><h2>" . esc_html($x['h']) . "</h2><p>" . esc_html($x['p']) . "</p><p>" . $x['l'] . "</p></section>\n";
}, 20);
