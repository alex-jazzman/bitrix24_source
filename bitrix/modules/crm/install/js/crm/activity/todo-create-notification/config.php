<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/todo-create-notification.bundle.css',
	'js' => 'dist/todo-create-notification.bundle.js',
	'rel' => [
		'crm.activity.todo-editor-v2',
		'crm.activity.todo-notification-skip',
		'crm.activity.todo-notification-skip-menu',
		'crm_common',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];
