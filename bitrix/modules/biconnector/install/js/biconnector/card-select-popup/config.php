<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/card-select-popup.bundle.css',
	'js' => 'dist/card-select-popup.bundle.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.design-tokens',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
