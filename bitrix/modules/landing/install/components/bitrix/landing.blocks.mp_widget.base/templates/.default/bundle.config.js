module.exports = {
	input: './src/js/index.js',
	output: {
		js: './script.js',
		css: './style.css',
	},
	namespace: 'BX.Landing.Widget',
	adjustConfigPhp: true,
	// BX.Landing.Widget.Base is extended by every mp_widget template script, and most of those
	// bundles are still built as ES5: they call the base constructor as a function, which a native
	// class refuses. The opposite pair works, so ES5 is the only output both generations accept.
	targets: ['ie 11'],
};
