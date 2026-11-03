export default {
	input: './src/index.ts',
	output: {
		js: './dist/apache-superset-dashboard-demo.bundle.js',
		css: './dist/apache-superset-dashboard-demo.bundle.css',
	},
	namespace: 'BX.BIConnector.ApacheSuperset.Dashboard',
	minification: false,
	sourceMaps: false,
	// The hint illustration (5.6 KB) is shown on demand, so it must stay an external file.
	// The threshold is kept above the 1.6 KB state icon, which is still worth inlining.
	cssImages: { maxSize: 5 },
};
