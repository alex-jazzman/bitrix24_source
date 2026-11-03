<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menu.bundle.css',
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.analytics',
		'ui.avatar',
		'ui.buttons',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
