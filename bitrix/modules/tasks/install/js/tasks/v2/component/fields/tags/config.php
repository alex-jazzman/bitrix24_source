<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tags.bundle.css',
	'js' => 'dist/tags.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.entity-selector',
		'tasks.v2.component.elements.field-add',
		'tasks.v2.component.elements.field-hover-button',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];
