<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/media.bundle.js',
	],
	'css' => [
		'./dist/media.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.const',
		'im.lib.utils',
		'im.model',
		'main.core.events',
		'ui.design-tokens',
		'ui.icons',
		'ui.progressbarjs.uploader',
		'ui.vue',
		'ui.vue.components.audioplayer',
		'ui.vue.components.socialvideo',
		'ui.vue.directives.lazyload',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];