import importDts from './rollup-plugin-import-dts';

export default {
	input: 'src/index.js',
	output: 'prod/dist/lexical.prod.bundle.js',
	namespace: 'BX.UI.Lexical',
	browserslist: true,
	plugins: {
		custom: [
			importDts(),
		],
	},
	resolveNodeModules: true,
	adjustConfigPhp: false,
	sourceMaps: false,
	standalone: true,
	production: true,
};
