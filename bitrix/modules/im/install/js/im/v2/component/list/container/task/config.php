<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task-container.bundle.css',
	'js' => 'dist/task-container.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.list.items.task',
		'im.v2.lib.logger',
		'im.v2.lib.entity-creator',
		'im.v2.component.list.container.elements.base-header-menu',
		'im.v2.component.elements.menu',
		'im.v2.const',
		'im.v2.lib.confirm',
		'im.v2.provider.service.chat',
	],
	'skip_core' => true,
];
