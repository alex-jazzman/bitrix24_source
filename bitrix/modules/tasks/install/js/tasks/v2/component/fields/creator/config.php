<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/creator.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.participants',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => false,
];
