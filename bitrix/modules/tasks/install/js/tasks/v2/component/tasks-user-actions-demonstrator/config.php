<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-user-actions-demonstrator.bundle.css',
	'js' => 'dist/tasks-user-actions-demonstrator.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.component.tasks-entities-demonstrator',
		'tasks.v2.component.elements.user-avatar',
		'tasks.v2.provider.service.user-service',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => true,
];
