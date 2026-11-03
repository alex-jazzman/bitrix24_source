export default {
	input: 'src/dataset-import-v2.ts',
	output: 'dist/dataset-import-v2.bundle.js',
	namespace: 'BX.BIConnector.DatasetImportV2',
	browserslist: true,
	// Illustrations here belong to states shown after a user action (error/success popups,
	// selected file chip): keep them external instead of inlining into render-blocking CSS.
	cssImages: { type: 'copy' },
};
