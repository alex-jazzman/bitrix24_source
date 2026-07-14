<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/calendar-integration.bundle.css',
	'js' => 'dist/calendar-integration.bundle.js',
	'rel' => [
		'main.core',
		'ui.switcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.switcher',
	],
	'skip_core' => false,
];
