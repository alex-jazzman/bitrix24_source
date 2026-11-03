module.exports = {
	input: 'src/detail.js',
	output: {
		js: './script.js',
	},
	namespace: 'BX.BIConnector.ApacheSuperset.Dashboard',
	dependencies: [
		'biconnector.ai-digest-setup',
	],
	adjustConfigPhp: false,
	minification: false,
	sourceMaps: false,
};
