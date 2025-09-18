/**
 * Shared DOM-to-React parser utility
 * Converts server-rendered HTML with <InnerBlocks /> placeholders to React elements
 */

import { InnerBlocks } from '@wordpress/block-editor';
import { createElement } from '@wordpress/element';

/**
 * Parse server content and convert DOM nodes to React elements
 * 
 * @param {string} serverContent - The server-rendered HTML content
 * @param {Object} options - Configuration options
 * @param {Array|null} options.allowedBlocks - Array of allowed block types for InnerBlocks (optional)
 * @param {Array|null} options.template - Template for InnerBlocks (optional)
 * @param {boolean} options.templateLock - Whether template is locked (optional, defaults to false)
 * @param {string} options.wrapperSelector - CSS selector for the wrapper element (default: '[class*="wp-block-"]')
 * @returns {Object|null} - Object with { elements, wrapperClasses } or null if no placeholder found
 */
export function parseServerContentWithInnerBlocks(serverContent, options = {}) {
	const {
		allowedBlocks = null,
		template = null,
		templateLock = false,
		wrapperSelector = '[class*="wp-block-"]'
	} = options;

	// Check if content contains InnerBlocks placeholder
	if (!serverContent || !/<innerblocks\s*\/?>/i.test(serverContent)) {
		return null;
	}

	// Replace <InnerBlocks /> with a placeholder that won't break DOM parsing
	const processedContent = serverContent.replace(/<InnerBlocks\s*\/?>/gi, '<innerblocks-placeholder></innerblocks-placeholder>');

	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = processedContent;

	// Debug: log the parsed HTML structure
	console.log('Original server content:', serverContent);
	console.log('Parsed DOM innerHTML:', tempDiv.innerHTML);

	const wrapperDiv = tempDiv.querySelector(wrapperSelector);
	if (!wrapperDiv) {
		return null;
	}

	console.log('Wrapper div innerHTML:', wrapperDiv.innerHTML);
	console.log('Wrapper div childNodes:', Array.from(wrapperDiv.childNodes).map(n => ({type: n.nodeType, name: n.nodeName, content: n.textContent})));

	// Get wrapper classes and other attributes
	const wrapperClasses = wrapperDiv.className;

	// Helper function to convert DOM nodes to React elements
	const convertDomToReact = (domNode, index) => {
		if (domNode.nodeType === Node.ELEMENT_NODE) {
			const tagName = domNode.tagName.toLowerCase();

			// Handle <innerblocks-placeholder /> placeholder
			if (tagName === 'innerblocks-placeholder') {
				const innerBlocksProps = {
					key: `innerblocks-${index}`
				};
				
				// Only add these props if they are provided
				if (allowedBlocks !== null) {
					innerBlocksProps.allowedBlocks = allowedBlocks;
				}
				if (template !== null) {
					innerBlocksProps.template = template;
				}
				if (templateLock !== false) {
					innerBlocksProps.templateLock = templateLock;
				}
				
				return createElement(InnerBlocks, innerBlocksProps);
			}

			// Convert child nodes recursively
			const children = [];
			domNode.childNodes.forEach((child, childIndex) => {
				const element = convertDomToReact(child, `${index}-${childIndex}`);
				if (element !== null) {
					children.push(element);
				}
			});

			// Convert attributes
			const props = { key: `${tagName}-${index}` };
			for (const attr of domNode.attributes) {
				if (attr.name === 'class') {
					props.className = attr.value;
				} else if (attr.name === 'style') {
					// Convert inline style string to object
					const styleObject = {};
					attr.value.split(';').forEach(stylePair => {
						const parts = stylePair.split(':');
						if (parts.length === 2) {
							const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
							styleObject[key] = parts[1].trim();
						}
					});
					props.style = styleObject;
				} else {
					props[attr.name] = attr.value;
				}
			}

			return createElement(tagName, props, ...children);
		} else if (domNode.nodeType === Node.TEXT_NODE) {
			const text = domNode.textContent.trim();
			return text || null;
		}
		return null;
	};

	// Convert all child nodes of the wrapper
	const elements = [];
	wrapperDiv.childNodes.forEach((node, index) => {
		const element = convertDomToReact(node, index);
		if (element !== null) {
			elements.push(element);
		}
	});

	return {
		elements,
		wrapperClasses
	};
}

/**
 * Create a React component that renders server content with InnerBlocks support
 * 
 * @param {string} serverContent - The server-rendered HTML content
 * @param {Object} blockProps - Block properties from useBlockProps()
 * @param {Object} options - Configuration options for InnerBlocks
 * @returns {JSX.Element} - React element
 */
export function createServerContentRenderer(serverContent, blockProps, options = {}) {
	const parsed = parseServerContentWithInnerBlocks(serverContent, options);
	
	if (parsed) {
		return createElement('div', { ...blockProps, className: parsed.wrapperClasses }, ...parsed.elements);
	}
	
	// No placeholder found - render server content as-is
	return createElement('div', { ...blockProps, dangerouslySetInnerHTML: { __html: serverContent } });
}
