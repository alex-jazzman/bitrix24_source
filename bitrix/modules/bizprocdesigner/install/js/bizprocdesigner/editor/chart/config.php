<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chart.bundle.css',
	'js' => 'dist/chart.bundle.js',
	'rel' => [
		'pull.client',
		'ui.loader',
		'ui.vue3.components.menu',
		'ui.vue3.directives.hint',
		'window',
		'ui.entity-selector',
		'main.popup',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.vue3.components.popup',
		'ui.feedback.form',
		'bizprocdesigner.feature',
		'ui.notification',
		'ui.block-diagram',
		'ui.vue3.components.button',
		'ui.icon-set.api.core',
		'main.core',
		'ui.buttons',
		'ui.system.dialog',
		'ui.icon-set.api.vue',
		'ui.vue3',
		'ui.vue3.pinia',
		'ui.icon-set.outline',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
