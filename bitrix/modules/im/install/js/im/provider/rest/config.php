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
		'main.polyfill.core',
		'im.const',
		'im.lib.logger',
		'main.core.events',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];