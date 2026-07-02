<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/opener.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.call',
		'im.v2.lib.create-chat',
		'im.v2.lib.desktop-api',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.navigation',
		'im.v2.lib.phone',
		'im.v2.lib.slider',
		'im.v2.lib.utils',
		'im.v2.provider.service.bot',
		'main.core',
		'main.core.events',
		'main.sidepanel',
	],
	'skip_core' => false,
];
