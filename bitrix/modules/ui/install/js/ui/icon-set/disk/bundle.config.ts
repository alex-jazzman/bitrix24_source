export default {
	input: './src/style.css',
	output: {
		css: './dist/disk.bundle.css',
	},
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
