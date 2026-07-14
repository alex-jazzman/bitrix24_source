<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sub-tasks.bundle.css',
	'js' => 'dist/sub-tasks.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.fields.relation-tasks',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.relation-tasks-dialog',
		'tasks.v2.provider.service.relation-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
