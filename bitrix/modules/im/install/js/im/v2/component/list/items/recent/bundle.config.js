const useSafeNamespaces = require('../../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/recent-list.js',
	output: 'dist/recent-list.bundle.js',
	namespace: 'BX.Messenger.v2.Component.List',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
