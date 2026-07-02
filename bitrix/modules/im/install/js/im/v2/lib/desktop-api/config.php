<?php

use Bitrix\Main\Loader;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!Loader::includeModule('im'))
{
	return [];
}

return [
	'js' => [
		'./dist/desktop-api.bundle.js',
	],
	'rel' => [
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.utils',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
	'settings' => [
		'isChatWindow' => defined('BX_DESKTOP') && BX_DESKTOP,
		'v2' => !\Bitrix\Im\Settings::isLegacyChatActivated(),
	]
];
