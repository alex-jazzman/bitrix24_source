<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-list.bundle.css',
	'js' => 'dist/task-list.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.application.gantt-popup',
		'tasks.v2.application.task-card',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.fields.deadline',
		'tasks.v2.component.fields.responsible',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.relation-service',
		'tasks.v2.provider.service.status-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification-manager',
		'ui.system.menu.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
