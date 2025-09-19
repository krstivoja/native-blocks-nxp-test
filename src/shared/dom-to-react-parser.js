/**
 * Simple InnerBlocks inserter replacement utility
 * Replaces standardized placeholders with InnerBlocks components
 */

import { InnerBlocks } from '@wordpress/block-editor';
import { createElement } from '@wordpress/element';

// Expose simple parser globally
window.NativeBlocksParser = {
	/**
	 * Create a React component that replaces inserter placeholders with InnerBlocks
	 */
	createServerContentRenderer: function(serverContent, blockProps, options = {}) {
		if (!serverContent) {
			return createElement('div', blockProps);
		}

		// Quick check if content contains inserter placeholders
		if (!serverContent.includes('fanculo-block-inserter')) {
			// No placeholders - render server content as-is
			return createElement('div', { ...blockProps, dangerouslySetInnerHTML: { __html: serverContent } });
		}

		// Parse HTML content
		const temp = document.createElement('div');
		temp.innerHTML = serverContent;

		// Find the wrapper element (block container)
		const wrapper = temp.querySelector('[class*="wp-block-"]');
		if (!wrapper) {
			return createElement('div', { ...blockProps, dangerouslySetInnerHTML: { __html: serverContent } });
		}

		// Convert wrapper content to React elements
		const elements = this._convertToReact(wrapper, options);

		// Return wrapper with converted elements
		return createElement('div', { ...blockProps, className: wrapper.className }, ...elements);
	},

	/**
	 * Convert DOM nodes to React elements, replacing inserter placeholders
	 *
	 * @param {Element} container - Container element to process
	 * @param {Object} options - InnerBlocks options
	 * @returns {Array} - Array of React elements
	 */
	_convertToReact: function(container, options) {
		const elements = [];

		for (let i = 0; i < container.childNodes.length; i++) {
			const node = container.childNodes[i];
			const element = this._nodeToReact(node, i, options);

			if (element !== null) {
				elements.push(element);
			}
		}

		return elements;
	},

	/**
	 * Convert a single DOM node to React element
	 */
	_nodeToReact: function(node, index, options) {
		// Handle element nodes
		if (node.nodeType === Node.ELEMENT_NODE) {
			// Check if this is our inserter placeholder
			if (node.classList && node.classList.contains('fanculo-block-inserter')) {
				// Replace with InnerBlocks component
				return createElement(InnerBlocks, {
					key: `innerblocks-${index}`,
					...options
				});
			}

			// Regular element - convert to React element
			const tagName = node.tagName.toLowerCase();
			const props = { key: `${tagName}-${index}` };

			// Convert attributes
			for (let i = 0; i < node.attributes.length; i++) {
				const attr = node.attributes[i];
				if (attr.name === 'class') {
					props.className = attr.value;
				} else {
					props[attr.name] = attr.value;
				}
			}

			// Convert children recursively
			const children = this._convertToReact(node, options);

			return createElement(tagName, props, ...children);
		}

		// Handle text nodes
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent.trim();
			return text || null;
		}

		// Ignore other node types
		return null;
	}
};