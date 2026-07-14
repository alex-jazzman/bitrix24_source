<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/users.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.const',
		'tasks.v2.provider.service.user-service',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
