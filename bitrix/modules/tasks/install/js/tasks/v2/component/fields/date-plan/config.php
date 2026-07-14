<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/date-plan.bundle.css',
	'js' => 'dist/date-plan.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.duration',
		'tasks.v2.component.elements.field-add',
		'tasks.v2.component.elements.field-hover-button',
		'tasks.v2.component.elements.field-list',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.show-limit',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.task-service',
		'ui.date-picker',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification-manager',
		'ui.switcher',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
	'skip_core' => false,
];
