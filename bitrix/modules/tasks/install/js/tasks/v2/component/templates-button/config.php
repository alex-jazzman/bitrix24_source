<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/templates-button.bundle.css',
	'js' => 'dist/templates-button.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.task-model',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.template-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.menu.vue',
	],
	'skip_core' => false,
];
