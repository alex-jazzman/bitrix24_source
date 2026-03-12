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
		'main.core.events',
		'call.core',
		'im.public',
		'im.v2.provider.service.chat',
		'im.v2.lib.slider',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.promo',
		'im.v2.lib.sound-notification',
		'im.v2.lib.desktop-api',
		'rest.client',
		'call.lib.call-slider-manager',
		'im_call_compatible',
		'main.core',
		'ui.buttons',
		'im.v2.application.core',
	],
	'skip_core' => false,
];