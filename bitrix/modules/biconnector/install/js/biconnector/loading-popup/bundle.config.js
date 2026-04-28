module.exports = {
	input: 'src/loading-popup.js',
	output: 'dist/loading-popup.bundle.js',
	namespace: 'BX.Biconnector',
	sourceMaps: false,
	dependencies: [
		'main.core',
		'ui.system.dialog',
		'ui.system.typography',
	],
};
