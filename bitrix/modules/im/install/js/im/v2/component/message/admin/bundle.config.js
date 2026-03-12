const useSafeNamespaces = require('../../../../build-tools/use-safe-namespaces');

module.exports = {
	input: 'src/admin.js',
	output: 'dist/admin.bundle.js',
	namespace: 'BX.IM.V2.Component.Message',
	browserslist: true,
	plugins: {
		custom: [
			useSafeNamespaces(),
		],
	},
};
