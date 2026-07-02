export default {
	input: './src/index.ts',
	output: {
		js: './dist/disk-icon.bundle.js',
		css: './dist/disk-icon.bundle.css',
	},
	namespace: 'BX.UI.IconSet.Api.Disk',
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
	adjustConfigPhp: false,
};
