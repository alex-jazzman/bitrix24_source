<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent.bundle.css',
	'js' => 'dist/recent.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.const',
		'im.lib.utils',
		'main.core.events',
		'ui.design-tokens',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];