<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/manager.bundle.css',
	'js' => 'dist/manager.bundle.js',
	'rel' => [
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
		'ui.icon-set.outline',
		'ui.tour',
	],
	'skip_core' => false,
];
