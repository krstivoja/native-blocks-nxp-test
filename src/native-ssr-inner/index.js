import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { useState, useEffect, useMemo, memo } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import './style.scss';
import './editor.scss';
import metadata from './block.json';

// Pre-defined constants to prevent recreation during renders
const PARSER_OPTIONS = {
	allowedBlocks: [
		'core/paragraph',
		'core/heading',
		'core/image',
		'core/button',
		'core/group',
		'core/columns',
		'core/column'
	],
	template: [
		['core/paragraph', { placeholder: 'Add some content here...' }]
	],
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

		// Check if parser is available (defensive programming)
		if (window.NativeBlocksParser && window.NativeBlocksParser.createServerContentRenderer) {
			return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps, PARSER_OPTIONS);
		}

		// Fallback if parser is not loaded
		return <div {...blockProps} dangerouslySetInnerHTML={{ __html: serverContent }} />;
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
