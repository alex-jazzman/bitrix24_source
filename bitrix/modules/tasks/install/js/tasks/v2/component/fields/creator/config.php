<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/creator.bundle.js',
	'rel' => [
		'tasks.v2.core',
		'tasks.v2.component.elements.participants',
		'tasks.v2.provider.service.task-service',
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
