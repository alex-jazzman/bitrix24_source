<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-loader.bundle.css',
	'js' => 'dist/ui-loader.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.loader',
	],
	'skip_core' => true,
];
