<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/loader.bundle.js',
	'css' => './dist/loader.bundle.css',
	'rel' => [
		'main.core',
		'ui.loader',
	],
	'skip_core' => false,
];
