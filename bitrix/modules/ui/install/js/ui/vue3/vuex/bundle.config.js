module.exports = {
	input: './src/vuex.js',
	types: './ui.vue3.vuex.d.ts',
	output: './dist/vuex.bundle.js',
	namespace: 'BX.Vue3.Vuex',
	concat: {
		js: [
			'./src/wrap/start.js',
			'./dist/vuex.bundle.js',
			'./src/wrap/end.js',
		],
	},
	browserslist: true,
};
