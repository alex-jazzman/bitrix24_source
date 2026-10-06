module.exports = {
	input: './src/js/index.js',
	// style.css is handwritten, not a build output: keep it out of 'output'
	output: {
		js: './script.js',
	},
	namespace: 'BX.Landing.Component',
	adjustConfigPhp: false,
};