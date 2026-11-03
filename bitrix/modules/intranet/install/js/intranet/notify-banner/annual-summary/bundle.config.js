module.exports = {
	input: 'src/index.js',
	output: 'dist/annual-summary.bundle.js',
	namespace: 'BX.Intranet.NotifyBanner',
	browserslist: true,
	cssImages: {
		type: 'copy',
		output: './annual-summary',
	},
};
