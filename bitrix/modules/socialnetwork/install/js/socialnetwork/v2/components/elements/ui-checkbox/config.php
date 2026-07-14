<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-checkbox.bundle.css',
	'js' => 'dist/ui-checkbox.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
