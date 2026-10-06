<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notice-popup.bundle.css',
	'js' => 'dist/notice-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.system.typography',
	],
	'skip_core' => false,
];
