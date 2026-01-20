<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/entity-text.bundle.css',
	'js' => 'dist/entity-text.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.vue3',
		'ui.uploader.core',
		'ui.lexical.core',
		'tasks.v2.core',
		'tasks.v2.const',
		'ui.text-editor',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.elements.user-field-widget-component',
		'ui.bbcode.formatter.html-formatter',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
