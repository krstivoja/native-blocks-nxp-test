import { createElement } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Parse HTML and replace <InnerBlocks /> with actual InnerBlocks component
 * @param {string} htmlContent - HTML content with <InnerBlocks /> placeholders
 * @param {Array} allowedBlocks - Array of allowed block types
 * @param {Array} template - Default template for inner blocks
 * @returns {Array} React elements
 */
export const parseAndInjectInnerBlocks = (htmlContent, allowedBlocks = null, template = []) => {
	if (!htmlContent) return null;

	const INNERBLOCKS_REGEX = /<InnerBlocks\s*\/?>|<InnerBlocks><\/InnerBlocks>/gi;
	const PLACEHOLDER = '<innerblocks-placeholder></innerblocks-placeholder>';

	// Replace InnerBlocks with placeholder
	const processedContent = htmlContent.replace(INNERBLOCKS_REGEX, PLACEHOLDER);

	// Create DOM and convert to React elements
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = processedContent;

	const convertDomToReact = (node, index) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent.trim();
			return text || null;
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			const tagName = node.tagName.toLowerCase();
			const key = `${tagName}-${index}`;

			// Replace placeholder with InnerBlocks
			if (tagName === 'innerblocks-placeholder') {
				const innerBlocksProps = {
					key: `innerblocks-${index}`,
					allowedBlocks: allowedBlocks,
					template: template,
					templateLock: false
				};
				return createElement(InnerBlocks, innerBlocksProps);
			}

			// Convert attributes
			const props = { key };
			for (let i = 0; i < node.attributes.length; i++) {
				const { name, value } = node.attributes[i];
				props[name === 'class' ? 'className' : name] = value;
			}

			// Convert children
			const children = [];
			for (let i = 0; i < node.childNodes.length; i++) {
				const child = convertDomToReact(node.childNodes[i], `${index}-${i}`);
				if (child != null) children.push(child);
			}

			return createElement(tagName, props, children.length ? children : null);
		}

		return null;
	};

	const elements = [];
	for (let i = 0; i < tempDiv.childNodes.length; i++) {
		const element = convertDomToReact(tempDiv.childNodes[i], i);
		if (element != null) elements.push(element);
	}

	return elements;
};