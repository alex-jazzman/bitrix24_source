<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deadline-picker-host.bundle.js',
    'css' => './dist/deadline-picker-host.bundle.css',
    'rel' => [
		'main.core',
		'tasks.v2.component.fields.deadline',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.deadline-rules',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.task-service',
		'ui.notification-manager',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
	],
    'skip_core' => false,
];
