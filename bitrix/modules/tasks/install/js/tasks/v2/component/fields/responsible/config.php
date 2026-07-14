<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'lang' => BX_ROOT.'/components/bitrix/tasks.task.template/templates/.default/template.php',
	'css' => 'dist/responsible.bundle.css',
	'js' => 'dist/responsible.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'tasks.v2.component.absence-popup',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.participants',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.component.elements.user-avatar-list',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.switcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
