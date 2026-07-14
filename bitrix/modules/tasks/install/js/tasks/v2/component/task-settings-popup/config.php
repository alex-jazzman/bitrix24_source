<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-settings-popup.bundle.css',
	'js' => 'dist/task-settings-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.deadline-service',
		'tasks.v2.provider.service.state-service',
		'tasks.v2.provider.service.task-service',
		'ui.date-picker',
		'ui.forms',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.switcher',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-loc',
		'ui.vue3.components.switcher',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
