<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/body.bundle.js',
	],
	'css' => [
		'./dist/body.bundle.css',
	],
	'rel' => [
		'im.const',
		'im.lib.utils',
		'im.model',
		'im.view.element.attach',
		'im.view.element.chatteaser',
		'im.view.element.keyboard',
		'im.view.element.media',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.vue',
		'ui.vue.components.reaction',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];