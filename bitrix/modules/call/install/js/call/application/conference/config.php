<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/conference.bundle.js',
	],
	'css' =>[
		'./dist/conference.bundle.css',
	],
	'rel' => [
		'call.application.conference-channel',
		'call.component.conference.conference-public',
		'call.const',
		'call.core',
		'call.lib.accident-logger',
		'call.lib.analytics',
		'call.lib.call-token-manager',
		'call.lib.settings-manager',
		'call.mapping',
		'call.model',
		'call.store',
		'im.application.launch',
		'im.const',
		'im.controller',
		'im.debug',
		'im.lib.clipboard',
		'im.lib.cookie',
		'im.lib.localstorage',
		'im.lib.logger',
		'im.lib.utils',
		'im.provider.pull',
		'im.v2.lib.desktop-api',
		'main.core',
		'main.core.events',
		'main.date',
		'promise',
		'pull.client',
		'rest.client',
		'ui.buttons',
		'ui.notification',
		'ui.notification-manager',
		'ui.progressround',
		'ui.viewer',
		'ui.vue',
		'ui.vue.vuex',
		'ui.vue3.pinia',
	],
	'lang' => ['/bitrix/modules/im/lang/'.LANGUAGE_ID.'/js_common.php', '/bitrix/modules/im/lang/'.LANGUAGE_ID.'/js_im.php'],
	'skip_core' => false,
];
