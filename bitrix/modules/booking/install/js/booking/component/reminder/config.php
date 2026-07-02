<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/reminder.bundle.css',
	'js' => 'dist/reminder.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
