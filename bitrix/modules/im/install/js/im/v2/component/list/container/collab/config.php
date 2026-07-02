<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.component.elements.scroll-with-gradient',
		'im.v2.component.list.container.elements.create-chat-button',
		'im.v2.component.list.container.elements.create-chat-promo',
		'im.v2.component.list.container.elements.list-slider',
		'im.v2.component.list.container.elements.navigation-section',
		'im.v2.component.list.items.collab',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.create-chat',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.menu',
		'im.v2.lib.permission',
		'main.core',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
