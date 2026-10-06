module.exports = {
	input: 'src/index.js',
	output: 'dist/realtime.bundle.js',
	namespace: 'BX.Landing.Editor',
	dependencies: [
		'landing.realtime',
		'landing.main',
		'landing.pageobject',
		'landing.history',
		'main.core',
	],
	tests: {
		localization: {
			autoLoad: false,
		},
	},
};
