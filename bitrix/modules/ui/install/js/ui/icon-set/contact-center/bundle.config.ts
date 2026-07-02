export default {
	input: './src/style.css',
	output: {
		css: './dist/contact-center.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
