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
		'im.lib.logger',
		'main.core.events',
		'ui.vue',
		'ui.vue.vuex',
		'im.lib.utils',
		'main.core',
		'im.const',
	],
	'skip_core' => false,
];