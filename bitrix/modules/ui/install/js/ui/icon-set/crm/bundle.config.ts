export default {
	input: './src/style.css',
	output: {
		css: './dist/crm.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
