<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/uploading.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.desktop-api',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'im.v2.provider.service.sending',
		'main.core',
		'main.core.events',
		'ui.uploader.core',
	],
	'skip_core' => false,
];
