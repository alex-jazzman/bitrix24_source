<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-entity-picker.bundle.css',
	'js' => 'dist/tasks-entity-picker.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.component.tasks-popup',
		'tasks.v2.lib.entity-selector-dialog',
	],
	'skip_core' => true,
];
