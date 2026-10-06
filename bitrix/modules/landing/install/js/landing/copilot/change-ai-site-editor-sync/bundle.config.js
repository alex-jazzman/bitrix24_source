module.exports = {
	input: 'src/change-ai-site-editor-sync.js',
	output: 'dist/change-ai-site-editor-sync.bundle.js',
	namespace: 'BX.Landing.Copilot',
	adjustConfigPhp: false,
	dependencies: [
		'main.core',
		'main.core.events',
		'landing.copilot.generation-observer',
		'landing.tailwind.runtimesync',
		'landing.env',
		'landing.main',
		'landing.pageobject',
		'landing.backend',
		'landing.history',
	],
	tests: {
		localization: {
			autoLoad: false,
		},
	},
};
