<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/lock-popup.bundle.js',
	'css' => './dist/lock-popup.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.banner-dispatcher',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.system.dialog',
		'ui.system.typography',
	],
	'skip_core' => false,
];
