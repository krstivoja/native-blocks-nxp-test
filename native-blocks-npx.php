<?php
/**
 * Plugin Name:       Native Blocks NPX 
 * Description:       Example block scaffolded with Create Block tool.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       native-blocks-npx
 *
 * @package Nbnpx
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Include the InnerBlocks processor utility
require_once __DIR__ . '/inc/innerblocks-processor.php';

/**
 * Initialize and register all blocks with proper InnerBlocks handling
 */
function nbnpx_native_blocks_npx_block_init() {
	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';

	foreach ( $manifest_data as $block_type => $block_config ) {
		$render_file = __DIR__ . "/build/{$block_type}/render.php";

		if ( file_exists( $render_file ) && nbnpx_file_has_innerblocks( $render_file ) ) {
			// Use the InnerBlocks processor for blocks that have <InnerBlocks /> in templates
			register_block_type( __DIR__ . "/build/{$block_type}", [
				'render_callback' => nbnpx_create_innerblocks_render_callback( $render_file )
			]);
		} else {
			// Use standard registration for blocks without <InnerBlocks /> in templates
			register_block_type( __DIR__ . "/build/{$block_type}" );
		}
	}
}

// Hook into WordPress

add_action( 'init', 'nbnpx_native_blocks_npx_block_init' );
