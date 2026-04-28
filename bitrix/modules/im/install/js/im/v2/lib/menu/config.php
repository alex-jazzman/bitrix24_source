<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.core.events',
		'main.popup',
		'ui.vue3.vuex',
		'ui.dialogs.messagebox',
		'im.v2.lib.call',
		'im.v2.lib.invite',
		'im.v2.provider.service.recent',
		'im.public',
		'im.v2.provider.service.chat',
		'im.v2.lib.chat',
		'im.v2.lib.entity-creator',
		'im.v2.lib.market',
		'im.v2.lib.message',
		'im.v2.lib.parser',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'im.v2.lib.feature',
		'im.v2.provider.service.disk',
		'im.v2.provider.service.message',
		'im.v2.lib.channel',
		'im.v2.lib.analytics',
		'im.v2.lib.copilot',
		'im.v2.lib.feedback',
		'im.v2.lib.confirm',
		'im.v2.lib.notifier',
		'im.v2.lib.permission',
		'main.core',
		'ui.icon-set.api.core',
		'ui.system.menu',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.provider.service.sending',
		'im.v2.provider.service.sticker',
	],
	'skip_core' => false,
];
