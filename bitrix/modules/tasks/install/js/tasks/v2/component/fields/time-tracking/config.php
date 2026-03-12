<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/time-tracking.bundle.css',
	'js' => 'dist/time-tracking.bundle.js',
	'rel' => [
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.settings-label',
		'ui.switcher',
		'ui.vue3.components.switcher',
		'tasks.v2.provider.service.state-service',
		'tasks.v2.provider.service.status-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.user-avatar-list',
		'ui.dialogs.messagebox',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.highlighter',
		'tasks.v2.provider.service.time-tracking-service',
		'ui.system.input.vue',
		'ui.vue3.components.button',
		'ui.date-picker',
		'tasks.v2.lib.calendar',
		'main.date',
		'ui.system.typography.vue',
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.user-label',
		'tasks.v2.component.elements.hint',
		'tasks.v2.lib.timezone',
		'ui.system.skeleton.vue',
		'ui.vue3.components.popup',
		'ui.tooltip',
		'tasks.v2.component.elements.user-avatar',
		'main.core',
		'ui.vue3.vuex',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.show-limit',
	],
	'skip_core' => false,
];
