export default {
	input: './src/index.ts',
	output: './dist/illustration.bundle.js',
	namespace: 'BX.UI.System.Illustration',
	cssImages: {
		absolutePaths: true,
		type: 'copy',
	},
};
