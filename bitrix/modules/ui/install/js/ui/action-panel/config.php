<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => './dist/action-panel.bundle.css',
	'js' => './dist/action-panel.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.a11y',
		'ui.buttons',
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
