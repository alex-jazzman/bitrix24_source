<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-popup-button-quote.bundle.css',
	'js' => 'dist/tasks-popup-button-quote.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.tasks-popup',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
