<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/replication.bundle.css',
	'js' => 'dist/replication.bundle.js',
	'rel' => [
		'ui.system.skeleton.vue',
		'tasks.v2.component.elements.field-add',
		'tasks.v2.component.elements.ui-tabs',
		'tasks.v2.component.elements.checkbox',
		'ui.vue3',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.component.elements.select',
		'ui.vue3.components.popup',
		'ui.system.input.vue',
		'tasks.v2.component.elements.radio',
		'ui.date-picker',
		'tasks.v2.lib.calendar',
		'tasks.v2.component.fields.deadline',
		'ui.vue3.components.rich-loc',
		'ui.system.menu.vue',
		'tasks.v2.component.elements.hover-pill',
		'ui.vue3.components.button',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.component.elements.bottom-sheet',
		'ui.system.typography.vue',
		'main.core',
		'main.core.events',
		'main.popup',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.id-utils',
		'main.date',
		'tasks.v2.lib.timezone',
		'tasks.v2.component.elements.hint',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.show-limit',
	],
	'skip_core' => false,
];
