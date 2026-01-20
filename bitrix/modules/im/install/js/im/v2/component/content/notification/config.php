<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notification-content.bundle.css',
	'js' => 'dist/notification-content.bundle.js',
	'rel' => [
		'main.polyfill.intersectionobserver',
		'im.v2.provider.service.notification',
		'im.v2.component.elements.user-list-popup',
		'im.v2.component.elements.loader',
		'im.v2.lib.theme',
		'im.v2.lib.rest',
		'ui.system.menu',
		'im.v2.provider.service.settings',
		'im.v2.lib.notifier',
		'ui.icon-set.api.vue',
		'im.v2.lib.utils',
		'main.core.events',
		'im.v2.component.elements.attach',
		'im.v2.lib.date-formatter',
		'ui.vue3.components.button',
		'im.v2.component.elements.avatar',
		'ui.reactions-select',
		'im.v2.lib.parser',
		'im.public',
		'im.v2.component.elements.chat-title',
		'ui.forms',
		'im.v2.lib.esc-manager',
		'ui.vue3.vuex',
		'main.core',
		'im.v2.application.core',
		'im.v2.lib.user',
		'im.v2.lib.logger',
		'im.v2.const',
	],
	'skip_core' => false,
];