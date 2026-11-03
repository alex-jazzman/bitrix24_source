<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/scheduled-view.bundle.js',
	'css' => './dist/scheduled-view.bundle.css',
	'rel' => [
		'mail.client.scheduled-message',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.small-outline',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
