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
		'ai.roles-dialog',
		'aiassistant.mcp-selector',
		'im.public',
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.content.elements',
		'im.v2.component.dialog.chat',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.button',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.loader',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.pulse-animation',
		'im.v2.component.elements.toggle',
		'im.v2.component.entity-selector',
		'im.v2.component.message-list',
		'im.v2.component.textarea',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.channel',
		'im.v2.lib.collab',
		'im.v2.lib.copilot',
		'im.v2.lib.counter',
		'im.v2.lib.create-chat',
		'im.v2.lib.feature',
		'im.v2.lib.invite',
		'im.v2.lib.layout',
		'im.v2.lib.local-storage',
		'im.v2.lib.logger',
		'im.v2.lib.menu',
		'im.v2.lib.message-component',
		'im.v2.lib.notifier',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.rest',
		'im.v2.lib.theme',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.comments',
		'im.v2.provider.service.copilot',
		'im.v2.provider.service.sending',
		'main.core',
		'main.core.events',
		'main.popup',
		'tasks.v2.application.task-card',
		'ui.dialogs.tooltip',
		'ui.icon-set.api.core',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.system.menu',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
