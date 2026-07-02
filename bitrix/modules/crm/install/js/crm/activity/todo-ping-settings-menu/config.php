<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/todo-ping-settings-menu.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.hint',
	],
	'skip_core' => false,
];
