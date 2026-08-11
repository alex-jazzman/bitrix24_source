<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/uploader.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.lib.uploader',
	],
	'skip_core' => true,
];
