<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/apache-superset-dashboard-manager.bundle.css',
	'js' => 'dist/apache-superset-dashboard-manager.bundle.js',
	'rel' => [
		'biconnector.dashboard-export-master',
		'biconnector.dashboard-group',
		'biconnector.dashboard-related-items-list',
		'main.core',
		'main.core.events',
		'sidepanel',
		'ui.buttons',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
