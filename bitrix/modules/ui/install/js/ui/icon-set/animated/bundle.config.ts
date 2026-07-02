export default {
	input: './src/style.css',
	output: {
		css: './dist/animated.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
