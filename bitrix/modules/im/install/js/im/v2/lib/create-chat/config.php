<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/create-chat.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'main.core.events',
	],
	'skip_core' => true,
];