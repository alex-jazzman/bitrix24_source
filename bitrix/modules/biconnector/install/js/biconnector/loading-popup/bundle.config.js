module.exports = {
	input: 'src/loading-popup.js',
	output: 'dist/loading-popup.bundle.js',
	namespace: 'BX.BIConnector',
	sourceMaps: false,
	dependencies: [
		'main.core',
		'ui.system.dialog',
		'ui.system.typography',
	],
	minification: false,
};
