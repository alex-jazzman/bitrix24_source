<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/preview.bundle.css',
	'js' => 'dist/preview.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
