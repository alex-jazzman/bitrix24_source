const useSafeNamespaces = require('../../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/recent-compact.js',
	output: 'dist/recent-compact.bundle.js',
	namespace: 'BX.Messenger.v2.Component.List',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
