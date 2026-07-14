<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/notifier.bundle.js',
	],
	'rel' => [
		'im.public',
		'im.v2.const',
		'im.v2.lib.collab',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];