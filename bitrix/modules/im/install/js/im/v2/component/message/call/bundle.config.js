const useSafeNamespaces = require('../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/call-message.js',
	output: 'dist/call-message.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Message',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
