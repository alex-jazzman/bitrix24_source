<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (\Bitrix\Im\Call\Call::isNewCallLayoutEnabled())
{
	$cssBundleFile = './dist/conference.bundle.css';
}
else
{
	$cssBundleFile = './dist/conference_old.bundle.css';
}

return [
	'js' => [
		'./dist/conference.bundle.js',
	],
	'css' =>[
		$cssBundleFile,
	],
	'rel' => [
		'call.core',
		'im.debug',
		'im.application.launch',
		'im.component.conference.conference-public',
		'im.v2.lib.desktop-api',
		'im.model',
		'im.controller',
		'im.lib.cookie',
		'im.lib.localstorage',
		'im.lib.logger',
		'im.lib.clipboard',
		'im.lib.desktop',
		'im.const',
		'ui.notification-manager',
		'ui.notification',
		'ui.buttons',
		'ui.progressround',
		'ui.viewer',
		'ui.vue',
		'ui.vue.vuex',
		'main.core',
		'promise',
		'main.date',
		'main.core.events',
		'pull.client',
		'im.provider.pull',
		'rest.client',
		'im.lib.utils',
	],
	'lang' => '/bitrix/modules/im/lang/'.LANGUAGE_ID.'/js_common.php',
	'skip_core' => false,
];