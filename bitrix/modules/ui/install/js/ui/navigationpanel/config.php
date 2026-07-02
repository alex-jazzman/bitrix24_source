<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	"css" => 'dist/navigationpanel.bundle.css',
	'js' => 'dist/navigationpanel.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.actions-bar',
		'ui.fonts.opensans',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.menu',
	],
	'skip_core' => false,
	'settings' => [
		'useAirDesign' => defined('AIR_SITE_TEMPLATE'),
	]
];
