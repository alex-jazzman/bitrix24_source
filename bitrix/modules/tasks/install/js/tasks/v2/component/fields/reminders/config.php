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
		'tasks.v2.component.elements.bottom-sheet',
		'tasks.v2.component.elements.duration',
		'tasks.v2.component.elements.hint',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.reminders-service',
		'ui.date-picker',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
