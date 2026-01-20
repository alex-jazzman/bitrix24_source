<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/parent-task.bundle.css',
	'js' => 'dist/parent-task.bundle.js',
	'rel' => [
		'ui.vue3.directives.hint',
		'ui.system.typography.vue',
		'tasks.v2.component.task-list',
		'tasks.v2.component.elements.hint',
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.relation-error',
		'tasks.v2.provider.service.relation-service',
		'tasks.v2.provider.service.task-service',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.id-utils',
	],
	'skip_core' => false,
];
