<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-popup.bundle.css',
	'js' => 'dist/ui-popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.popup',
	],
	'skip_core' => true,
];
