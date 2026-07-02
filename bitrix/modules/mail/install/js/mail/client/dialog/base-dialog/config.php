<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/base-dialog.bundle.css',
	'js' => 'dist/base-dialog.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
	],
	'lang' => 'lang/ru/config.php',
	'skip_core' => false,
];
