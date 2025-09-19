<?php
/**
 * InnerBlocks processor utility
 * Handles the replacement of <InnerBlocks /> placeholders in block templates
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Check if content contains InnerBlocks placeholders
 *
 * @param string $content Content to check
 * @return bool True if InnerBlocks found
 */
function nbnpx_has_innerblocks( $content ) {
    return preg_match( '/<InnerBlocks(?:\s*\/?>|><\/InnerBlocks>)/i', $content );
}

/**
 * Check if a specific file contains InnerBlocks placeholders
 *
 * @param string $file_path Path to the file to check
 * @return bool True if file exists and contains InnerBlocks
 */
function nbnpx_file_has_innerblocks( $file_path ) {
    if ( ! file_exists( $file_path ) ) {
        return false;
    }

    $content = file_get_contents( $file_path );
    return nbnpx_has_innerblocks( $content );
}

/**
 * Process a block template and replace <InnerBlocks /> with appropriate content
 *
 * @param string $template_path Path to the clean template file
 * @param array $attributes Block attributes
 * @param string $content Inner blocks content
 * @param WP_Block $block Block instance
 * @return string Processed HTML
 */
function nbnpx_process_innerblocks_template( $template_path, $attributes = [], $content = '', $block = null ) {
    if ( ! file_exists( $template_path ) ) {
        return '';
    }

    // Start output buffering to capture the template output
    ob_start();

    // Include the clean template
    include $template_path;

    // Get the rendered content
    $rendered_content = ob_get_clean();

    // Check if we're in editor context (when ServerSideRender is being used)
    $is_editor_context = defined('REST_REQUEST') && REST_REQUEST;

    if ( $is_editor_context ) {
        // In editor: keep <InnerBlocks /> as placeholder for JavaScript to process
        return $rendered_content;
    } else {
        // On frontend: replace <InnerBlocks /> with actual inner blocks content
        return preg_replace(
            '/<InnerBlocks(?:\s*\/?>|><\/InnerBlocks>)/i',
            $content ?? '',
            $rendered_content
        );
    }
}

/**
 * Create a render callback that uses the InnerBlocks processor
 *
 * @param string $template_path Path to the clean template file
 * @return callable Render callback function
 */
function nbnpx_create_innerblocks_render_callback( $template_path ) {
    return function( $attributes, $content, $block ) use ( $template_path ) {
        return nbnpx_process_innerblocks_template( $template_path, $attributes, $content, $block );
    };
}