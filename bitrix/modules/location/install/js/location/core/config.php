<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'rel' => [
		'location.core',
		'main.core',
		'main.core.events',
		'main.md5',
	],
	'skip_core' => false,
	'js' => './dist/core.bundle.js'
];
