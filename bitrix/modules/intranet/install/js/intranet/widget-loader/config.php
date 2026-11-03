<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/widget-loader.bundle.css',
	'js' => 'dist/widget-loader.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
	],
	'skip_core' => false,
];
