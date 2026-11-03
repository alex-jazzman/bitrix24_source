<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/apache-superset-dashboard-selector.bundle.css',
	'js' => 'dist/apache-superset-dashboard-selector.bundle.js',
	'rel' => [
		'biconnector.apache-superset-dashboard-manager',
		'biconnector.error-message',
		'main.core',
		'main.core.events',
		'ui.entity-selector',
		'ui.info-helper',
		'ui.notification',
	],
	'skip_core' => false,
];
