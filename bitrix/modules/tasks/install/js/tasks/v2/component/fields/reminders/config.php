<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/reminders.bundle.css',
	'js' => 'dist/reminders.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.bottom-sheet',
		'ui.date-picker',
		'ui.vue3.components.button',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.component.elements.duration',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.reminders-service',
		'ui.system.skeleton.vue',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
	],
	'skip_core' => false,
];
