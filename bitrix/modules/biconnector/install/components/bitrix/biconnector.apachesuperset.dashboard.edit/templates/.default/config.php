<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'script.css',
	'js' => 'script.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'biconnector.dashboard-parameters-selector',
		'biconnector.apache-superset-analytics',
		'ui.buttons',
		'ui.text-editor',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
	],
	'skip_core' => false,
];
