<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$portalSettingsUrl = '';

if (\Bitrix\Main\Loader::includeModule('im'))
{
	$portalSettingsUrl = (new \Bitrix\Im\V2\Application\Config())->getPortalSettingsUrl();
}

return [
	'css' => 'dist/sidebar.bundle.css',
	'js' => 'dist/sidebar.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.component.elements.auto-delete',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.button',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.copilot-roles-dialog',
		'im.v2.component.elements.loader',
		'im.v2.component.elements.player',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.search-input',
		'im.v2.component.elements.toggle',
		'im.v2.component.entity-selector',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.auto-delete',
		'im.v2.lib.call',
		'im.v2.lib.channel',
		'im.v2.lib.chat',
		'im.v2.lib.collab',
		'im.v2.lib.confirm',
		'im.v2.lib.copilot',
		'im.v2.lib.counter',
		'im.v2.lib.date-formatter',
		'im.v2.lib.entity-creator',
		'im.v2.lib.feature',
		'im.v2.lib.guest',
		'im.v2.lib.helpdesk',
		'im.v2.lib.layout',
		'im.v2.lib.local-storage',
		'im.v2.lib.logger',
		'im.v2.lib.market',
		'im.v2.lib.menu',
		'im.v2.lib.notifier',
		'im.v2.lib.parser',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.rest',
		'im.v2.lib.sidebar',
		'im.v2.lib.text-highlighter',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.disk',
		'im.v2.provider.service.guest-invitation',
		'im.v2.provider.service.message',
		'main.core',
		'main.date',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icons',
		'ui.label',
		'ui.manual',
		'ui.notification',
		'ui.promo-video-popup',
		'ui.system.menu',
		'ui.viewer',
		'ui.vue3.directives.hint',
		'ui.vue3.directives.lazyload',
	],
	'skip_core' => false,
	'settings' => [
		'portalSettingsUrl' => $portalSettingsUrl,
	]
];
