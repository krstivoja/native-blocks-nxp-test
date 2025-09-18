import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { parseAndInjectInnerBlocks } from './parseInnerBlocks';
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

	// Get server-side rendered content using ServerSideRender
	useEffect(() => {
		// Create a hidden ServerSideRender to get the actual PHP output
		const tempContainer = document.createElement('div');
		tempContainer.style.position = 'absolute';
		tempContainer.style.left = '-9999px';
		tempContainer.style.visibility = 'hidden';
		document.body.appendChild(tempContainer);

		// Use React to render ServerSideRender in the hidden container
		const { render } = wp.element;
		const ServerSideRender = wp.serverSideRender;

		render(
			wp.element.createElement(ServerSideRender, {
				block: "nbnpx/native-ssr-inner",
				attributes: {}
			}),
			tempContainer
		);

		// Wait for the render to complete, then extract the HTML
		const checkForContent = () => {
			const renderedContent = tempContainer.innerHTML;
			if (renderedContent && !renderedContent.includes('Loading')) {
				setServerContent(renderedContent);
				setIsLoading(false);
				document.body.removeChild(tempContainer);
			} else {
				setTimeout(checkForContent, 100);
			}
		};

		setTimeout(checkForContent, 200);

		return () => {
			if (document.body.contains(tempContainer)) {
				document.body.removeChild(tempContainer);
			}
		};
	}, []);

	if (isLoading) {
		return (
			<div { ...useBlockProps() }>
				Loading...
			</div>
		);
	}

	const parsedContent = parseAndInjectInnerBlocks(serverContent, ALLOWED_BLOCKS, TEMPLATE);

	return (
		<div { ...useBlockProps() }>
			{parsedContent}
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		return <InnerBlocks.Content />;
	},
} );
