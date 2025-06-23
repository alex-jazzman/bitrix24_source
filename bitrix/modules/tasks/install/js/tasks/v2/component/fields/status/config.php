<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/status.bundle.css',
	'js' => 'dist/status.bundle.js',
	'rel' => [
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.vue3.components.popup',
		'main.date',
		'tasks.v2.const',
		'main.core',
	],
	'skip_core' => false,
];
