<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/chatteaser.bundle.js',
	],
	'css' => [
		'./dist/chatteaser.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.lib.utils',
		'ui.design-tokens',
		'ui.vue',
	],
	'skip_core' => true,
];