module.exports = {
	input: './src/pinia.js',
	types: './ui.vue3.pinia.d.ts',
	output: './dist/pinia.bundle.js',
	namespace: 'BX.Vue3.Pinia',
	concat: {
		js: [
			'./src/wrap/start.js',
			'./dist/pinia.bundle.js',
			'./src/wrap/end.js',
		],
	},
	browserslist: true,
};
