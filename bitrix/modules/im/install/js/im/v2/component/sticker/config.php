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
		'im.v2.const',
		'im.v2.lib.helpdesk',
		'im.v2.lib.notifier',
		'im.v2.lib.permission',
		'im.v2.lib.sticker',
		'im.v2.provider.service.sticker',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.sidepanel.layout',
		'ui.system.input.vue',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.vue3.components.button',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => false,
];
