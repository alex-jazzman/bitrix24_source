<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('socialnetwork'))
{
	return [];
}

$provider = new \Bitrix\Socialnetwork\V2\Public\Provider\CalendarSettingsProvider();

return [
	'css' => 'dist/calendar.bundle.css',
	'js' => 'dist/calendar.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'socialnetwork.v2.lib.timezone',
	],
	'skip_core' => false,
	'settings' => $provider->get(),
];
