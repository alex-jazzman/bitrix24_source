<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/sticker.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
		'main.core',
	],
	'skip_core' => false,
];
