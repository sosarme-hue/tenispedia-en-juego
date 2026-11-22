<?php
/*
Plugin Name: SSI · Agenda en el sitemap
Description: Añade al sitemap de WordPress la página de la agenda (/events/) y las categorías de eventos con eventos. Lo instala y lo mantiene _sitemaps-ajustes/ajustes.php (catdogpedia.com). Solo añade un sitemap; no cambia nada más.
*/
if (!defined('ABSPATH')) exit;
add_action('init', function () {
  if (!function_exists('wp_register_sitemap_provider') || !class_exists('WP_Sitemaps_Provider') || !post_type_exists('tribe_events')) return;
  if (!class_exists('SSI_Sitemap_Agenda')) {
    class SSI_Sitemap_Agenda extends WP_Sitemaps_Provider {
      public function __construct() { $this->name = 'ssiagenda'; $this->object_type = 'ssiagenda'; }
      public function get_url_list($page_num, $object_subtype = '') {
        if ((int) $page_num !== 1) return array();
        $urls = array();
        $arch = get_post_type_archive_link('tribe_events');
        if ($arch) $urls[] = array('loc' => $arch);
        if (taxonomy_exists('tribe_events_cat')) {
          $terms = get_terms(array('taxonomy' => 'tribe_events_cat', 'hide_empty' => true));
          if (!is_wp_error($terms)) foreach ($terms as $t) {
            $l = get_term_link($t);
            if (!is_wp_error($l)) $urls[] = array('loc' => $l);
          }
        }
        return $urls;
      }
      public function get_max_num_pages($object_subtype = '') { return 1; }
    }
  }
  wp_register_sitemap_provider('ssiagenda', new SSI_Sitemap_Agenda());
}, 20);
