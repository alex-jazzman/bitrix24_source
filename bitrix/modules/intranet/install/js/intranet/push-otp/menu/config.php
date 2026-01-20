<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menu.bundle.css',
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'main.popup',
		'ui.avatar',
		'main.core',
		'ui.system.dialog',
		'ui.buttons',
		'ui.analytics',
	],
	'skip_core' => false,
];
