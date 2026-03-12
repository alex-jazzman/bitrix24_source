<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.sidepanel',
		'ui.sidepanel.layout',
		'ui.system.input.vue',
		'im.v2.lib.notifier',
		'im.v2.provider.service.sticker',
		'ui.vue3.components.button',
		'ui.vue3.components.rich-loc',
		'ui.icon-set.api.core',
		'im.v2.lib.helpdesk',
		'ui.uploader.tile-widget',
		'ui.uploader.core',
		'im.v2.const',
		'im.v2.lib.permission',
		'im.v2.lib.sticker',
		'ui.icon-set.api.vue',
		'main.core',
		'main.core.events',
		'im.v2.application.core',
	],
	'skip_core' => false,
];
