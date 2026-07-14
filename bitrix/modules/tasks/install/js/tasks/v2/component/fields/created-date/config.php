<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/created-date.bundle.css',
	'js' => 'dist/created-date.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.tasks-button-copy',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];
