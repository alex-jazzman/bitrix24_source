<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/result-service.bundle.css',
	'js' => 'dist/result-service.bundle.js',
	'rel' => [
		'tasks.v2.provider.service.user-service',
		'main.core',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.entity-text',
	],
	'skip_core' => false,
];
