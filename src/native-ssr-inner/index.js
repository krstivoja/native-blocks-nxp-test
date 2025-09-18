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

	// Use the global parser to render server content with InnerBlocks support
	return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		templateLock: false
	});
}

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		// return null;
		return <InnerBlocks.Content />
	},
} );
