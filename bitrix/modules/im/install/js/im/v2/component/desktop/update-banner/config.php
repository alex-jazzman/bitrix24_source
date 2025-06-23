<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$config = new \Bitrix\Im\V2\Application\Config();

return [
	'css' => 'dist/update-banner.bundle.css',
	'js' => 'dist/update-banner.bundle.js',
	'rel' => [
		'main.core',
		'im.v2.lib.desktop-api',
		'im.v2.lib.analytics',
		'im.v2.lib.helpdesk',
		'im.v2.lib.utils',
	],
	'skip_core' => false,
	'settings' => [
		'desktopDownloadUrl' => $config->getDesktopDownloadLink(),
	],
];