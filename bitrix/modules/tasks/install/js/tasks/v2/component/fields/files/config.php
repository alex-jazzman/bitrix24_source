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
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.hint',
		'main.core',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.drop-zone',
		'main.sidepanel',
		'tasks.v2.component.fields.group',
		'ui.uploader.core',
		'ui.system.chip.vue',
		'ui.icon-set.animated',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.analytics',
		'ui.vue3.components.popup',
		'ui.vue3.components.button',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.elements.user-field-widget-component',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
