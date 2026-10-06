export default {
	input: './src/index.ts',
	output: {
		js: './dist/action-panel.bundle.js',
		css: './dist/action-panel.bundle.css',
	},
	namespace: 'BX.UI',
	transformClasses: true,
};
