<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/relation-tasks.bundle.css',
	'js' => 'dist/relation-tasks.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.task-list',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.system.chip.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
