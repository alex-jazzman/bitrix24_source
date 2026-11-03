<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/groups.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
