<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('im'))
{
	return [];
}

return [
	'css' => 'dist/chat-content.bundle.css',
	'js' => 'dist/chat-content.bundle.js',
	'rel' => [
		'im.v2.lib.layout',
		'im.v2.lib.textarea',
		'im.v2.component.sidebar',
		'im.v2.component.entity-selector',
		'im.v2.lib.local-storage',
		'im.v2.lib.menu',
		'im.v2.lib.rest',
		'im.public',
		'im.v2.lib.call',
		'im.v2.component.animation',
		'im.v2.lib.utils',
		'ui.uploader.core',
		'im.v2.lib.theme',
		'main.core',
		'im.v2.application.core',
		'ui.notification',
		'im.v2.lib.permission',
		'im.v2.lib.logger',
		'im.v2.model',
		'im.v2.component.dialog.chat',
		'im.v2.component.message-list',
		'im.v2.component.textarea',
		'main.core.events',
		'im.v2.component.elements',
		'im.v2.const',
		'im.v2.provider.service',
	],
	'skip_core' => false,
	'settings' => [
		'isBitrixCallEnabled' => \Bitrix\Im\Call\Call::isBitrixCallEnabled(),
		'isZoomActive' => \Bitrix\Im\Call\Integration\Zoom::isActive(),
		'isZoomFeatureAvailable' => \Bitrix\Im\Call\Integration\Zoom::isAvailable(),
	]
];