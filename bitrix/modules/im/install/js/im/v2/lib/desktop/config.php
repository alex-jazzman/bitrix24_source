<?php

use Bitrix\Im\V2\Application\Config;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$desktopIsActive = false;
$desktopActiveVersion = 0;
$internetCheckUrl = '';

if (\Bitrix\Main\Loader::includeModule('im'))
{
	$desktopIsActive = CIMMessenger::CheckDesktopStatusOnline();
	$desktopActiveVersion = $desktopIsActive ? CIMMessenger::GetDesktopVersion() : 0;
	$internetCheckUrl = (new Config())->getInternetCheckLink();
}

return [
	'js' => [
		'./dist/desktop-manager.bundle.js',
	],
	'rel' => [
		'im.public',
		'im.v2.lib.rest',
		'im.v2.lib.call',
		'im.v2.application.core',
		'main.core.events',
		'main.core',
		'im.v2.lib.utils',
		'im.v2.const',
		'im.v2.lib.desktop-api',
		'im.v2.lib.logger',
	],
	'skip_core' => false,
	'settings' => [
		'desktopIsActive' => $desktopIsActive,
		'desktopActiveVersion' => $desktopActiveVersion,
		'internetCheckUrl' => $internetCheckUrl,
	]
];