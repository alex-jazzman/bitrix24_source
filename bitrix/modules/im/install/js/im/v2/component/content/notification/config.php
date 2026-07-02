<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notification-content.bundle.css',
	'js' => 'dist/notification-content.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.component.elements.attach',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.loader',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.user-list-popup',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.lib.analytics',
		'im.v2.lib.counter',
		'im.v2.lib.date-formatter',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.parser',
		'im.v2.lib.rest',
		'im.v2.lib.theme',
		'im.v2.lib.user',
		'im.v2.lib.utils',
		'im.v2.provider.service.notification',
		'im.v2.provider.service.settings',
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.date-picker',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.reactions-select',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.menu',
		'ui.vue3.components.button',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];