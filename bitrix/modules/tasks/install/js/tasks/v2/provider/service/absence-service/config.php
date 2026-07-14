<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/absence-service.bundle.css',
	'js' => 'dist/absence-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.calendar',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
