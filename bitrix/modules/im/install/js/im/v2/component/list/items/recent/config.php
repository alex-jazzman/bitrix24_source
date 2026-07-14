<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent-list.bundle.css',
	'js' => 'dist/recent-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.active-call-list',
		'im.v2.application.core',
		'im.v2.component.list.items.base',
		'im.v2.component.list.items.elements.create-chat-status',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.const',
		'im.v2.lib.create-chat',
		'im.v2.lib.draft',
		'im.v2.lib.feature',
		'im.v2.lib.invite',
		'im.v2.lib.menu',
		'im.v2.lib.unread-mode',
		'im.v2.provider.service.recent',
		'main.core.events',
		'ui.icon-set.api.core',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];