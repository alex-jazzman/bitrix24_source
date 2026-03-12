<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/description.bundle.css',
	'js' => 'dist/description.bundle.js',
	'rel' => [
		'ui.vue3.components.button',
		'main.core.events',
		'ui.dialogs.messagebox',
		'tasks.v2.const',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.drop-zone',
		'main.core',
		'ui.text-editor',
		'tasks.v2.core',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.entity-text',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
