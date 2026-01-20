<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/check-list-service.bundle.css',
	'js' => 'dist/check-list-service.bundle.js',
	'rel' => [
		'tasks.v2.model.users',
		'tasks.v2.provider.service.user-service',
		'main.core',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => false,
];
