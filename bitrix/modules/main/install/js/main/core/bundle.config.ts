export default {
	input: './src/core.ts',
	output: './core.js',
	namespace: 'BX',
	adjustConfigPhp: false,
	protected: true,
	browserslist: true,
	transformClasses: [
		'EventEmitter',
		'BaseEvent',
		'OrderedArray',
	],
	treeshake: {
		moduleSideEffects: (id: string) => {
			return id.includes('/internal/bx');
		},
	},
	concat: {
		js: [
			'./src/internal/wrap-start.js',
			'../polyfill/core/dist/polyfill.bundle.js',
			'./core.js',
			'./src/old/core.js',
			'./core_promise.js',
			'./core_ajax.js',

			'../lazyload/dist/lazyload.bundle.js',
			'../parambag/dist/parambag.bundle.js',
			'../fixfontsize/dist/fixfontsize.bundle.js',
			'./src/internal/wrap-end.js',
		],
	},
	rebuild: [
		'main.core.minimal',
	],
};
