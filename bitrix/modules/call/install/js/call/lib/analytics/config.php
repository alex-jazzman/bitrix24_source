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
		'call.const',
		'im.v2.const',
		'im.v2.lib.analytics',
		'main.core',
		'ui.analytics',
	],
	'skip_core' => false,
];