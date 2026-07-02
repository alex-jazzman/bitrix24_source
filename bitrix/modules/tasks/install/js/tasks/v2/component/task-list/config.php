<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-list.bundle.css',
	'js' => 'dist/task-list.bundle.js',
	'rel' => [
		'tasks.v2.core',
		'main.core',
		'ui.vue3.vuex',
		'ui.notification-manager',
		'ui.system.menu.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.show-limit',
		'tasks.v2.application.task-card',
		'tasks.v2.component.fields.deadline',
		'tasks.v2.component.fields.responsible',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'tasks.v2.provider.service.status-service',
		'tasks.v2.const',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.application.gantt-popup',
		'tasks.v2.provider.service.relation-service',
		'ui.system.typography.vue',
		'ui.icon-set.api.vue',
		'ui.system.skeleton.vue',
	],
	'skip_core' => false,
];
