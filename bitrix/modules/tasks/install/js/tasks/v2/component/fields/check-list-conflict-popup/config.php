<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/check-list-conflict-popup.bundle.css',
	'js' => 'dist/check-list-conflict-popup.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.provider.service.task-service',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
