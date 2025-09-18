<?php
/**
 * Render wrapper that processes InnerBlocks placeholders
 * This file handles the replacement of placeholder with actual content
 */

// Start output buffering to capture the render.php output
ob_start();

// Include the clean template
include __DIR__ . '/render.php';

// Get the rendered content
$rendered_content = ob_get_clean();

// Check if we're in editor context (when ServerSideRender is being used)
$is_editor_context = defined('REST_REQUEST') && REST_REQUEST;

if ($is_editor_context) {
    // In editor: keep placeholder as-is for JavaScript to process
    echo $rendered_content;
} else {
    // On frontend: replace <InnerBlocks /> with actual inner blocks content
    $processed_content = preg_replace(
        '/<InnerBlocks\s*\/?>/i',
        $content ?? '',
        $rendered_content
    );

    echo $processed_content;
}
?>