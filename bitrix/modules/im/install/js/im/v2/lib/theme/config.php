<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/theme.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.collab',
		'im.v2.lib.feature',
		'main.core',
	],
	'skip_core' => false,
];
