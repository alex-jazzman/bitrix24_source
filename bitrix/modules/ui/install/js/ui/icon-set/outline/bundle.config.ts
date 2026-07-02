export default {
	input: './src/style.css',
	output: {
		css: './dist/outline.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
