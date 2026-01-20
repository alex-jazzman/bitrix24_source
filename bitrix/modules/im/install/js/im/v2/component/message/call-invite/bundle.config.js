const useSafeNamespaces = require('../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/call-invite.js',
	output: 'dist/call-invite.bundle.js',
	namespace: 'BX.Messenger.v2.Component.Message',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
