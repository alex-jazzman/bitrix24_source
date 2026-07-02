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
		'call.lib.call-token-manager',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.copilot',
		'im.v2.lib.counter',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
		'im.v2.lib.role-manager',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.lib.uuid',
		'im.v2.provider.service.message',
		'main.core',
		'ui.uploader.core',
	],
	'skip_core' => false,
];
