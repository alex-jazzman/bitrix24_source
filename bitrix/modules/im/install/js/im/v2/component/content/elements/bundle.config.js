const useSafeNamespaces = require('../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/registry.js',
	output: 'dist/registry.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Content',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
