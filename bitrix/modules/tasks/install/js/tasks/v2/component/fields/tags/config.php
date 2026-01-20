<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tags.bundle.css',
	'js' => 'dist/tags.bundle.js',
	'rel' => [
		'tasks.v2.component.elements.add-button',
		'tasks.v2.component.elements.field-add',
		'main.core',
		'main.core.events',
		'tasks.entity-selector',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
	],
	'skip_core' => false,
];
