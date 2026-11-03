<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/duration.bundle.css',
	'js' => 'dist/duration.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
