<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/navigation.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.market',
		'im.v2.lib.phone',
		'im.v2.lib.utils',
		'main.core.events',
		'ui.info-helper',
	],
	'skip_core' => true,
];
