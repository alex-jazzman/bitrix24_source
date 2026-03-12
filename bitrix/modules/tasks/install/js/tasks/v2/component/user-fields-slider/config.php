<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-fields-slider.bundle.css',
	'js' => 'dist/user-fields-slider.bundle.js',
	'rel' => [
		'main.core',
		'ui.notification-manager',
		'tasks.v2.lib.id-utils',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'tasks.v2.component.fields.user-fields',
	],
	'skip_core' => false,
];
