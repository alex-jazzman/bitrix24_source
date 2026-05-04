<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/results.bundle.css',
	'js' => 'dist/results.bundle.js',
	'rel' => [
		'ui.icon-set.animated',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.component.elements.hint',
		'tasks.v2.lib.highlighter',
		'ui.vue3',
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.user-avatar',
		'tasks.v2.component.elements.user-field-widget-component',
		'ui.system.skeleton.vue',
		'main.core.events',
		'tasks.v2.component.drop-zone',
		'tasks.v2.component.elements.bottom-sheet',
		'ui.text-editor',
		'tasks.v2.lib.calendar',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.entity-text',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'main.core',
		'ui.vue3.vuex',
		'ui.vue3.components.menu',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.show-limit',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.result-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.state-service',
		'tasks.v2.provider.service.user-service',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('disk'))
{
	$config['rel'][] = 'disk.uploader.user-field-widget';
	$config['rel'][] = 'disk.viewer.actions';
}

return $config;
