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
		'im.v2.const',
		'im.v2.lib.collab',
		'main.core',
		'ui.a11y',
		'ui.notification',
	],
	'skip_core' => false,
];