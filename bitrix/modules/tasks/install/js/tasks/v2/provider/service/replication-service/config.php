<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/replication-service.bundle.css',
	'js' => 'dist/replication-service.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.v2.component.fields.replication',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.task-notification',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.provider.service.reminders-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'ui.notification-manager',
	],
	'skip_core' => false,
];
