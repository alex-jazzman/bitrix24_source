<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/sidebar.bundle.js',
	],
	'css' => [
		'./dist/sidebar.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.application.core',
		'im.view.list.recent',
		'im.view.list.sidebar',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];