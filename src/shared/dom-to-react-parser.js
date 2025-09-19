/**
 * Shared DOM-to-React parser utility
 * Converts server-rendered HTML with <InnerBlocks /> placeholders to React elements
 */

import { InnerBlocks } from '@wordpress/block-editor';
import { createElement } from '@wordpress/element';

// Expose parser functions globally
window.NativeBlocksParser = {
	// Cache for parsed content to avoid re-parsing
	_cache: new Map(),
	
	// CSS selector for standardized placeholder
	_inserterSelector: '.fanculo-block-inserter',

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
	parseServerContentWithInnerBlocks: function(serverContent, options = {}) {
	// Early return for empty content
	if (!serverContent) {
		return null;
	}

	// Create cache key from content and options
	const cacheKey = serverContent + JSON.stringify(options);
	
	// Check cache first
	if (this._cache.has(cacheKey)) {
		return this._cache.get(cacheKey);
	}

	const {
		allowedBlocks = null,
		template = null,
		templateLock = false,
		wrapperSelector = '[class*="wp-block-"]'
	} = options;

	// Parse server content directly (no need for regex pre-check)
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = serverContent;

	const wrapperDiv = tempDiv.querySelector(wrapperSelector);
	if (!wrapperDiv) {
		this._cache.set(cacheKey, null);
		return null;
	}

	// Quick check if there are any inserter placeholders
	if (!wrapperDiv.querySelector(this._inserterSelector)) {
		this._cache.set(cacheKey, null);
		return null;
	}

	// Get wrapper classes and other attributes
	const wrapperClasses = wrapperDiv.className;

	// Helper function to convert DOM nodes to React elements (optimized)
	const convertDomToReact = (domNode, index) => {
		if (domNode.nodeType === Node.ELEMENT_NODE) {
			const tagName = domNode.tagName.toLowerCase();

			// Handle inserter placeholder
			if (domNode.classList && domNode.classList.contains('fanculo-block-inserter')) {
				const innerBlocksProps = { key: `innerblocks-${index}` };
				
				// Only add these props if they are provided (avoid unnecessary object creation)
				if (allowedBlocks !== null) innerBlocksProps.allowedBlocks = allowedBlocks;
				if (template !== null) innerBlocksProps.template = template;
				if (templateLock !== false) innerBlocksProps.templateLock = templateLock;
				
				return createElement(InnerBlocks, innerBlocksProps);
			}

			// Convert child nodes recursively (optimized with for loop)
			const children = [];
			const childNodes = domNode.childNodes;
			for (let i = 0; i < childNodes.length; i++) {
				const element = convertDomToReact(childNodes[i], `${index}-${i}`);
				if (element !== null) {
					children.push(element);
				}
			}

			// Convert attributes (optimized)
			const props = { key: `${tagName}-${index}` };
			const attributes = domNode.attributes;
			for (let i = 0; i < attributes.length; i++) {
				const attr = attributes[i];
				if (attr.name === 'class') {
					props.className = attr.value;
				} else if (attr.name === 'style') {
					// Convert inline style string to object (optimized)
					const styleObject = {};
					const stylePairs = attr.value.split(';');
					for (let j = 0; j < stylePairs.length; j++) {
						const parts = stylePairs[j].split(':');
						if (parts.length === 2) {
							const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
							styleObject[key] = parts[1].trim();
						}
					}
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

	// Convert all child nodes of the wrapper (optimized with for loop)
	const elements = [];
	const childNodes = wrapperDiv.childNodes;
	for (let i = 0; i < childNodes.length; i++) {
		const element = convertDomToReact(childNodes[i], i);
		if (element !== null) {
			elements.push(element);
		}
	}

	const result = {
		elements,
		wrapperClasses
	};

	// Cache the result
	this._cache.set(cacheKey, result);
	
	// Limit cache size to prevent memory leaks
	if (this._cache.size > 100) {
		const firstKey = this._cache.keys().next().value;
		this._cache.delete(firstKey);
	}

	return result;
	},

/**
 * Create a React component that renders server content with InnerBlocks support
 * 
 * @param {string} serverContent - The server-rendered HTML content
 * @param {Object} blockProps - Block properties from useBlockProps()
 * @param {Object} options - Configuration options for InnerBlocks
 * @returns {JSX.Element} - React element
 */
	createServerContentRenderer: function(serverContent, blockProps, options = {}) {
	const parsed = this.parseServerContentWithInnerBlocks(serverContent, options);
	
	if (parsed) {
		return createElement('div', { ...blockProps, className: parsed.wrapperClasses }, ...parsed.elements);
	}
	
		// No placeholder found - render server content as-is
		return createElement('div', { ...blockProps, dangerouslySetInnerHTML: { __html: serverContent } });
	}
};
