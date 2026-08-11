<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/desktop-api.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.desktop-api',
	],
	'skip_core' => true,
];
