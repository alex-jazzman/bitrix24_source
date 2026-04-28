<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/slider.bundle.css',
	'js' => 'dist/slider.bundle.js',
	'rel' => [
		'crm.ai.name-service',
		'crm.integration.ui.settings',
		'main.core',
		'ui.buttons',
		'ui.sidepanel',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];
