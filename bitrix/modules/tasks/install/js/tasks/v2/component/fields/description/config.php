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
		'main.core',
		'main.core.events',
		'tasks.v2.component.drop-zone',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.component.entity-text',
		'tasks.v2.component.tasks-popup-button-quote',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.promotion',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.task-service',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.text-editor',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
