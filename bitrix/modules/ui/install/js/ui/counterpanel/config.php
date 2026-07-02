<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	"css" => 'dist/counterpanel.bundle.css',
	'js' => 'dist/counterpanel.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.actions-bar',
		'ui.cnt',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.menu',
	],
	'skip_core' => false,
	'settings' => [
		'useAirDesign' => defined('AIR_SITE_TEMPLATE'),
	],
];
