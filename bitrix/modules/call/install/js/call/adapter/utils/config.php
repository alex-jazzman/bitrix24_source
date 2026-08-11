<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/utils.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.lib.utils',
		'im.v2.lib.utils',
	],
	'skip_core' => true,
];
