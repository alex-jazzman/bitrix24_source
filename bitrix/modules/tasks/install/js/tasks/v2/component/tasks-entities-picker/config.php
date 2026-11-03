<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-entities-picker.bundle.css',
	'js' => 'dist/tasks-entities-picker.bundle.js',
	'rel' => [
		'main.core',
		'main.polyfill.intersectionobserver',
		'tasks.v2.component.tasks-popup',
		'ui.a11y',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
