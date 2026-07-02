<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/silent-mode.bundle.css',
	'js' => 'dist/silent-mode.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
