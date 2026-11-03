<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/share-popup.bundle.js',
	'css' => 'dist/share-popup.bundle.css',
	'rel' => [
		'biconnector.apache-superset-analytics',
		'biconnector.error-message',
		'main.core',
		'main.core.events',
		'main.date',
		'ui.buttons',
		'ui.date-picker',
		'ui.notification',
		'ui.system.dialog',
		'ui.system.input',
	],
	'skip_core' => false,
];
