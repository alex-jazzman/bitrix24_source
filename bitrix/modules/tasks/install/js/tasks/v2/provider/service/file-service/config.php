<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'js' => 'dist/file-service.bundle.js',
	'rel' => [
		'main.core.events',
		'ui.uploader.core',
		'ui.uploader.vue',
		'ui.vue3',
		'ui.notification-manager',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'main.core',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
