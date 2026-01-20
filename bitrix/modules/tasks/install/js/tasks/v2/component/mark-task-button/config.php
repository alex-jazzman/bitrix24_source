<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mark-task-button.bundle.css',
	'js' => 'dist/mark-task-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.system.menu',
		'ui.icon-set.api.vue',
		'ui.system.menu.vue',
		'tasks.v2.core',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.const',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.lib.show-limit',
	],
	'skip_core' => true,
];
