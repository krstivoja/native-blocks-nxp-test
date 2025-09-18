import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import './style.scss';
import './editor.scss';
import metadata from './block.json';

function Edit() {
	return (
		<div { ...useBlockProps() }>
			<ServerSideRender 
				block="nbnpx/native-ssr"
			/>	
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save() {
		return null;
	},
} );
