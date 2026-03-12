<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/accident-logger.bundle.js',
	],
	'rel' => [
		'call.lib.settings-manager',
		'main.core',
	],
	'skip_core' => false,
];
