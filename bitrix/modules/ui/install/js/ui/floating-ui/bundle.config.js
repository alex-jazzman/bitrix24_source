const importDts = require('./rollup-plugin-import-dts');

module.exports = {
	input: 'src/floating-ui.js',
	output: 'dist/floating-ui.bundle.js',
	namespace: 'BX.UI.FloatingUi',
	browserslist: true,
	resolveNodeModules: true,
	standalone: true,
	plugins: {
		custom: [
			importDts(),
		],
	},
};
