<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-settings-popup.bundle.css',
	'js' => 'dist/task-settings-popup.bundle.js',
	'rel' => [
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'tasks.v2.provider.service.deadline-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.state-service',
		'tasks.v2.core',
		'ui.switcher',
		'ui.vue3.components.switcher',
		'tasks.v2.lib.show-limit',
		'tasks.v2.component.elements.question-mark',
		'ui.forms',
		'main.core',
		'main.date',
		'ui.vue3.vuex',
		'ui.date-picker',
		'ui.vue3.components.rich-loc',
		'ui.system.typography.vue',
		'ui.system.input.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
	],
	'skip_core' => false,
];
