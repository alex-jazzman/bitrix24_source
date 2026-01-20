<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/radio.bundle.css',
	'js' => 'dist/radio.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
