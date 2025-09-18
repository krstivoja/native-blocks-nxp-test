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
		// Check if this block supports InnerBlocks
		$supports_innerblocks = isset( $block_config['supports']['innerBlocks'] ) && $block_config['supports']['innerBlocks'];
		
		if ( $supports_innerblocks ) {
			// Use the InnerBlocks processor for blocks that support inner blocks
			register_block_type( __DIR__ . "/build/{$block_type}", [
				'render_callback' => nbnpx_create_innerblocks_render_callback(
					__DIR__ . "/src/{$block_type}/render.php"
				)
			]);
		} else {
			// Use standard registration for blocks without InnerBlocks support
			register_block_type( __DIR__ . "/build/{$block_type}" );
		}
	}
}
add_action( 'init', 'nbnpx_native_blocks_npx_block_init' );
