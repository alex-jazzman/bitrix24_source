<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chat-dialog.bundle.css',
	'js' => 'dist/chat-dialog.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.popup',
		'im.v2.component.entity-selector',
		'im.v2.component.message-list',
		'im.v2.const',
		'im.v2.lib.access',
		'im.v2.lib.analytics',
		'im.v2.lib.animation',
		'im.v2.lib.call',
		'im.v2.lib.channel',
		'im.v2.lib.counter',
		'im.v2.lib.demo',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.parser',
		'im.v2.lib.permission',
		'im.v2.lib.quote',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.message',
		'main.core',
		'main.core.events',
		'main.popup',
		'pull.vue3.status',
	],
	'skip_core' => false,
];
