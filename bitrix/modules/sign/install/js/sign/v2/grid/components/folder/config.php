<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/folder.bundle.js',
	'css' => 'dist/folder.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
