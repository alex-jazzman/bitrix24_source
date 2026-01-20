<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/title.bundle.css',
	'js' => 'dist/title.bundle.js',
	'rel' => [
		'tasks.v2.component.elements.growing-text-area',
		'tasks.v2.provider.service.task-service',
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
