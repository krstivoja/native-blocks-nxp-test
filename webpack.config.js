const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
	...defaultConfig,
	entry: {
		'native-blocks-npx/index': './src/native-blocks-npx/index.js',
		'native-blocks-npx/view': './src/native-blocks-npx/view.js',
		'native-ssr-inner/index': './src/native-ssr-inner/index.js',
		'native-ssr/index': './src/native-ssr/index.js',
	},
};
