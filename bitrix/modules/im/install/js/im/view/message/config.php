<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/message.bundle.js',
	],
	'css' => [
		'./dist/message.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.const',
		'im.lib.animation',
		'im.lib.utils',
		'im.model',
		'im.view.message.body',
		'main.core.events',
		'ui.vue',
	],
	'skip_core' => true,
];