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
		'main.core',
		'main.core.events',
		'tasks.v2.component.drop-zone',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.user-avatar',
		'tasks.v2.component.elements.user-field-widget-component',
		'tasks.v2.component.entity-text',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.highlighter',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.result-service',
		'tasks.v2.provider.service.state-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.user-service',
		'ui.icon-set.animated',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.text-editor',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
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
