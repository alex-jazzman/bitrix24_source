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
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.provider.service.file-service',
		'ui.bbcode.formatter.html-formatter',
		'ui.icon-set.api.vue',
		'ui.icon-set.editor',
		'ui.icon-set.outline',
		'ui.lexical.core',
		'ui.lexical.list',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.text-editor',
		'ui.uploader.core',
		'ui.vue3',
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
