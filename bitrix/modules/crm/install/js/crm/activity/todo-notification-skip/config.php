<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/todo-notification-skip.bundle.js',
	'rel' => [
		'ls',
		'main.core',
		'main.core.events',
		'ui.notification',
	],
	'skip_core' => false,
];
