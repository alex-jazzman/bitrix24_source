export default {
	input: './src/index.ts',
	output: './dist/ai-digest-setup.bundle.js',
	namespace: 'BX.BIConnector',
	// Only the statically imported extensions belong here: bizproc.setup-template, ui.buttons,
	// ui.icon-set.api.core, ui.info-helper, ui.notification and ui.system.popups.whats-new are pulled by
	// Runtime.loadExtension on demand, and declaring them would turn that lazy load into a hard rel dependency.
	dependencies: [
		'main.core',
		'ui.banner-dispatcher',
	],
};
