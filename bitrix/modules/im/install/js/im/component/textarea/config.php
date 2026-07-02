<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/textarea.bundle.js',
	],
	'css' => [
		'./dist/textarea.bundle.css',
	],
	'rel' => [
		'im.const',
		'im.lib.localstorage',
		'im.lib.utils',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];