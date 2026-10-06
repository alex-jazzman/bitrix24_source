<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/registry.bundle.js',
	],
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.call',
		'im.v2.lib.channel',
		'im.v2.lib.chat',
		'im.v2.lib.copilot',
		'im.v2.lib.counter',
		'im.v2.lib.desktop',
		'im.v2.lib.folder',
		'im.v2.lib.input-action',
		'im.v2.lib.layout',
		'im.v2.lib.local-storage',
		'im.v2.lib.logger',
		'im.v2.lib.message-notifier',
		'im.v2.lib.notifier',
		'im.v2.lib.promo',
		'im.v2.lib.role-manager',
		'im.v2.lib.slider',
		'im.v2.lib.unread-mode',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.lib.uuid',
		'im.v2.provider.service.message',
		'main.core',
		'main.core.events',
		'main.sidepanel',
	],
	'skip_core' => false,
];
