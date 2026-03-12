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
		'ui.vue3',
		'ui.uploader.core',
		'tasks.v2.const',
		'main.core',
		'main.core.events',
		'ui.lexical.core',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.elements.user-field-widget-component',
		'ui.bbcode.formatter.html-formatter',
		'ui.system.typography.vue',
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.hint',
		'tasks.v2.core',
		'ui.system.menu.vue',
		'ui.icon-set.outline',
		'ui.icon-set.editor',
		'ui.text-editor',
		'ui.icon-set.api.vue',
		'ui.lexical.list',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
