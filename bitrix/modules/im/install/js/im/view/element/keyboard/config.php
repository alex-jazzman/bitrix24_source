<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/keyboard.bundle.js',
	],
	'css' => [
		'./dist/keyboard.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.lib.logger',
		'im.lib.utils',
		'ui.design-tokens',
		'ui.vue',
	],
	'skip_core' => true,
];