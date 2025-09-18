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
require_once __DIR__ . '/includes/innerblocks-processor.php';

/**
 * Check if any block render templates contain <InnerBlocks /> placeholders
 */
function nbnpx_has_innerblocks_in_templates() {
	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';

	foreach ( $manifest_data as $block_type => $block_config ) {
		$render_file = __DIR__ . "/src/{$block_type}/render.php";

		if ( file_exists( $render_file ) ) {
			$content = file_get_contents( $render_file );
			// Use the same detection logic as the processor
			if ( preg_match( '/<InnerBlocks(?:\s*\/?>|><\/InnerBlocks>)/i', $content ) ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Conditionally enqueue the shared parser script only if templates actually contain <InnerBlocks />
 */
function nbnpx_enqueue_shared_parser() {
	// Only load the parser if we actually have <InnerBlocks /> in templates
	if ( nbnpx_has_innerblocks_in_templates() ) {
		$asset_file = include __DIR__ . '/build/shared/dom-to-react-parser.asset.php';

		wp_enqueue_script(
			'native-blocks-parser',
			plugins_url('build/shared/dom-to-react-parser.js', __FILE__),
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);
	}
}
add_action('enqueue_block_editor_assets', 'nbnpx_enqueue_shared_parser');

function nbnpx_native_blocks_npx_block_init() {
	
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		return;
	}
	
	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		wp_register_block_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
	}

	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';
	foreach ( $manifest_data as $block_type => $block_config ) {
		$render_file = __DIR__ . "/src/{$block_type}/render.php";

		// Check if this block's render template contains <InnerBlocks />
		$has_innerblocks_in_template = false;
		if ( file_exists( $render_file ) ) {
			$content = file_get_contents( $render_file );
			$has_innerblocks_in_template = preg_match( '/<InnerBlocks(?:\s*\/?>|><\/InnerBlocks>)/i', $content );
		}

		if ( $has_innerblocks_in_template ) {
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
add_action( 'init', 'nbnpx_native_blocks_npx_block_init' );
