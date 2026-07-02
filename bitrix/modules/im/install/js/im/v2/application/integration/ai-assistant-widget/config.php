<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/ai-assistant-widget.bundle.js',
	'css' => 'dist/ai-assistant-widget.bundle.css',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.content.chat',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.loader',
		'im.v2.component.list.items.copilot',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.lib.analytics',
		'im.v2.lib.draft',
		'im.v2.lib.feature',
		'im.v2.lib.logger',
		'im.v2.lib.message-notifier',
		'im.v2.lib.theme',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.copilot',
		'main.core.events',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
