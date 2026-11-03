<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/market-demo-onboarding-popup.bundle.js',
	'css' => './dist/market-demo-onboarding-popup.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'main.sidepanel',
		'ui.analytics',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.info-helper',
		'ui.system.typography',
	],
	'skip_core' => false,
];
