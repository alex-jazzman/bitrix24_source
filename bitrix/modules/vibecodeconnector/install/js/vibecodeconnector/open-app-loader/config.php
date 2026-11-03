<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/open-app-loader.bundle.js',
	'css' => './dist/open-app-loader.bundle.css',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
