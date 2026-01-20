<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chat-action-service.bundle.css',
	'js' => 'dist/chat-action-service.bundle.js',
	'rel' => [
		'tasks.v2.lib.hint',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.core',
		'tasks.v2.provider.service.status-service',
		'main.core',
		'main.core.events',
		'tasks.v2.const',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => false,
];
