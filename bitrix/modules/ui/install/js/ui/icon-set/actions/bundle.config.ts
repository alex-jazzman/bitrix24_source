export default {
	input: './src/style.css',
	output: {
		css: './dist/actions.bundle.css',
	},
	cssImages: {
		type: 'copy',
		absolutePaths: true,
	},
	adjustConfigPhp: false,
};
