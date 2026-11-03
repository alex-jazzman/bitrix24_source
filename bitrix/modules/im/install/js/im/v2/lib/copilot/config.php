<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/copilot.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.input-action',
		'im.v2.lib.logger',
		'im.v2.lib.permission',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'im.v2.provider.service.copilot',
	],
	'skip_core' => true,
];
