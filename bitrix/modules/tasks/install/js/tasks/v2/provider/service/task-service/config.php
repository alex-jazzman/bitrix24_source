<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/task-service.bundle.js',
	'rel' => [
		'tasks.v2.component.fields.replication',
		'main.core',
		'main.core.events',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.template-service',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.relation-service',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.provider.service.reminders-service',
		'tasks.v2.provider.service.result-service',
		'tasks.v2.component.fields.user-fields',
		'tasks.v2.core',
		'tasks.v2.provider.service.group-service',
		'tasks.v2.provider.service.flow-service',
		'tasks.v2.provider.service.user-service',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
