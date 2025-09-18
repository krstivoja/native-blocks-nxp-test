<?php
/**
 * InnerBlocks processor utility
 * Handles the replacement of <InnerBlocks /> placeholders in block templates
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
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
        // Combine both patterns for better performance
        $processed_content = preg_replace(
            '/<InnerBlocks(?:\s*\/?>|><\/InnerBlocks>)/i',
            $content ?? '',
            $rendered_content
        );

        return $processed_content;
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