<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/conference-public.bundle.js',
	],
	'css' => [
		'./dist/conference-public.bundle.css',
	],
	'rel' => [
		'call.component.call-feedback',
		'call.const',
		'call.core',
		'im.component.dialog',
		'im.component.textarea',
		'im.const',
		'im.event-handler',
		'im.lib.clipboard',
		'im.lib.cookie',
		'im.lib.desktop',
		'im.lib.logger',
		'im.lib.utils',
		'im.v2.lib.utils',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.forms',
		'ui.switcher',
		'ui.vue',
		'ui.vue.components.smiles',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];