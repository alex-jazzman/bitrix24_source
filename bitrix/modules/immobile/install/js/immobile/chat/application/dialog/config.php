<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/dialog.bundle.js',
	],
	'css' =>[
		'./dist/dialog.bundle.css',
	],
	'rel' => [
		'main.polyfill.core',
		'im.component.dialog',
		'im.const',
		'im.event-handler',
		'im.lib.localstorage',
		'im.lib.logger',
		'im.lib.timer',
		'im.lib.utils',
		'im.model',
		'im.provider.rest',
		'im.view.quotepanel',
		'immobile.chat.application.core',
		'main.core.events',
		'main.date',
		'mobile.pull.client',
		'pull.component.status',
		'ui.fonts.opensans',
		'ui.vue',
		'ui.vue.components.smiles',
		'ui.vue.vuex',
	],
	'skip_core' => true,
];