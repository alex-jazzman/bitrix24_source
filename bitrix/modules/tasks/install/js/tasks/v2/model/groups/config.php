<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/groups.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
		'tasks.v2.provider.service.group-service',
	],
	'skip_core' => true,
];
