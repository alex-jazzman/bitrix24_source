<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/todo-notification-skip-menu.bundle.js',
	'rel' => [
		'crm.activity.todo-notification-skip',
		'crm_common',
		'main.core',
		'main.popup',
	],
	'skip_core' => false,
];
