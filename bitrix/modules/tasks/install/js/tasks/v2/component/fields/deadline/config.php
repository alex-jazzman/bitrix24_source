<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/deadline.bundle.css',
	'js' => 'dist/deadline.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'tasks.v2.component.elements.duration',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.component.elements.settings-label',
		'tasks.v2.component.task-settings-popup',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.height-transition',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.deadline-service',
		'tasks.v2.provider.service.task-service',
		'ui.date-picker',
		'ui.forms',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification-manager',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
