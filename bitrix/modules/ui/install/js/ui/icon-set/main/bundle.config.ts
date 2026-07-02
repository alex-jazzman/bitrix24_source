export default {
	input: './src/style.css',
	output: {
		css: './dist/main.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
