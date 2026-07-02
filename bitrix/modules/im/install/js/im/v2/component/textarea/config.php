<?php

use \Bitrix\Main\Config\Option;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('im'))
{
	return [];
}

return [
	'css' => 'dist/textarea.bundle.css',
	'js' => 'dist/textarea.bundle.js',
	'rel' => [
		'calendar.sharing.interface',
		'file_dialog',
		'im.public',
		'im.v2.application.core',
		'im.v2.component.elements.auto-delete',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.loader',
		'im.v2.component.elements.media-gallery',
		'im.v2.component.elements.menu',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.pulse-animation',
		'im.v2.component.elements.scroll-with-gradient',
		'im.v2.component.elements.send-button',
		'im.v2.component.sticker',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.auto-delete',
		'im.v2.lib.channel',
		'im.v2.lib.copilot',
		'im.v2.lib.desktop-api',
		'im.v2.lib.directives',
		'im.v2.lib.draft',
		'im.v2.lib.entity-creator',
		'im.v2.lib.esc-manager',
		'im.v2.lib.feature',
		'im.v2.lib.hotkey',
		'im.v2.lib.input-action',
		'im.v2.lib.local-storage',
		'im.v2.lib.logger',
		'im.v2.lib.market',
		'im.v2.lib.menu',
		'im.v2.lib.message',
		'im.v2.lib.notifier',
		'im.v2.lib.parser',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.quote',
		'im.v2.lib.rest',
		'im.v2.lib.search',
		'im.v2.lib.smile-manager',
		'im.v2.lib.sound-notification',
		'im.v2.lib.sticker',
		'im.v2.lib.text-highlighter',
		'im.v2.lib.textarea',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.collab-invitation',
		'im.v2.provider.service.message',
		'im.v2.provider.service.sending',
		'im.v2.provider.service.sticker',
		'im.v2.provider.service.uploading',
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icons',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.uploader.core',
		'ui.vue3.components.rich-loc',
		'vote.application',
	],
	'skip_core' => false,
	'settings' => [
		'maxLength' => \CIMMessenger::MESSAGE_LIMIT,
		'minSearchTokenSize' => \Bitrix\Main\ORM\Query\Filter\Helper::getMinTokenSize(),
	]
];
