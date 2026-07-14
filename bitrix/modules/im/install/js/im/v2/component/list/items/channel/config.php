<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/channel-list.bundle.css',
	'js' => 'dist/channel-list.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.elements.chat-title',
		'im.v2.component.list.items.base',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.menu',
		'im.v2.lib.rest',
		'im.v2.provider.service.recent',
		'main.core',
	],
	'skip_core' => false,
];