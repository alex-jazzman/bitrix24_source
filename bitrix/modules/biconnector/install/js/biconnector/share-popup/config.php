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
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.date-picker',
		'ui.system.dialog',
		'ui.system.input',
	],
	'skip_core' => false,
];
