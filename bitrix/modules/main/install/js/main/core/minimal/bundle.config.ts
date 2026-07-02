export default {
	input: './src/main.core.minimal.ts',
	output: './dist/main.core.minimal.bundle.js',
	namespace: 'BX',
	adjustConfigPhp: false,
	browserslist: true,
	transformClasses: [
		'EventEmitter',
		'BaseEvent',
		'OrderedArray',
	],
	concat: {
		js: [
			'../src/internal/wrap-start.js',
			'../../polyfill/core/dist/polyfill.bundle.js',
			'./dist/main.core.minimal.bundle.js',
			'../src/internal/wrap-end.js',
		],
	},
};
