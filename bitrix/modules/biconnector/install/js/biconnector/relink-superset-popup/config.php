<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/relink-superset-popup.bundle.css',
	'js' => 'dist/relink-superset-popup.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.dialog',
		'ui.buttons',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
