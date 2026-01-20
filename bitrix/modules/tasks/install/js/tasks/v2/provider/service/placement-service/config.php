<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placement-service.bundle.css',
	'js' => 'dist/placement-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.component.fields.placements',
	],
	'skip_core' => true,
];
