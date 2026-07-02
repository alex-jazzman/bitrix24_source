<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/controller.bundle.js',
	],
	'rel' => [
		'main.polyfill.core',
		'im.const',
		'im.lib.logger',
		'im.lib.timer',
		'im.lib.utils',
		'im.model',
		'im.provider.pull',
		'im.provider.rest',
		'pull.client',
		'rest.client',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];
