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
		'im.v2.provider.service.settings',
		'im.v2.lib.notifier',
		'im.v2.lib.analytics',
		'im.v2.lib.utils',
		'im.v2.component.elements.attach',
		'im.v2.lib.date-formatter',
		'im.v2.component.elements.avatar',
		'ui.reactions-select',
		'im.v2.lib.parser',
		'im.public',
		'im.v2.component.elements.chat-title',
		'ui.vue3.vuex',
		'ui.system.chip.vue',
		'im.v2.component.elements.popup',
		'ui.vue3.components.button',
		'ui.icon-set.api.core',
		'ui.entity-selector',
		'main.core.events',
		'main.popup',
		'ui.system.menu',
		'ui.date-picker',
		'ui.system.input.vue',
		'ui.icon-set.api.vue',
		'im.v2.css.classes',
		'main.core',
		'im.v2.application.core',
		'im.v2.lib.user',
		'im.v2.lib.logger',
		'im.v2.const',
	],
	'skip_core' => false,
];