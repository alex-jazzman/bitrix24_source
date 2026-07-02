export default {
	input: './src/style.css',
	output: {
		css: './dist/solid.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
