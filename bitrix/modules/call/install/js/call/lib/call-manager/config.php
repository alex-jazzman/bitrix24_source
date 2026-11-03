<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;

// Extension::load() does not include the owner module, so `oninit` below cannot reach
// \Bitrix\Call\Settings on a page that has not included `call` itself. Guard here, the way
// call.core does: without the module CallManager has no engine to run on anyway.
if (!Loader::includeModule('call'))
{
	return [];
}

return [
	'js' => [
		'./dist/call-manager.bundle.js',
	],
	'rel' => [
		'call.application.conference-channel',
		'call.const',
		'call.engine.registry',
		'call.lib.call-slider-manager',
		'call.lib.sync-tab-banner-launcher',
		'call.mapping',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.access',
		'im.v2.lib.feature',
		'im.v2.lib.logger',
		'im.v2.lib.promo',
		'im.v2.lib.slider',
		'im.v2.lib.sound-notification',
		'im.v2.provider.service.chat',
		'im_call_compatible',
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.notification',
	],
	'skip_core' => false,
	'oninit' => function ()
	{
		return [
			'rel' => [
				\Bitrix\Call\Settings::isNewCoreEnabled()
					? 'call.engine.core'
					: 'call.engine.legacy',
			],
		];
	},
];
