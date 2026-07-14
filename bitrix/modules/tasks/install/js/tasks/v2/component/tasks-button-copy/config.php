<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-button-copy.bundle.css',
	'js' => 'dist/tasks-button-copy.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification-manager',
	],
	'skip_core' => true,
];
