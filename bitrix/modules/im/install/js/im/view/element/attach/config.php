<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/attach.bundle.js',
	],
	'css' => [
		'./dist/attach.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.lib.utils',
		'im.model',
		'ui.design-tokens',
		'ui.icons.disk',
		'ui.vue',
		'ui.vue.directives.lazyload',
	],
	'skip_core' => true,
];