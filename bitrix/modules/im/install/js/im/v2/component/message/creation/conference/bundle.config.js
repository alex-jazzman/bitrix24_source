const useSafeNamespaces = require('../../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/conference-creation.js',
	output: 'dist/conference-creation.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Message',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
