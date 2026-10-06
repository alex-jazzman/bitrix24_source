<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/call-manager.bundle.js',
	],
	'rel' => [
		'call.const',
		'call.core',
		'call.lib.call-slider-manager',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.access',
		'im.v2.lib.desktop-api',
		'im.v2.lib.logger',
		'im.v2.lib.promo',
		'im.v2.lib.slider',
		'im.v2.lib.sound-notification',
		'im.v2.provider.service.chat',
		'im_call_compatible',
		'main.core',
		'main.core.events',
		'ui.buttons',
	],
	'skip_core' => false,
];