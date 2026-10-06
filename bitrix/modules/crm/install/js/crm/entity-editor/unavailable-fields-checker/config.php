<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/unavailable-fields-checker.bundle.css',
	'js' => 'dist/unavailable-fields-checker.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens.air',
	],
	'skip_core' => false,
];
