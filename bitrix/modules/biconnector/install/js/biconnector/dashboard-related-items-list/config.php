<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dashboard-related-items-list.bundle.css',
	'js' => 'dist/dashboard-related-items-list.bundle.js',
	'rel' => [
		'main.core',
		'ui.icon-set.outline',
		'ui.design-tokens.air',
		'ui.system.typography',
		'ui.buttons',
	],
	'skip_core' => false,
];
