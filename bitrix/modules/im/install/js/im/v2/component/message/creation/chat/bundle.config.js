const useSafeNamespaces = require('../../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/chat-creation.js',
	output: 'dist/chat-creation.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Message',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
