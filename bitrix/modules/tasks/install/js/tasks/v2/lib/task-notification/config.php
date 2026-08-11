<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/task-notification.bundle.js',
    'css' => './dist/task-notification.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'tasks.v2.application.task-card',
		'tasks.v2.const',
		'tasks.v2.lib.id-utils',
		'ui.notification-manager',
	],
    'skip_core' => false,
];
