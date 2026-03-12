<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'css' => 'dist/sticker.bundle.css',
    'js' => 'dist/sticker.bundle.js',
    'rel' => [
		'main.core',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.component.elements.popup',
		'ui.vue3.components.button',
		'im.v2.lib.menu',
		'im.v2.provider.service.sticker',
		'im.v2.component.sticker',
		'im.v2.lib.notifier',
		'im.v2.lib.analytics',
		'im.v2.application.core',
		'im.v2.component.elements.loader',
		'im.v2.const',
		'ui.icon-set.api.vue',
	],
    'skip_core' => false,
];

