<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sidebar.bundle.css',
	'js' => 'dist/sidebar.bundle.js',
	'rel' => [
		'im.v2.lib.local-storage',
		'im.v2.lib.sidebar',
		'ui.vue3.directives.lazyload',
		'ui.label',
		'main.date',
		'im.v2.lib.channel',
		'im.v2.component.elements.toggle',
		'im.v2.component.elements.auto-delete',
		'im.v2.lib.auto-delete',
		'ui.vue3.directives.hint',
		'im.v2.component.elements.copilot-roles-dialog',
		'im.v2.lib.rest',
		'ui.promo-video-popup',
		'ui.manual',
		'im.v2.lib.promo',
		'im.v2.lib.feature',
		'ui.viewer',
		'im.v2.provider.service.disk',
		'im.v2.model',
		'im.v2.component.elements.audioplayer',
		'ui.icons',
		'ui.notification',
		'rest.client',
		'ui.vue3.vuex',
		'im.v2.lib.market',
		'im.v2.lib.entity-creator',
		'im.v2.lib.analytics',
		'im.v2.lib.layout',
		'im.v2.component.entity-selector',
		'im.v2.lib.notifier',
		'im.v2.lib.menu',
		'im.v2.lib.call',
		'im.v2.provider.service.chat',
		'im.v2.lib.permission',
		'im.v2.lib.confirm',
		'im.v2.provider.service.message',
		'im.v2.lib.logger',
		'im.v2.lib.parser',
		'im.v2.lib.text-highlighter',
		'im.v2.component.elements.search-input',
		'main.core',
		'im.v2.lib.utils',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.avatar',
		'im.v2.lib.user',
		'im.v2.application.core',
		'main.core.events',
		'im.public',
		'im.v2.const',
		'im.v2.component.elements.loader',
		'im.v2.component.elements.button',
		'im.v2.lib.date-formatter',
	],
	'skip_core' => false,
];
