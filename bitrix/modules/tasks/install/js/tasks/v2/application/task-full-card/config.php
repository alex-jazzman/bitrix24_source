<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-full-card.bundle.css',
	'js' => 'dist/task-full-card.bundle.js',
	'rel' => [
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'tasks.v2.application.task-card',
		'tasks.v2.component.elements.chip',
		'tasks.v2.component.elements.field-list',
		'tasks.v2.component.fields.title',
		'tasks.v2.component.fields.importance',
		'tasks.v2.component.fields.description',
		'tasks.v2.component.fields.creator',
		'tasks.v2.component.fields.deadline',
		'tasks.v2.component.fields.status',
		'tasks.v2.component.fields.files',
		'tasks.v2.component.fields.check-list',
		'tasks.v2.component.fields.group',
		'tasks.v2.component.fields.flow',
		'tasks.v2.component.fields.accomplices',
		'tasks.v2.component.fields.auditors',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.provider.service.check-list-service',
		'main.core.events',
		'im.public',
		'im.v2.application.integration.task',
		'tasks.v2.core',
		'tasks.v2.component.add-task-button',
		'ui.vue3.components.button',
		'main.core',
		'ui.vue3.vuex',
		'ui.vue3.components.menu',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.component.fields.responsible',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => false,
];
