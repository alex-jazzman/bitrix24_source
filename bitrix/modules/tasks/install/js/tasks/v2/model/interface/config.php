<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/interface.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.timezone',
	],
	'skip_core' => false,
];
