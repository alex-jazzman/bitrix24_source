<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/background-dialog.bundle.js',
	'css' => './dist/background-dialog.bundle.css',
	'rel' => [
		'call.adapter.desktop-api',
		'call.adapter.utils',
		'main.core',
	],
	'skip_core' => false,
];
