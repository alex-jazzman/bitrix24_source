<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'/bitrix/js/imopenlines/component/widget/dist/widget.bundle.js',
	],
	'css' =>[
		'/bitrix/js/imopenlines/component/widget/dist/widget.bundle.css',
	],
	'rel' => [
		'im.component.dialog',
		'im.component.textarea',
		'im.const',
		'im.controller',
		'im.event-handler',
		'im.lib.cookie',
		'im.lib.localstorage',
		'im.lib.logger',
		'im.lib.uploader',
		'im.lib.utils',
		'im.provider.rest',
		'im.view.quotepanel',
		'imopenlines.component.form',
		'imopenlines.component.message',
		'main.core',
		'main.core.events',
		'main.core.minimal',
		'main.date',
		'main.md5',
		'main.polyfill.customevent',
		'pull.client',
		'pull.component.status',
		'rest.client',
		'ui.vue',
		'ui.vue.components.crm.form',
		'ui.vue.components.smiles',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];