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
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.feature',
		'im.v2.lib.message-component',
		'main.core',
		'ui.analytics',
	],
	'skip_core' => false,
];
