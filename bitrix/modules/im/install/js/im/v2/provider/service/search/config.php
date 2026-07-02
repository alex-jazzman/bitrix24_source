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
		'im.v2.lib.logger',
		'im.v2.lib.search',
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];
