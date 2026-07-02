<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/header-menu.bundle.css',
	'js' => 'dist/header-menu.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.feature',
		'im.v2.lib.menu',
		'im.v2.lib.unread-mode',
		'im.v2.provider.service.chat',
		'main.core',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
