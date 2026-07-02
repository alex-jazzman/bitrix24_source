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
		'im.const',
		'im.lib.logger',
		'im.lib.utils',
		'main.core',
		'main.core.events',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];