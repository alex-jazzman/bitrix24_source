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
		'tasks.v2.component.fields.placements',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
