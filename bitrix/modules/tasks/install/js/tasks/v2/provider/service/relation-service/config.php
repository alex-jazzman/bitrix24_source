<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/relation-service.bundle.css',
	'js' => 'dist/relation-service.bundle.js',
	'rel' => [
		'tasks.v2.provider.service.template-service',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.lib.id-utils',
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
