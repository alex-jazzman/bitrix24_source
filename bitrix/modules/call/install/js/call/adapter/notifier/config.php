<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/notifier.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.notifier',
	],
	'skip_core' => true,
];
