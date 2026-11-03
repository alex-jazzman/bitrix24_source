module.exports = {
	input: 'src/index.js',
	output: 'dist/dashboard-group.bundle.js',
	namespace: 'BX.BIConnector',
	minification: false,
	sourceMaps: true,
	// This CSS loads on every BI page, while its only image shows in an opened popup
	// with an empty group: keep it an external file instead of inlined base64.
	cssImages: { type: 'copy' },
};
