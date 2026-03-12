<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = [
	'css' => 'dist/task-full-card.bundle.css',
	'js' => 'dist/task-full-card.bundle.js',
	'rel' => [
		'main.sidepanel',
		'ui.vue3.mixins.loc-mixin',
		'ui.system.skeleton',
		'tasks.v2.lib.analytics',
		'tasks.v2.component.elements.field-list',
		'tasks.v2.component.elements.content-resizer',
		'tasks.v2.component.drop-zone',
		'tasks.v2.component.entity-text',
		'tasks.v2.component.user-fields-slider',
		'tasks.v2.component.fields.description',
		'tasks.v2.component.fields.creator',
		'tasks.v2.component.fields.responsible',
		'tasks.v2.component.fields.deadline',
		'tasks.v2.component.fields.status',
		'tasks.v2.component.fields.files',
		'tasks.v2.component.fields.check-list',
		'tasks.v2.component.fields.group',
		'tasks.v2.component.fields.flow',
		'tasks.v2.component.fields.accomplices',
		'tasks.v2.component.fields.auditors',
		'tasks.v2.component.fields.tags',
		'tasks.v2.component.fields.crm',
		'tasks.v2.component.fields.date-plan',
		'tasks.v2.component.fields.time-tracking',
		'tasks.v2.component.fields.sub-tasks',
		'tasks.v2.component.fields.parent-task',
		'tasks.v2.component.fields.related-tasks',
		'tasks.v2.component.fields.gantt',
		'tasks.v2.component.fields.results',
		'tasks.v2.component.fields.reminders',
		'tasks.v2.component.fields.replication',
		'tasks.v2.component.fields.email',
		'tasks.v2.component.fields.user-fields',
		'tasks.v2.component.fields.placements',
		'tasks.v2.component.fields.created-date',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.deadline-service',
		'tasks.v2.component.fields.title',
		'tasks.v2.component.fields.importance',
		'ui.notification-manager',
		'tasks.v2.lib.highlighter',
		'ui.system.chip.vue',
		'tasks.v2.core',
		'tasks.v2.component.add-task-button',
		'ui.vue3',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'tasks.v2.component.elements.hint',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.component.mark-task-button',
		'main.core.events',
		'ui.vue3.vuex',
		'ui.system.menu.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.application.task-card',
		'tasks.v2.const',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.lib.show-limit',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'tasks.v2.provider.service.status-service',
		'ui.vue3.components.button',
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];

if (ModuleManager::isModuleInstalled('im'))
{
	$config['rel'][] = 'im.public';
	$config['rel'][] = 'im.v2.application.integration.task';
	$config['rel'][] = 'im.v2.lib.menu';
}

return $config;
