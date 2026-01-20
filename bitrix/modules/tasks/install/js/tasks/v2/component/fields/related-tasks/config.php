<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/related-tasks.bundle.js',
	'rel' => [
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.actions',
		'tasks.v2.const',
		'tasks.v2.provider.service.relation-service',
		'tasks.v2.component.fields.relation-tasks',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.relation-tasks-dialog',
	],
	'skip_core' => false,
];
