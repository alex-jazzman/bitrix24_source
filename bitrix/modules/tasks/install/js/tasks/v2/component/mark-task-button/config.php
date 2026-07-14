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
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.api.vue',
		'ui.system.menu',
		'ui.system.menu.vue',
	],
	'skip_core' => true,
];
