<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/duration.bundle.css',
	'js' => 'dist/duration.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.date',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
	],
	'skip_core' => true,
];
