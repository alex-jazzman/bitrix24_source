<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/folder-container.bundle.css',
	'js' => 'dist/folder-container.bundle.js',
	'rel' => [
		'im.v2.component.list.container.recent',
		'im.v2.component.list.items.folder',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.logger',
		'main.core',
		'main.core.events',
		'ui.vue3',
	],
	'skip_core' => false,
];
