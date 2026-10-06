<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/folder-list.bundle.css',
	'js' => 'dist/folder-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.component.list.items.base',
		'im.v2.component.list.items.elements.empty-state',
		'im.v2.const',
		'im.v2.lib.draft',
		'im.v2.lib.layout',
		'im.v2.lib.menu',
		'im.v2.provider.service.recent',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];