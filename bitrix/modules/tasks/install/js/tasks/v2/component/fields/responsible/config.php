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
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.component.elements.participants',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.analytics',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.const',
		'ui.vue3.directives.hint',
		'ui.system.typography.vue',
		'ui.switcher',
		'ui.vue3.components.switcher',
		'tasks.v2.component.elements.question-mark',
		'tasks.v2.component.elements.hint',
		'tasks.v2.lib.id-utils',
		'main.core',
		'ui.vue3',
		'tasks.v2.component.elements.user-avatar-list',
	],
	'skip_core' => false,
];
