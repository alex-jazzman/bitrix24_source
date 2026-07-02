<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/restore-superset-popup.bundle.css',
	'js' => 'dist/restore-superset-popup.bundle.js',
	'rel' => [
		'biconnector.card-select-popup',
		'main.core',
	],
	'skip_core' => false,
];
