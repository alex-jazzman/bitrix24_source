<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/message-notifier.bundle.js',
	],
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.desktop',
		'im.v2.lib.desktop-api',
		'im.v2.lib.parser',
		'im.v2.lib.sound-notification',
		'im.v2.provider.service.notification',
		'main.core',
		'main.core.events',
		'ui.notification-manager',
	],
	'skip_core' => false,
];
