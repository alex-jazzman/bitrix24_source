export default {
	input: './src/style.css',
	output: {
		css: './dist/editor.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
