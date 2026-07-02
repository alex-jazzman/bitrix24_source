<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-entities-demonstrator.bundle.css',
	'js' => 'dist/tasks-entities-demonstrator.bundle.js',
	'rel' => [
		'main.polyfill.intersectionobserver',
		'main.core',
		'tasks.v2.component.tasks-popup',
		'tasks.v2.component.tasks-entities-picker',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
