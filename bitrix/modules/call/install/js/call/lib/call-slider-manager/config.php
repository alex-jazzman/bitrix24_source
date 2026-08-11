<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/call-slider-manager.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.confirm',
		'main.core.events',
	],
	'skip_core' => true,
];