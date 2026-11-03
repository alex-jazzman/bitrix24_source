<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deadline-rules.bundle.js',
    'css' => './dist/deadline-rules.bundle.css',
    'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.deadline-service',
		'tasks.v2.provider.service.task-service',
	],
    'skip_core' => false,
];
