const useSafeNamespaces = require('../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/openlines-v2-content.js',
	output: 'dist/openlines-v2-content.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Content',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
