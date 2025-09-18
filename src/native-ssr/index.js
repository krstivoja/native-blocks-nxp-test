import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { createServerContentRenderer } from '../shared';
import './style.scss';
import './editor.scss';
import metadata from './block.json';

function Edit() {
	const [serverContent, setServerContent] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const blockProps = useBlockProps();

	useEffect(() => {
		const postId = wp.data.select('core/editor').getCurrentPostId() || 0;

		wp.apiFetch({
			path: '/wp/v2/block-renderer/nbnpx/native-ssr?context=edit',
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

	if (isLoading) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Use the shared parser to render server content
	// This block doesn't have InnerBlocks, so it will just render the content as-is
	return createServerContentRenderer(serverContent, blockProps);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		return null;
	},
} );
