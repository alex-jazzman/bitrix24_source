const useSafeNamespaces = require('../../../build-tools/use-safe-namespaces');

module.exports = {
	input: './src/call.js',
	output: './dist/call.bundle.js',
	namespace: 'BX.Messenger.v2.Lib',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
