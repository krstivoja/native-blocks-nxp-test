import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import './editor.scss';

export default function Edit() {
	return (
		<p { ...useBlockProps() }>
			{ __(
				'AAA First block – hello from the editor!',
				'native-blocks-npx'
			) }
		</p>
	);
}
