<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/importance.bundle.css',
	'js' => 'dist/importance.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.directives.hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.component.elements.hint',
	],
	'skip_core' => true,
];
