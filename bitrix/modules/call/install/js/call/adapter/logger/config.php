<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/logger.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.logger',
	],
	'skip_core' => true,
];
