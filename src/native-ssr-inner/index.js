import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { useState, useEffect, useMemo, memo } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import './style.scss';
import './editor.scss';
import metadata from './block.json';

// Move constants outside component to prevent recreation
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

// Memoized options object to prevent recreation
const PARSER_OPTIONS = {
	allowedBlocks: ALLOWED_BLOCKS,
	template: TEMPLATE,
	templateLock: false
};

const Edit = memo(function Edit() {
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

	// Memoize the parser call to prevent unnecessary re-renders
	const renderedContent = useMemo(() => {
		if (isLoading) return null;
		return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps, PARSER_OPTIONS);
	}, [serverContent, blockProps, isLoading]);

	if (isLoading) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	return renderedContent;
});

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		// return null;
		return <InnerBlocks.Content />
	},
} );
