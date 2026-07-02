<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/context.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.lib.rest',
		'main.core.events',
	],
	'skip_core' => true,
];