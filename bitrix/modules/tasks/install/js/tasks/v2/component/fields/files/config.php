<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/files.bundle.css',
	'js' => 'dist/files.bundle.js',
	'rel' => [
		'main.core',
		'main.sidepanel',
		'tasks.v2.component.drop-zone',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.const',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.file-service',
		'ui.icon-set.animated',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.uploader.core',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
