<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/dialog.bundle.js',
	],
	'css' => [
		'./dist/dialog.bundle.css',
	],
	'rel' => [
		'im.const',
		'im.lib.animation',
		'im.lib.logger',
		'im.lib.utils',
		'im.view.message',
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];