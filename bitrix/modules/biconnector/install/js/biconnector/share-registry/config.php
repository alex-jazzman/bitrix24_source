<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/share-registry.bundle.css',
	'js' => 'dist/share-registry.bundle.js',
	'rel' => [
		'biconnector.apache-superset-dashboard-manager',
		'biconnector.error-message',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.buttons',
		'ui.hint',
		'ui.notification',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
