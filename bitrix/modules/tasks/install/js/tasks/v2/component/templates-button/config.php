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
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
	],
	'skip_core' => true,
];
