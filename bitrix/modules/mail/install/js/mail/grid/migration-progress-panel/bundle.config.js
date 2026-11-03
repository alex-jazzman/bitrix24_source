module.exports = {
	input: './src/export.js',
	output: './dist/migration-progress-panel.bundle.js',
	namespace: 'BX.Mail.Grid',
	// Keep namespace-owning extensions before bundles that extend their namespaces.
	adjustConfigPhp: false,
};
