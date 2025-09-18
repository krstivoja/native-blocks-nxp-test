const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
	...defaultConfig,
	entry: {
		'native-blocks-npx/index': './src/native-blocks-npx/index.js',
		'native-blocks-npx/view': './src/native-blocks-npx/view.js',
		'native-ssr/index': './src/native-ssr/index.js',
		'native-ssr-and-inner/index': './src/native-ssr-and-inner/index.js',
	},
};
