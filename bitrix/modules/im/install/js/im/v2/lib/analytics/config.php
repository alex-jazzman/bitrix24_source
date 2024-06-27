<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/analytics.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'ui.analytics',
		'im.v2.const',
		'im.v2.application.core',
	],
	'skip_core' => true,
];