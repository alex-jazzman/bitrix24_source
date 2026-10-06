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
		'im.v2.component.list.items.base',
		'im.v2.component.list.items.elements.create-chat-status',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.const',
		'im.v2.lib.collab',
		'im.v2.lib.copilot',
		'im.v2.lib.create-chat',
		'im.v2.lib.draft',
		'im.v2.lib.menu',
		'im.v2.lib.notifier',
		'im.v2.lib.unread-mode',
		'im.v2.lib.utils',
		'im.v2.provider.service.recent',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
