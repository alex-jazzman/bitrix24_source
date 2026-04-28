<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent-list.bundle.css',
	'js' => 'dist/recent-list.bundle.js',
	'rel' => [
		'call.component.active-call-list',
		'main.core.events',
		'ui.icon-set.api.vue',
		'im.public',
		'im.v2.lib.create-chat',
		'im.v2.component.elements.button',
		'im.v2.lib.feature',
		'im.v2.lib.invite',
		'im.v2.component.list.items.elements.input-action-indicator',
		'im.v2.component.elements.chat-title',
		'im.v2.lib.date-formatter',
		'im.v2.lib.channel',
		'main.core',
		'main.date',
		'im.v2.lib.parser',
		'im.v2.component.elements.avatar',
		'im.v2.lib.counter',
		'im.v2.application.core',
		'im.v2.lib.recent',
		'im.v2.component.elements.list-loading-state',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.const',
		'im.v2.lib.draft',
		'im.v2.lib.menu',
		'im.v2.lib.utils',
		'im.v2.model',
		'im.v2.provider.service.recent',
	],
	'skip_core' => false,
];