<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/share-ban-dialog.bundle.css',
	'js' => 'dist/share-ban-dialog.bundle.js',
	'rel' => [
		'biconnector.error-message',
		'main.core',
		'main.loader',
		'ui.buttons',
		'ui.notification',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
