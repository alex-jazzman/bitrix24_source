<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/example.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.application.core',
		'im.lib.logger',
		'ui.vue',
	],
	'skip_core' => true,
];