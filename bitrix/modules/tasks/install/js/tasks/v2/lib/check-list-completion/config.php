<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/check-list-completion.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.check-list-completion-prompt',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.provider.service.task-service',
		'ui.notification-manager',
	],
	'skip_core' => false,
];
