<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/cell-service.bundle.css',
	'js' => 'dist/cell-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
