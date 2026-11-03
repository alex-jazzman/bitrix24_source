export default {
	input: './src/index.ts',
	output: './dist/chart-analysis.bundle.js',
	namespace: 'BX.BIConnector',
	// ui.info-helper, ui.buttons and biconnector.* extensions are pulled by Runtime.loadExtension on demand.
	dependencies: [
		'main.core',
		'pull.client',
		'ui.analytics',
		'ui.notification',
	],
};
