<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/migration-progress-panel.bundle.js',
	'css' => './dist/migration-progress-panel.bundle.css',
	'rel' => [
		'mail.migration-state',
		'main.core',
		'main.date',
		'main.popup',
		'ui.buttons',
		'ui.a11y',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.vue3',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.tooltip',
		'ui.system.tooltip.vue',
		'ui.system.typography',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
