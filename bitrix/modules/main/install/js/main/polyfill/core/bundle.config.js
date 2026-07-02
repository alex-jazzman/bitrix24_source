module.exports = {
	input: 'src/polyfill.js',
	output: 'dist/polyfill.bundle.js',
	concat: {
		js: [
			'./lib/babel-external-helpers.js',
			'./lib/babel-regenerator-runtime.js',
			'./lib/alert-message.js',
		],
	},
	plugins: {
		resolve: true,
	},
	namespaceFunction: null,
	protected: true,
	adjustConfigPhp: false,
	browserslist: true,
};
