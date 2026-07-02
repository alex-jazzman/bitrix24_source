<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-container.bundle.css',
	'js' => 'dist/task-container.bundle.js',
	'rel' => [
		'im.v2.component.list.container.elements.create-chat-button',
		'im.v2.component.list.container.elements.header-menu',
		'im.v2.component.list.items.task',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.entity-creator',
		'im.v2.lib.logger',
		'main.core',
	],
	'skip_core' => false,
];
