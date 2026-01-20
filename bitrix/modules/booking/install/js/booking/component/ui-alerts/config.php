<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-alerts.bundle.css',
	'js' => 'dist/ui-alerts.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.alerts',
	],
	'skip_core' => true,
];
