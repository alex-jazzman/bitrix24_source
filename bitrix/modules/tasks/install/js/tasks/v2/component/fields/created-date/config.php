<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/created-date.bundle.css',
	'js' => 'dist/created-date.bundle.js',
	'rel' => [
		'ui.notification-manager',
		'ui.system.typography.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.lib.calendar',
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
