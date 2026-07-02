<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/messenger.bundle.js',
	],
	'css' =>[
		'./dist/messenger.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.application.core',
		'im.component.dialog',
		'im.component.recent',
		'im.component.textarea',
		'im.const',
		'im.controller',
		'im.event-handler',
		'im.lib.utils',
		'im.provider.rest',
		'main.core.events',
		'pull.component.status',
		'ui.entity-selector',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];