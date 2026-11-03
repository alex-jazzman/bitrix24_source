<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Call\Settings;

return [
	'js' => './dist/sync-active-calls-slot.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.vue3',
	],
	'oninit' => function ()
	{
		if (!Loader::includeModule('call'))
		{
			return [];
		}

		return [
			'settings' => [
				'syncActiveCallsEnabled' => Settings::isSyncActiveCallsEnabled(),
			],
		];
	},
	'skip_core' => false,
];
