<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/reminders.bundle.css',
	'js' => 'dist/reminders.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
	],
	'skip_core' => true,
];
