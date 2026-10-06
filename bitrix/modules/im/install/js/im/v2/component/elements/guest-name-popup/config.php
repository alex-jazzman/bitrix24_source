<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/guest-name-popup.bundle.css',
	'js' => 'dist/guest-name-popup.bundle.js',
	'rel' => [
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.popup',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.guest',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
		'im.v2.lib.user',
		'main.core',
		'main.core.events',
		'ui.system.input.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => false,
];
