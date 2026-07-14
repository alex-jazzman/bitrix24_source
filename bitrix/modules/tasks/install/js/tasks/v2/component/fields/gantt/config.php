<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/gantt-tasks.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.application.gantt-popup',
		'tasks.v2.component.fields.relation-tasks',
		'tasks.v2.const',
		'tasks.v2.provider.service.relation-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
