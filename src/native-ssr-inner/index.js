import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import './style.scss';
import './editor.scss';
import metadata from './block.json';

const ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/image',
	'core/button',
	'core/group',
	'core/columns',
	'core/column'
];

const TEMPLATE = [
	['core/paragraph', { placeholder: 'Add some content here...' }]
];

function Edit() {
	const [serverContent, setServerContent] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const postId = wp.data.select('core/editor').getCurrentPostId() || 0;

		wp.apiFetch({
			path: '/wp/v2/block-renderer/nbnpx/native-ssr-inner?context=edit',
			method: 'POST',
			data: {
				attributes: {},
				post_id: postId
			}
		}).then(response => {
			setServerContent(response.rendered);
			setIsLoading(false);
		}).catch(error => {
			console.error('Block render error:', error);
			setIsLoading(false);
		});
	}, []);

	const blockProps = useBlockProps();

	if (isLoading) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Parse server content and replace <InnerBlocks /> with InnerBlocks
	if (serverContent && /<innerblocks\s*\/?>/i.test(serverContent)) {
		// Parse the HTML and convert DOM nodes to React elements
		// First, replace <InnerBlocks /> with a placeholder that won't break DOM parsing
		const processedContent = serverContent.replace(/<InnerBlocks\s*\/?>/gi, '<innerblocks-placeholder></innerblocks-placeholder>');

		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = processedContent;

		// Debug: log the parsed HTML structure
		console.log('Original server content:', serverContent);
		console.log('Parsed DOM innerHTML:', tempDiv.innerHTML);

		const wrapperDiv = tempDiv.querySelector('[class*="wp-block-"]');
		if (wrapperDiv) {
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
						return <InnerBlocks
							key={`innerblocks-${index}`}
							allowedBlocks={ALLOWED_BLOCKS}
							template={TEMPLATE}
							templateLock={false}
						/>;
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

					return wp.element.createElement(tagName, props, ...children);
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

			return (
				<div { ...blockProps } className={wrapperClasses}>
					{elements}
				</div>
			);
		}
	}

	// No placeholder found - render server content as-is
	return (
		<div { ...blockProps } dangerouslySetInnerHTML={{ __html: serverContent }} />
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		// return null;
		return <InnerBlocks.Content />
	},
} );
