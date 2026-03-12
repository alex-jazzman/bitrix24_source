<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/templates-button.bundle.css',
	'js' => 'dist/templates-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'ui.system.typography.vue',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.lib.entity-selector-dialog',
	],
	'skip_core' => true,
];
