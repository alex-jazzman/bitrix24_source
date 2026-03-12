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
		'main.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.rest',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
	],
	'skip_core' => false,
];
