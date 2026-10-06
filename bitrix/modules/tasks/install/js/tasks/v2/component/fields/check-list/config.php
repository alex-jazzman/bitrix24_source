<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/check-list.bundle.css',
	'js' => 'dist/check-list.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.checkbox',
		'tasks.v2.component.elements.growing-text-area',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.progress-bar',
		'tasks.v2.component.elements.user-avatar-list',
		'tasks.v2.component.elements.user-checkbox',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.highlighter',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.task-service',
		'ui.bbcode.model',
		'ui.bbcode.parser',
		'ui.draganddrop.draggable',
		'ui.forms',
		'ui.icon-set.actions',
		'ui.icon-set.animated',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.system.skeleton.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
		'ui.vue3.components.popup',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
