<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/deadline.bundle.css',
	'js' => 'dist/deadline.bundle.js',
	'rel' => [
		'main.core.events',
		'ui.notification-manager',
		'ui.vue3.directives.hint',
		'tasks.v2.component.task-settings-popup',
		'tasks.v2.component.elements.settings-label',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.lib.height-transition',
		'tasks.v2.provider.service.deadline-service',
		'ui.vue3.vuex',
		'ui.date-picker',
		'tasks.v2.core',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.timezone',
		'tasks.v2.lib.analytics',
		'tasks.v2.component.elements.hint',
		'ui.icon-set.api.vue',
		'ui.system.input.vue',
		'ui.icon-set.outline',
		'ui.vue3.components.button',
		'ui.forms',
		'ui.vue3.components.popup',
		'main.date',
		'ui.system.typography.vue',
		'ui.system.chip.vue',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.component.elements.duration',
		'tasks.v2.lib.calendar',
		'tasks.v2.provider.service.task-service',
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
