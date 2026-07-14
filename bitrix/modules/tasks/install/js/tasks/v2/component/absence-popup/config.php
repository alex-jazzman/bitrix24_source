<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/absence-popup.bundle.css',
	'js' => 'dist/absence-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'tasks.v2.component.elements.hint',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.calendar',
		'tasks.v2.provider.service.absence-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
