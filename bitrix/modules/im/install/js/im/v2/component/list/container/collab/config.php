<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.list-loading-state',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.scroll-with-gradient',
		'im.v2.component.list.container.elements.create-chat-button',
		'im.v2.component.list.container.elements.create-chat-promo',
		'im.v2.component.list.container.elements.header-menu',
		'im.v2.component.list.container.elements.list-slider',
		'im.v2.component.list.container.elements.navigation-section',
		'im.v2.component.list.items.collab',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.chat',
		'im.v2.lib.collab',
		'im.v2.lib.create-chat',
		'im.v2.lib.entity-creator',
		'im.v2.lib.feature',
		'im.v2.lib.logger',
		'im.v2.lib.menu',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.system.highlighter',
	],
	'skip_core' => false,
];
