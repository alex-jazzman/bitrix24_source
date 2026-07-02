import importDts from './rollup-plugin-import-dts';

export default {
	input: 'src/index.js',
	output: 'prod/dist/lexical.prod.bundle.min.js',
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
	minification: {
		mangle: true,
		enclose: false,
		keep_classnames: false,
		keep_fnames: false,
		ie8: false,
		module: false,
		nameCache: null,
		safari10: false,
		toplevel: false,
	},
};
