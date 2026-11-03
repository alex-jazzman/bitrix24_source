<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.component.list.items.base',
		'im.v2.component.list.items.elements.active-call-list',
		'im.v2.component.list.items.elements.create-chat-status',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.component.list.items.recent',
		'im.v2.const',
		'im.v2.lib.create-chat',
		'im.v2.lib.draft',
		'im.v2.lib.layout',
		'im.v2.lib.menu',
		'im.v2.lib.recent',
		'im.v2.lib.unread-mode',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.provider.service.recent',
		'main.core.events',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];