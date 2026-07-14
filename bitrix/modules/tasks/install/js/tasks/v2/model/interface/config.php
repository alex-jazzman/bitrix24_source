<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/interface.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.timezone',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
