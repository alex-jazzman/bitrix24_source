export default {
	input: './src/index.ts',
	output: './dist/bitrixgpt-bi-announce.bundle.js',
	namespace: 'BX.BIConnector',
	// Raster illustration: copied next to the bundle instead of the default inlining, so the
	// layers stay separately cacheable and the css bundle keeps its size.
	cssImages: {
		type: 'copy',
	},
};
