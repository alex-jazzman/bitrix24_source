<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chart.bundle.css',
	'js' => 'dist/chart.bundle.js',
	'rel' => [
		'bizproc.automation',
		'bizprocdesigner.feature',
		'main.core',
		'main.core.events',
		'main.popup',
		'pull.client',
		'ui.block-diagram',
		'ui.buttons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.feedback.form',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.loader',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.system.dialog',
		'ui.system.input',
		'ui.system.menu.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
		'ui.vue3.components.popup',
		'ui.vue3.directives.hint',
		'ui.vue3.pinia',
		'window',
	],
	'skip_core' => false,
];
