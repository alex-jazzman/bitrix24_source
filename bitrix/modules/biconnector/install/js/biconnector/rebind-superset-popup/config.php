<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/rebind-superset-popup.bundle.js',
	'rel' => [
		'biconnector.card-select-popup',
		'main.core',
	],
	'skip_core' => false,
];
