export default {
	input: './src/style.css',
	output: {
		css: './dist/social.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
