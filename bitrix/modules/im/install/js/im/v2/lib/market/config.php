<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => './dist/market.bundle.css',
	'js' => [
		'./dist/market.bundle.js',
	],
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
	],
	'skip_core' => false,
];
