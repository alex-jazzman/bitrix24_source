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
		'main.core.events',
		'im.v2.lib.confirm',
		'call.lib.call-manager',
	],
	'skip_core' => true,
];