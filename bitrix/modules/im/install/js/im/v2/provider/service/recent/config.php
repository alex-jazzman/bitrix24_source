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
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.copilot',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.rest',
		'im.v2.lib.user',
		'main.core',
	],
	'skip_core' => false,
];
